from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart Scale Health"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/smart_scale"
    
    # Withings OAuth2
    WITHINGS_CLIENT_ID: str = ""
    WITHINGS_CLIENT_SECRET: str = ""
    WITHINGS_REDIRECT_URI: str = "http://localhost:3000/withings/callback"
    WITHINGS_AUTH_URL: str = "https://account.withings.com/oauth2_user/authorize2"
    WITHINGS_TOKEN_URL: str = "https://wbsapi.withings.net/v2/oauth2"
    WITHINGS_API_URL: str = "https://wbsapi.withings.net"
    
    # Google Gemini AI
    GEMINI_API_KEY: str = ""
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://your-domain.com",
    ]
    
    # Alerts thresholds
    FLUID_RETENTION_WARNING_KG: float = 1.0
    FLUID_RETENTION_CRITICAL_KG: float = 1.5
    KIDNEY_DAILY_LIMIT_KG: float = 1.5
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()