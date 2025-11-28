import os
import joblib
import logging
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# -----------------------------
# Logging Configuration
# -----------------------------
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("phishing-detection-api")

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
class EmailRequest(BaseModel):
    subject: str = Field(..., min_length=1, description="Email subject line")
    body: str = Field(..., min_length=1, description="Email body content")
    attachments: Optional[List[str]] = Field(
        default=None, description="List of attachment filenames"
    )

    @field_validator("subject", "body")
    @classmethod
    def validate_not_empty(cls, v: str, info):
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} cannot be empty or whitespace only")
        return v.strip()


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    spam_probability: float
    ham_probability: float


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
def run_prediction(subject: str, body: str) -> Dict[str, Any]:
    if not ml_models.get("ready"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Models not loaded: {ml_models.get('error', 'Unknown error')}",
        )

    try:
        text = f"{subject} {body}".strip()
        vectorizer = ml_models["vectorizer"]
        model = ml_models["classifier"]

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

        return {
            "prediction": prediction_label,
            "confidence": round(confidence, 4),
            "spam_probability": round(spam_prob, 4),
            "ham_probability": round(ham_prob, 4),
        }

    except Exception as e:
        logger.error(f"Prediction logic error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal processing error during prediction",
        )


# -----------------------------
# Endpoints
# -----------------------------
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    is_ready = ml_models.get("ready", False)
    return {
        "status": "healthy" if is_ready else "unhealthy",
        "models_loaded": is_ready,
        "error": ml_models.get("error"),
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(email: EmailRequest):
    return run_prediction(email.subject, email.body)


# Entry point for local debugging
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
