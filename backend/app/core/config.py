import os
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class CommonSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Core Application Settings
    PROJECT_NAME: str = "flagged!"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    # Security Settings
    JWT_SECRET: str = "supersecretjwtkeyforhashingmustbechangedinproduction"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth Settings
    GOOGLE_CLIENT_ID: str = "placeholder-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "placeholder-google-client-secret"

    # Database Settings (PostgreSQL)
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "flagged_db"

    # Caching & Rate Limiting (Redis)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Machine Learning Settings
    MODEL_PATH: str = "app/models/v1.0.2/model.json"
    DECISION_THRESHOLD: float = 0.32
    MODEL_VERSION: str = "v1.1.0"
    ML_ARTIFACT_DIR: str = os.getenv(
        "ML_ARTIFACT_DIR",
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
            "ml",
            "artifacts"
        )
    )
    CSV_MAX_ROWS: int = 100000
    CSV_MAX_FILES_PER_USER: int = 10
    CSV_MAX_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
    MAX_API_KEYS_PER_USER: int = 1
    FREE_MONTHLY_API_CALLS: int = 1000
    FREE_API_RATE_LIMIT_PER_SEC: int = 10
    SHOW_DEBUG_INFO: bool = True


class DevelopmentSettings(CommonSettings):
    ENV: str = "development"


class TestingSettings(CommonSettings):
    ENV: str = "testing"
    DEBUG: bool = False
    POSTGRES_DB: str = "flagged_test_db"
    REDIS_URL: str = "redis://localhost:6379/1"


class ProductionSettings(CommonSettings):
    ENV: str = "production"
    DEBUG: bool = False


def get_settings() -> CommonSettings:
    env_name = os.getenv("ENV", "development").lower()
    
    if env_name == "testing":
        return TestingSettings()
    elif env_name == "production":
        prod = ProductionSettings()
        # Enforce fail-fast configuration checks on production boot
        if prod.JWT_SECRET == "supersecretjwtkeyforhashingmustbechangedinproduction":
            raise ValueError("CRITICAL: Default JWT_SECRET is not permitted in production environments!")
        if "placeholder" in prod.GOOGLE_CLIENT_ID or "placeholder" in prod.GOOGLE_CLIENT_SECRET:
            raise ValueError("CRITICAL: Default Google OAuth credentials are not permitted in production!")
        return prod
    else:
        return DevelopmentSettings()


# Global config instance loaded at startup
settings = get_settings()
