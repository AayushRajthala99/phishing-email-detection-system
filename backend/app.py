# spam_api.py
import os
import joblib
from fastapi import FastAPI
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -----------------------------
# Load saved models and vectorizer
# -----------------------------
model = joblib.load(os.path.join(BASE_DIR, "models/spam_classifier_model.pkl"))
vectorizer = joblib.load(os.path.join(BASE_DIR, "models/tfidf_vectorizer.pkl"))


# -----------------------------
# Define prediction function
# -----------------------------
def predict_email(subject: str, body: str, attachments: list = None):
    text = (subject or "") + " " + (body or "")

    if attachments:
        print()
        # extract_information()

    text_tfidf = vectorizer.transform([text])
    prediction = model.predict(text_tfidf)[0]

    return "spam" if prediction == 1 else "ham"


# -----------------------------
# FastAPI app
# -----------------------------
app = FastAPI(title="Phishing Email Detection System")


# Define request structure
class EmailRequest(BaseModel):
    subject: str
    body: str
    attachments: list = None


# Prediction endpoint
@app.post("/predict")
def predict(email: EmailRequest):
    result = predict_email(email.subject, email.body, email.attachments)
    return {"prediction": result}
