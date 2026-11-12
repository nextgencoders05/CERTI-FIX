import os
from functools import lru_cache
from pathlib import Path
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "CertiFix AI")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./certifix_dev.db",
    )

    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-insecure-secret-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    PRIVATE_STORAGE_DIR: Path = Path(os.getenv("PRIVATE_STORAGE_DIR", "./private_storage")).resolve()
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
    MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [
        ext.strip().lower()
        for ext in os.getenv("ALLOWED_UPLOAD_EXTENSIONS", "pdf,png,jpg,jpeg").split(",")
        if ext.strip()
    ]

    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
        if origin.strip()
    ]

    RATE_LIMIT_DEFAULT: str = os.getenv("RATE_LIMIT_DEFAULT", "100/minute")
    RATE_LIMIT_AUTH: str = os.getenv("RATE_LIMIT_AUTH", "20/minute")
    RATE_LIMIT_UPLOAD: str = os.getenv("RATE_LIMIT_UPLOAD", "15/minute")
    UPLOAD_RETENTION_DAYS: int = int(os.getenv("UPLOAD_RETENTION_DAYS", "90"))


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    settings.PRIVATE_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    for sub in ("uploads", "certificates", "logos"):
        (settings.PRIVATE_STORAGE_DIR / sub).mkdir(parents=True, exist_ok=True)
    return settings
