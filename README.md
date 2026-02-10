# 🛡️ Phishing Email Detection System

A ML-powered phishing email detection system that uses machine learning to detect spam and phishing emails with high accuracy. Built with FastAPI and MongoDB for backend, Next.js and Tailwind CSS for frontend, containerized with Docker for easy deployment and configured with Github Actions over Tailscale for CI/CD.

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PhishingEmailDetectionSystem](https://github.com/AayushRajthala99/phishing-email-detection-system/actions/workflows/master.yml/badge.svg?branch=master)](https://github.com/AayushRajthala99/phishing-email-detection-system/actions/workflows/master.yml)

---

## Table of Contents

- [Features](#features)
- [Architecture Design](#architecture-design)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Security Features](#security-features)
- [License](#license)

---

## Features

### 🤖 Machine Learning Pipeline

- **TF-IDF Vectorization** with **Logistic Regression** classifier for email classification
- Pre-trained on curated phishing/legitimate email dataset with high accuracy

### 📧 Threat Intelligence & Forensics

- **NLP-based content analysis** of subject lines, body text, and metadata
- **SHA256 cryptographic hashing** for attachment fingerprinting and VT analysis
- **MIME type detection** and multi-attachment processing pipeline

### 💾 Persistent Analytics Layer

- **MongoDB document store** with indexed collections for temporal and categorical queries
- **RESTful reporting API** with historical prediction retrieval and audit trails
- **Compound indexes** on timestamp, prediction type, and SHA256 for optimized analytics

### 🔒 Security & Resilience

- **IP-based rate limiting** (100 req/min default) with 429 throttling responses
- **OWASP-compliant security headers** (CSP, X-Frame-Options, X-Content-Type-Options)
- **Network segmentation** with MongoDB on private bridge network (no public exposure)
- **Pydantic schema validation** for type-safe request/response handling

---

## Architecture Design
<p align="center">
<img width="787" height="934" alt="Phishing Email Detection System-Architecture Diagram" src="https://github.com/user-attachments/assets/13f56fa0-c737-4374-86fc-5c02b6751290" />
</p>

## Data Flow Diagram
<p align="center">
<img width="772" height="1071" alt="Phishing Email Detection System-Data Flow Diagram" src="https://github.com/user-attachments/assets/aac26d4b-45d1-4025-b645-582fc4157d67" style="align-self:center"/>
</p>

## Technology Stack

| Layer             | Technology                           | Purpose                                            |
| ----------------- | ------------------------------------ | -------------------------------------------------- |
| **ML Engine**     | Scikit-learn 1.4+                    | TF-IDF vectorization & Logistic Regression         |
| **API Framework** | FastAPI 0.109+                       | Async ASGI REST API with auto-docs                 |
| **Data Layer**    | MongoDB 7.0 + Motor 3.3+             | Async document store with connection pooling       |
| **Validation**    | Pydantic 2.6+                        | Runtime type checking & schema validation          |
| **Frontend**      | Next.js 16.0 + TypeScript            | SSR React framework with type safety               |
| **Styling**       | Tailwind CSS + Radix UI              | Utility-first CSS with accessible components       |
| **Orchestration** | Docker Compose + BuildKit            | Multi-container deployment with build optimization |
| **Runtime**       | Python 3.12 Slim + Node.js 22 Alpine | Lightweight production containers                  |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: 20.10 or higher ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: 2.0 or higher (Usually included with Docker Desktop)
- **Git**: For cloning the repository

Optional (for local development without Docker):

- **Python**: 3.12 or higher
- **Node.js**: 22 or higher
- **npm** or **yarn**: Package manager

---

## Quick Start

### Docker Deployment (Recommended)

```bash
# Clone repository
git clone https://github.com/AayushRajthala99/phishing-email-detection-system.git
cd phishing-email-detection-system

# Enable BuildKit for optimized builds (Windows PowerShell)
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1

# Start all services (Frontend, Backend, MongoDB)
docker compose up --build -d

# Verify deployment
docker compose ps
```

**Endpoints:**

- 🌐 **Frontend UI**: http://localhost:3000
- 🔌 **REST API**: http://localhost:5000
- 📚 **API Docs**: http://localhost:5000/docs

**Teardown:**

```bash
docker compose down -v  # Remove containers and volumes
```

### Local Development Setup

**Prerequisites:**

- Python 3.12+
- Node.js 22+
- MongoDB 7.0+ (or use Docker for MongoDB only)

#### Option 1: Full Docker Stack (Recommended)

```bash
# Enable BuildKit
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1

# Start all services
docker compose up --build
```

#### Option 2: Backend + MongoDB in Docker, Frontend Local

```bash
# Start MongoDB and Backend
docker compose up mongodb backend -d

# In new terminal, run Frontend locally
cd frontend
npm install
npm run dev
```

#### Option 3: Full Local Development

```bash
# Terminal 1: Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Terminal 2: Backend
cd backend
python -m venv .venv
.\.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/macOS

pip install -r requirements.txt
$env:MONGODB_URI="mongodb://localhost:27017"
uvicorn app:app --host 0.0.0.0 --port 3000 --reload

# Terminal 3: Frontend
cd frontend
npm install
npm run dev
```

**Access:**

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/redoc

---

## Project Structure

```
phishing-email-detection-system/
  ├── README.md
  ├── docker-compose.yml
  ├── LICENSE
  ├── swagger.yml
  ├── .dockerignore
  ├── .env.example
  ├── backend/
  │   ├── app.py
  │   ├── cache.py
  │   ├── config.py
  │   ├── database.py
  │   ├── Dockerfile
  │   ├── middleware.py
  │   ├── requirements.txt
  │   ├── .dockerignore
  │   └── models/
  │       └── spam_classifier_model.pkl
  ├── frontend/
  │   ├── README.md
  │   ├── components.json
  │   ├── Dockerfile
  │   ├── eslint.config.mjs
  │   ├── next.config.ts
  │   ├── package.json
  │   ├── postcss.config.mjs
  │   ├── tsconfig.json
  │   ├── .dockerignore
  │   ├── app/
  │   │   ├── globals.css
  │   │   ├── layout.tsx
  │   │   ├── page.tsx
  │   │   └── reports/
  │   │       ├── page.tsx
  │   │       ├── reportClient.tsx
  │   │       └── [id]/
  │   │           ├── page.tsx
  │   │           └── ReportDetailClient.tsx
  │   ├── components/
  │   │   └── ui/
  │   │       ├── alert.tsx
  │   │       ├── badge.tsx
  │   │       ├── button.tsx
  │   │       ├── card.tsx
  │   │       ├── input.tsx
  │   │       ├── label.tsx
  │   │       ├── navbar.tsx
  │   │       ├── progress.tsx
  │   │       ├── report-card.tsx
  │   │       └── textarea.tsx
  │   └── lib/
  │       ├── api.ts
  │       ├── types.ts
  │       └── utils.ts
  └── .github/
      └── workflows/
          └── master.yml
```
---

## Configuration

### Environment Variables

Create `backend/.env` (optional, defaults provided):

```bash
# Database
MONGODB_URI=mongodb://mongodb:27017
MONGODB_DB_NAME=phishing_detection
CONNECTION_POOL_MIN_SIZE=10
CONNECTION_POOL_MAX_SIZE=50

# Performance
CACHE_TTL_REPORTS=60          # All reports cache (seconds)
CACHE_TTL_SINGLE_REPORT=300   # Single report cache (seconds)

# Rate Limiting
RATE_LIMIT_REQUESTS=100        # Max requests per window
RATE_LIMIT_WINDOW=60           # Window duration (seconds)

# Application
LOG_LEVEL=INFO
```

---

## Security Features

### Network Security

- **MongoDB Isolation**: Runs on private bridge network with no exposed ports
- **Internal Communication**: Backend ↔ MongoDB communication only within Docker network
- **CORS Configuration**: Configurable allowed origins (default: `*` for development)

### Rate Limiting

- **Per-IP Limiting**: 100 requests per minute per IP address
- **429 Responses**: Clear error messages when limit exceeded
- **Automatic Reset**: 60-second rolling window

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### File Security

- **SHA256 Fingerprinting**: Every attachment gets unique cryptographic hash
- **Duplicate Detection**: Identify previously analyzed files
- **File Tracking**: Complete audit trail with SHA256 database index

### Data Security

- **Write Concern**: "majority" ensures data durability
- **Connection Pooling**: Prevents connection exhaustion attacks
- **Input Validation**: Pydantic models validate all inputs
- **Error Handling**: Secure error messages without internal details

### Health Monitoring

```bash
# Service status
docker compose ps

# Resource utilization
docker stats --no-stream

# Live logs
docker compose logs -f --timestamps backend

# MongoDB health
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Authors

- **Aayush Rajthala** - [AayushRajthala99](https://github.com/AayushRajthala99)
- **Rabin Patel** - [Robinpats182](https://github.com/robinpats182)
- **Samsuhang Nembang** - [Hangsam](https://github.com/hangsam)

---

**🛡️ Built with ❤️ using FastAPI, Next.js, MongoDB, and Machine Learning**
