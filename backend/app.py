import os
import joblib
import logging
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form

# -----------------------------
# Logging Configuration
# -----------------------------
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("Phishing-Email-Detection-System-API")

# -----------------------------
# Configuration
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "spam_classifier_model.pkl")
VECTORIZER_PATH = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")

# Global state to hold models
ml_models: Dict[str, Any] = {}


# -----------------------------
# Lifespan Context (Startup/Shutdown)
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load models on startup and clean up on shutdown.
    """
    logger.info("Loading ML models...")
    try:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
            logger.warning(
                f"Model files not found in {MODELS_DIR}. Predictions will fail."
            )
            ml_models["error"] = "Model files missing"
        else:
            ml_models["classifier"] = joblib.load(MODEL_PATH)
            ml_models["vectorizer"] = joblib.load(VECTORIZER_PATH)
            ml_models["ready"] = True
            logger.info("Models loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        ml_models["error"] = str(e)
        ml_models["ready"] = False

    yield

    # Clean up resources if necessary
    ml_models.clear()
    logger.info("Models unloaded.")


# -----------------------------
# Pydantic Models
# -----------------------------
class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    spam_probability: float
    ham_probability: float
    attachments_info: Optional[List[Dict[str, Any]]] = None


class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    error: Optional[str] = None


# -----------------------------
# FastAPI Application
# -----------------------------
app = FastAPI(
    title="Phishing Email Detection System",
    description="AI-powered email spam/phishing detection API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Prediction Logic
# -----------------------------
def run_prediction(
    subject: str, body: str, attachments_info: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    if not ml_models.get("ready"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Models not loaded: {ml_models.get('error', 'Unknown error')}",
        )

    try:
        text = f"{subject} {body}".strip()
        vectorizer = ml_models["vectorizer"]
        model = ml_models["classifier"]

        # Log attachment information if present
        if attachments_info:
            logger.info(f"Processing email with {len(attachments_info)} attachment(s)")
            for att in attachments_info:
                logger.info(
                    f"  - {att.get('filename')} ({att.get('size')} bytes, type: {att.get('content_type')})"
                )

        # Transform and Predict
        text_tfidf = vectorizer.transform([text])
        prediction = model.predict(text_tfidf)[0]

        # Get Probabilities
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(text_tfidf)[0]
            # Assuming class 0 is ham, 1 is spam (standard sklearn behavior)
            ham_prob = float(probabilities[0])
            spam_prob = float(probabilities[1])
        else:
            spam_prob = 1.0 if prediction == 1 else 0.0
            ham_prob = 1.0 - spam_prob

        prediction_label = "spam" if prediction == 1 else "ham"
        confidence = spam_prob if prediction == 1 else ham_prob

        result = {
            "prediction": prediction_label,
            "confidence": round(confidence, 4),
            "spam_probability": round(spam_prob, 4),
            "ham_probability": round(ham_prob, 4),
        }

        if attachments_info:
            result["attachments_info"] = attachments_info

        return result

    except Exception as e:
        logger.error(f"Prediction logic error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal processing error during prediction",
        )


# -----------------------------
# Endpoints
# -----------------------------
@app.get("/", tags=["Home"])
async def home():
    return {"message": "Welcome to the Phishing Email Detection System API."}


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    is_ready = ml_models.get("ready", False)
    return {
        "status": "healthy" if is_ready else "unhealthy",
        "models_loaded": is_ready,
        "error": ml_models.get("error"),
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(
    subject: str = Form(...),
    body: str = Form(...),
    files: List[UploadFile] = File(default=[]),
):
    # Validate inputs
    if not subject or not subject.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Subject cannot be empty",
        )
    if not body or not body.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Body cannot be empty",
        )

    # Process attachments
    attachments_info = []
    if files:
        for file in files:
            if file.filename:  # Check if file actually has content
                # Read file metadata
                file_size = 0
                try:
                    # In a real scenario, you might scan the file content here
                    # Move to end to get size, then reset
                    await file.seek(0, os.SEEK_END)
                    file_size = file.tell()
                    await file.seek(0)
                except Exception as e:
                    logger.warning(f"Error reading file {file.filename}: {e}")

                attachments_info.append(
                    {
                        "filename": file.filename,
                        "content_type": file.content_type,
                        "size": file_size,
                    }
                )

        return await run_prediction(
            subject.strip(),
            body.strip(),
            attachments_info if attachments_info else None,
        )

    else:
        return run_prediction(subject, body)
