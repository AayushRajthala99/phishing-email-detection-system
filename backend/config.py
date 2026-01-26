"""
Configuration Management
Centralized configuration with validation and environment-based settings.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    APP_NAME: str = "Phishing Email Detection System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    WORKERS: int = 4

    # CORS
    CORS_ORIGINS: list = ["*"]

    # MongoDB
    MONGO_HOST: str = "localhost"
    MONGO_PORT: int = 27017
    MONGO_USERNAME: str  # Required - no default for security
    MONGO_PASSWORD: str  # Required - no default for security
    MONGO_DB_NAME: str = "phishing_detection"
    MONGO_MAX_POOL_SIZE: int = 50
    MONGO_MIN_POOL_SIZE: int = 10

    # ML Models
    MODELS_DIR: str = "models"
    MODEL_FILENAME: str = "spam_classifier_model.pkl"
    VECTORIZER_FILENAME: str = "tfidf_vectorizer.pkl"

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".txt", ".pdf", ".doc", ".docx", ".jpg", ".png"}

    # Performance
    ENABLE_GZIP: bool = True
    CACHE_TTL: int = 300  # 5 minutes

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Export settings instance
settings = get_settings()
