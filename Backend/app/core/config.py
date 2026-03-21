from pydantic_settings import BaseSettings


def _split_csv(raw: str) -> list[str]:
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings(BaseSettings):
    # App
    APP_NAME: str = "RushCart"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool = True

    # Supabase / PostgreSQL
    DATABASE_URL: str
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_TIMEOUT_SECONDS: int = 30

    # Redis
    REDIS_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_ISSUER: str = "rushcart-auth"
    JWT_MIN_SECRET_LENGTH: int = 32

    # Security
    BCRYPT_ROUNDS: int = 12
    CORS_ORIGINS: str = "http://localhost:5173"
    TRUSTED_HOSTS: str = "localhost,127.0.0.1"
    ENABLE_HSTS: bool = False
    HSTS_MAX_AGE_SECONDS: int = 31536000
    ENFORCE_SELLER_SUBSCRIPTION: bool = True
    UPLOAD_MAX_IMAGE_SIZE_MB: int = 15

    # Payments
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Elasticsearch
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ELASTICSEARCH_PRODUCTS_INDEX: str = "rushcart_products"
    ELASTICSEARCH_STORES_INDEX: str = "rushcart_stores"
    ELASTICSEARCH_TIMEOUT_SECONDS: int = 5

    # ImageKit
    IMAGEKIT_PUBLIC_KEY: str = ""
    IMAGEKIT_PRIVATE_KEY: str = ""
    IMAGEKIT_URL_ENDPOINT: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Email (Gmail SMTP)
    EMAILS_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "RushCart"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    FRONTEND_URL: str = "http://localhost:5173"

    # Bootstrap admin
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    ADMIN_NAME: str = "RushCart Admin"


    @property
    def cors_origins(self) -> list[str]:
        return _split_csv(self.CORS_ORIGINS)

    @property
    def trusted_hosts(self) -> list[str]:
        return _split_csv(self.TRUSTED_HOSTS)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
