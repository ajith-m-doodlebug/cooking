from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_ENV: str = "development"
    APP_NAME: str = "CA Marketplace"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # OTP Provider
    OTP_PROVIDER: str = "msg91"
    OTP_EXPIRY_SECONDS: int = 300

    MSG91_AUTH_KEY: str = ""
    MSG91_TEMPLATE_ID: str = ""
    MSG91_SENDER_ID: str = "CAMRKT"

    # Payment Provider
    PAYMENT_PROVIDER: str = "razorpay"

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Meeting Provider
    MEETING_PROVIDER: str = "google_meet"

    GOOGLE_MEET_CLIENT_ID: str = ""
    GOOGLE_MEET_CLIENT_SECRET: str = ""
    GOOGLE_MEET_REFRESH_TOKEN: str = ""

    # Platform Config
    PLATFORM_FEE_PERCENT: float = 10.0
    GST_PERCENT: float = 18.0
    CA_SUBSCRIPTION_FEE: int = 4999
    SUBSCRIPTION_VALIDITY_DAYS: int = 365

    # ICAI Verification
    ICAI_LOM_URL: str = "http://112.133.194.254/lom.asp"
    ICAI_VERIFICATION_FUZZY_THRESHOLD: int = 85
    ICAI_VERIFICATION_MAX_RETRIES: int = 3

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    def get_allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
