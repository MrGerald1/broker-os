from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite:///./brokeross.db"
    # No default — app fails fast if SECRET_KEY is not set in production
    secret_key: str = "dev-only-key-CHANGE-VIA-SECRET_KEY-env-var"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    paystack_secret_key: str = "sk_test_placeholder"
    sendgrid_api_key: str = "SG.placeholder"
    from_email: str = "noreply@brokeross.ng"
    app_env: str = "development"
    frontend_url: str = "http://localhost:5173"

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
