import os
import joblib
import logging
import hashlib
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form, Query
from database import db_manager

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
    # Initialize ML Models
    logger.info("Loading ML models...")
    logger.info(f"Model path: {MODEL_PATH}")
    logger.info(f"Vectorizer path: {VECTORIZER_PATH}")
    try:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
            logger.warning(
                f"Model files not found in {MODELS_DIR}. Predictions will fail."
            )
            ml_models["error"] = "Model files missing"
            ml_models["ready"] = False
        else:
            classifier = joblib.load(MODEL_PATH)
            vectorizer = joblib.load(VECTORIZER_PATH)
            logger.info(f"Classifier loaded: {classifier}")
            logger.info(f"Vectorizer loaded: {vectorizer}")
            ml_models["classifier"] = classifier
            ml_models["vectorizer"] = vectorizer
            ml_models["ready"] = True
            logger.info("Models loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        ml_models["error"] = str(e)
        ml_models["ready"] = False

    # Connect to Database
    logger.info("Connecting to MongoDB...")
    db_connected = await db_manager.connect()
    if not db_connected:
        logger.warning("Database connection failed. Reports will not be available.")

    yield

    # Clean up resources
    logger.info("Shutting down...")
    await db_manager.disconnect()
    ml_models.clear()
    logger.info("Shutdown complete.")


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
    database_connected: bool
    error: Optional[str] = None


class AttachmentInfo(BaseModel):
    """Model for file attachment information"""

    filename: str = Field(..., example="BITDEFENDER.txt")
    content_type: str = Field(..., example="text/plain")
    size: int = Field(..., example=23)
    sha256: str = Field(
        ..., example="6f2eda4c0fa513cb4081ed255744531acbaa5c0e08d7d60dec7789704ff4afbc"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "filename": "BITDEFENDER.txt",
                "content_type": "text/plain",
                "size": 23,
                "sha256": "6f2eda4c0fa513cb4081ed255744531acbaa5c0e08d7d60dec7789704ff4afbc",
            }
        }


class ReportResponse(BaseModel):
    """Model for a single prediction report"""

    id: str = Field(alias="_id", example="6938b2d719aeb1dd9e914755")
    subject: str = Field(..., example="testsubject")
    body: str = Field(..., example="this is test email body")
    prediction: str = Field(..., example="spam")
    confidence: float = Field(..., example=0.9391)
    spam_probability: float = Field(..., example=0.9391)
    ham_probability: float = Field(..., example=0.0609)
    timestamp: str = Field(..., example="2025-12-09T23:37:59.433000")
    attachments_info: Optional[List[AttachmentInfo]] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "6938b2d719aeb1dd9e914755",
                "subject": "testsubject",
                "body": "this is test email body",
                "prediction": "spam",
                "confidence": 0.9391,
                "spam_probability": 0.9391,
                "ham_probability": 0.0609,
                "timestamp": "2025-12-09T23:37:59.433000",
            }
        }


