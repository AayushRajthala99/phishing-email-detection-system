#!/usr/bin/env python3

import asyncio
import aiohttp
import hashlib
import os
import time
from pathlib import Path
from typing import List, Dict, Optional

# =========================
# CONFIG
# =========================

VT_API_KEY = os.getenv("VT_API_KEY")
VT_BASE = "https://www.virustotal.com/api/v3"

# Free tier friendly defaults
MAX_CONCURRENCY = 2
ANALYSIS_POLL_INTERVAL = 15  # seconds
ANALYSIS_TIMEOUT = 180  # seconds

HEADERS = {"x-apikey": VT_API_KEY}

if not VT_API_KEY:
    raise RuntimeError("VT_API_KEY environment variable not set")

# =========================
# UTILS
# =========================


def sha256_file(path: Path, chunk_size: int = 8192) -> str:
    sha256 = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(chunk_size), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


# =========================
# VT API CALLS
# =========================


async def get_file_report(session, sha256: str, sem) -> Optional[Dict]:
    url = f"{VT_BASE}/files/{sha256}"
    async with sem:
        async with session.get(url) as resp:
            if resp.status == 200:
                return await resp.json()
            if resp.status == 404:
                return None
            raise RuntimeError(f"GET /files failed: {resp.status} {await resp.text()}")


async def upload_file(session, file_path: Path, sem) -> str:
    url = f"{VT_BASE}/files"
    data = aiohttp.FormData()
    data.add_field("file", file_path.open("rb"), filename=file_path.name)

    async with sem:
        async with session.post(url, data=data) as resp:
            if resp.status not in (200, 202):
                raise RuntimeError(f"Upload failed: {resp.status} {await resp.text()}")

            json_resp = await resp.json()
            return json_resp["data"]["id"]  # analysis_id


async def get_analysis(session, analysis_id: str, sem) -> Dict:
    url = f"{VT_BASE}/analyses/{analysis_id}"
    async with sem:
        async with session.get(url) as resp:
            if resp.status != 200:
                raise RuntimeError(f"Analysis fetch failed: {resp.status}")
            return await resp.json()


# =========================
# ANALYSIS HANDLING
# =========================


async def wait_for_analysis(session, analysis_id: str, sem) -> None:
    start = time.time()

    while True:
        analysis = await get_analysis(session, analysis_id, sem)
        status = analysis["data"]["attributes"]["status"]

        if status == "completed":
            return

        if time.time() - start > ANALYSIS_TIMEOUT:
            raise TimeoutError("VT analysis timed out")

        await asyncio.sleep(ANALYSIS_POLL_INTERVAL)


def extract_score(report: Dict) -> Dict:
    stats = report["data"]["attributes"]["last_analysis_stats"]
    total = sum(stats.values())

    return {
        "malicious": stats.get("malicious", 0),
        "suspicious": stats.get("suspicious", 0),
        "harmless": stats.get("harmless", 0),
        "undetected": stats.get("undetected", 0),
        "total_engines": total,
        "malicious_ratio": (stats.get("malicious", 0) / total if total else 0),
    }


# =========================
# PER-FILE PIPELINE
# =========================


async def process_file(session, file_path: Path, sem) -> Dict:
    sha256 = sha256_file(file_path)

    report = await get_file_report(session, sha256, sem)

    if not report:
        analysis_id = await upload_file(session, file_path, sem)
        await wait_for_analysis(session, analysis_id, sem)
        report = await get_file_report(session, sha256, sem)

    return {"file": file_path.name, "sha256": sha256, "score": extract_score(report)}


# =========================
# BATCH DRIVER
# =========================


async def vt_batch_scan(
    file_paths: List[Path], concurrency: int = MAX_CONCURRENCY
) -> List[Dict]:

    sem = asyncio.Semaphore(concurrency)

    async with aiohttp.ClientSession(headers=HEADERS) as session:
        tasks = [process_file(session, path, sem) for path in file_paths]
        return await asyncio.gather(*tasks)


# =========================
# ENTRYPOINT
# =========================

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(
        description="Async VirusTotal batch file scanner (API v3)"
    )
    parser.add_argument("path", help="File or directory to scan")
    parser.add_argument(
        "--concurrency", type=int, default=MAX_CONCURRENCY, help="Parallel VT requests"
    )

    args = parser.parse_args()
    target = Path(args.path)

    if target.is_file():
        files = [target]
    elif target.is_dir():
        files = [p for p in target.iterdir() if p.is_file()]
    else:
        raise ValueError("Invalid path")

    results = asyncio.run(vt_batch_scan(files, concurrency=args.concurrency))

    print(json.dumps(results, indent=2))
