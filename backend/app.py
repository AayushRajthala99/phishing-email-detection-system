"""
Phishing Email Detection System - FastAPI Backend
AI-ML powered spam/phishing email classifier
"""

import os
import joblib
import logging
import numpy as np
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# -----------------------------
# Logging Configuration
# -----------------------------
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# -----------------------------
# Base Directory
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# -----------------------------
# Global Variables for Models
# -----------------------------
model = None
vectorizer = None
models_loaded = False
model_load_error = None


# -----------------------------
# Load Models on Startup
# -----------------------------
def load_models():
    """Load the trained ML models and vectorizer"""
    global model, vectorizer, models_loaded, model_load_error

    try:
        model_path = os.path.join(MODELS_DIR, "spam_classifier_model.pkl")
        vectorizer_path = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not os.path.exists(vectorizer_path):
            raise FileNotFoundError(f"Vectorizer file not found: {vectorizer_path}")

        logger.info("Loading spam classifier model...")
        model = joblib.load(model_path)

        logger.info("Loading TF-IDF vectorizer...")
        vectorizer = joblib.load(vectorizer_path)

        models_loaded = True
        logger.info("Models loaded successfully!")

    except Exception as e:
        model_load_error = str(e)
        models_loaded = False
        logger.error(f"Failed to load models: {e}")
        raise


# -----------------------------
# Pydantic Models
# -----------------------------
class EmailRequest(BaseModel):
    """Request model for email prediction"""

    subject: str = Field(..., min_length=1, description="Email subject line")
    body: str = Field(..., min_length=1, description="Email body content")
    attachments: Optional[List[str]] = Field(
        default=None, description="List of attachment filenames"
    )

    @validator("subject", "body")
    def validate_not_empty(cls, v, field):
        if not v or not v.strip():
            raise ValueError(f"{field.name} cannot be empty or whitespace only")
        return v.strip()


class PredictionResponse(BaseModel):
    """Response model for email prediction"""

    prediction: str = Field(..., description="Prediction result: 'spam' or 'ham'")
    confidence: float = Field(..., description="Confidence score between 0 and 1")
    spam_probability: float = Field(..., description="Probability of being spam")
    ham_probability: float = Field(
        ..., description="Probability of being legitimate (ham)"
    )


class HealthResponse(BaseModel):
    """Response model for health check"""

    status: str
    models_loaded: bool
    error: Optional[str] = None


# -----------------------------
# Prediction Function
# -----------------------------
def predict_email(subject: str, body: str, attachments: Optional[List[str]] = None):
    """
    Predict whether an email is spam or ham

    Args:
        subject: Email subject line
        body: Email body content
        attachments: Optional list of attachment filenames

    Returns:
        Dictionary containing prediction and confidence scores
    """
    if not models_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Models not loaded: {model_load_error}",
        )

    try:
        # Combine subject and body for analysis
        text = f"{subject} {body}".strip()

        if not text:
            raise ValueError("Combined text is empty after processing")

        # Log attachment info if present (for future feature enhancement)
        if attachments:
            logger.info(f"Email has {len(attachments)} attachment(s): {attachments}")
            # TODO: Implement attachment analysis

        # Transform text using TF-IDF vectorizer
        text_tfidf = vectorizer.transform([text])

        # Get prediction
        prediction = model.predict(text_tfidf)[0]

        # Get prediction probabilities if available
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(text_tfidf)[0]
            ham_prob = float(probabilities[0])
            spam_prob = float(probabilities[1])
        else:
            # Fallback if model doesn't support probability
            spam_prob = 1.0 if prediction == 1 else 0.0
            ham_prob = 1.0 - spam_prob

        # Determine prediction label and confidence
        prediction_label = "spam" if prediction == 1 else "ham"
        confidence = spam_prob if prediction == 1 else ham_prob

        logger.info(f"Prediction: {prediction_label} (confidence: {confidence:.2%})")

        return {
            "prediction": prediction_label,
            "confidence": confidence,
            "spam_probability": spam_prob,
            "ham_probability": ham_prob,
        }

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}",
        )


# -----------------------------
# FastAPI Application
# -----------------------------
app = FastAPI(
    title="Phishing Email Detection System",
    description="AI-powered email spam/phishing detection API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# -----------------------------
# CORS Middleware
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Startup Event
# -----------------------------
@app.on_event("startup")
async def startup_event():
    """Load models when the application starts"""
    logger.info("Starting Phishing Email Detection System...")
    try:
        load_models()
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        # Don't prevent startup, but log the error


# -----------------------------
# API Endpoints
# -----------------------------
@app.get("/", tags=["Root"])
async def read_root():
    """Root endpoint"""
    return {
        "message": "Phishing Email Detection System API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check API health and model status"""
    return {
        "status": "healthy" if models_loaded else "unhealthy",
        "models_loaded": models_loaded,
        "error": model_load_error if not models_loaded else None,
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(email: EmailRequest):
    """
    Predict whether an email is spam or legitimate (ham)

    - **subject**: Email subject line
    - **body**: Email body content
    - **attachments**: Optional list of attachment filenames
    """
    result = predict_email(email.subject, email.body, email.attachments)
    return result


# -----------------------------
# Run Application
# -----------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True, log_level="info")