class AllReportsResponse(BaseModel):
    """Model for all reports response"""

    total: int = Field(..., example=2)
    reports: List[Dict[str, Any]] = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "total": 2,
                "reports": [
                    {
                        "_id": "6938b2d719aeb1dd9e914755",
                        "subject": "testsubject",
                        "body": "this is test email body",
                        "prediction": "spam",
                        "confidence": 0.9391,
                        "spam_probability": 0.9391,
                        "ham_probability": 0.0609,
                        "timestamp": "2025-12-09T23:37:59.433000",
                    },
                    {
                        "_id": "6938b2a719aeb1dd9e914754",
                        "subject": "asdasdasdasd",
                        "body": "asdasdasdasd",
                        "prediction": "spam",
                        "confidence": 0.6524,
                        "spam_probability": 0.6524,
                        "ham_probability": 0.3476,
                        "attachments_info": [
                            {
                                "filename": "samplefile.txt",
                                "content_type": "text/plain",
                                "size": 23,
                                "sha256": "6f2eda4c0fa513cb4081ed255744531acbaa5c0e08d7d60dec7789704ff4afbc",
                                "malicious_score": 0.6678,
                            }
                        ],
                        "timestamp": "2025-12-09T23:37:11.548000",
                    },
                ],
            }
        }


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
async def run_prediction(
    subject: str, body: str, attachments_info: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    if not ml_models.get("ready"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Models not loaded: {ml_models.get('error', 'Unknown error')}",
        )

    try:
        text = f"{subject} {body}".strip()
        # logger.info(f"Processing text: {text[:100]}...")  # Log first 100 chars

        vectorizer = ml_models["vectorizer"]
        model = ml_models["classifier"]

        # Log attachment information if present
        # if attachments_info:
        # logger.info(f"Processing email with {len(attachments_info)} attachment(s)")
        # for att in attachments_info:
        # logger.info(
        # f"  - {att.get('filename')} ({att.get('size')} bytes, type: {att.get('content_type')})"
        # )

        # Transform and Predict
        # logger.info("Transforming text with vectorizer...")
        text_tfidf = vectorizer.transform([text])
        # logger.info(f"Text transformed, shape: {text_tfidf.shape}")

        # logger.info("Making prediction...")
        prediction = model.predict(text_tfidf)[0]
        # logger.info(f"Prediction result: {prediction}")

        # Get Probabilities
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(text_tfidf)[0]
            # logger.info(f"Probabilities: {probabilities}")
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

        logger.info(f"Final result: {result}")
        return result

    except Exception as e:
        logger.error(f"Prediction logic error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal processing error during prediction: {str(e)}",
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
    db_connected = db_manager.is_connected
    return {
        "status": "healthy" if (is_ready and db_connected) else "unhealthy",
        "models_loaded": is_ready,
        "database_connected": db_connected,
        "error": ml_models.get("error"),
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(
    subject: str = Form(...),
    body: str = Form(...),
    files: List[UploadFile] = File(default=[]),
):
    logger.info(
        f"Received prediction request - Subject: '{subject}', Body length: {len(body)}, Files: {len(files)}"
    )

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
                # Read file content and calculate hash
                file_size = 0
                sha256_hash = None
                try:
                    # Read file content
                    file_content = await file.read()
                    file_size = len(file_content)

                    # Calculate SHA256 hash
                    hash_object = hashlib.sha256(file_content)
                    sha256_hash = hash_object.hexdigest()

                    # Reset file pointer for potential future use
                    await file.seek(0)

                    logger.info(
                        f"Processed attachment: {file.filename} "
                        f"(size: {file_size} bytes, SHA256: {sha256_hash})"
                    )
                except Exception as e:
                    logger.warning(f"Error processing file {file.filename}: {e}")

                attachments_info.append(
                    {
                        "filename": file.filename,
                        "content_type": file.content_type,
                        "size": file_size,
                        "sha256": sha256_hash,
                        "malicious_score": 0.0,  # Placeholder for future use
                    }
                )

    # Run prediction
    result = await run_prediction(
        subject.strip(),
        body.strip(),
        attachments_info if attachments_info else None,
    )

    # Save to database only after successful prediction
    try:
        if db_manager.is_connected:
            # Prepare document for database
            db_document = {
                "subject": subject.strip(),
                "body": body.strip(),
                "prediction": result["prediction"],
                "confidence": result["confidence"],
                "spam_probability": result["spam_probability"],
                "ham_probability": result["ham_probability"],
            }

            if attachments_info:
                db_document["attachments_info"] = attachments_info

            # Save to database
            saved_id = await db_manager.save_prediction(db_document)
            if saved_id:
                logger.info(f"Prediction saved to database with ID: {saved_id}")
            else:
                logger.warning("Failed to save prediction to database")
        else:
            logger.warning("Database not connected. Prediction not saved.")
    except Exception as db_error:
        # Log error but don't fail the request
        logger.error(f"Database error during save: {db_error}", exc_info=True)

    return result


@app.get("/reports", response_model=AllReportsResponse, tags=["Reports"])
async def get_all_reports():
    """
    Retrieve all prediction reports from the database.

    Returns a list of all stored predictions with metadata including:
    - Email subject and body
    - Prediction verdict (spam/ham)
    - Confidence scores
    - Attachment information (if present) with SHA256 hashes
    - Timestamp of prediction

    The reports are sorted by timestamp in descending order (newest first).
    """
    try:
        # Check database connection
        if not db_manager.is_connected:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not connected. Reports are unavailable.",
            )

        # Fetch all reports
        reports = await db_manager.get_all_reports()

        if reports is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve reports from database.",
            )

        return {
            "total": len(reports),
            "reports": reports,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /reports endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching reports: {str(e)}",
        )


@app.get("/report", response_model=ReportResponse, tags=["Reports"])
async def get_report_by_id(
    id: str = Query(
        ..., description="Report ID to retrieve", example="6938b2d719aeb1dd9e914755"
    )
):
    """
    Retrieve a single prediction report by its unique ID.

    Returns detailed information about a specific prediction including:
    - Email subject and body
    - Prediction verdict (spam/ham) with confidence scores
    - Attachment information (filename, content type, size, SHA256 hash)
    - Timestamp of when the prediction was made

    **Parameters:**
    - **id**: The MongoDB ObjectId of the report (24-character hexadecimal string)

    **Example:**
    ```
    GET /report?id=6938b2d719aeb1dd9e914755
    ```

    **Errors:**
    - 422: Missing or empty ID parameter
    - 404: Report with specified ID not found
    - 503: Database not connected
    - 500: Internal server error
    """
    try:
        # Validate ID parameter
        if not id or not id.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Report ID parameter is required and cannot be empty.",
            )

        # Check database connection
        if not db_manager.is_connected:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not connected. Reports are unavailable.",
            )

        # Fetch report by ID
        report = await db_manager.get_report_by_id(id.strip())

        if report is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID '{id}' not found. Please check the ID and try again.",
            )

        return report

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /report endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching the report: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000)
