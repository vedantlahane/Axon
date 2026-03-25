from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    APP_NAME: str = 'Axon AI Platform'
    API_PREFIX: str = '/api'

    DATABASE_URL: str = 'postgresql+asyncpg://postgres:postgres@localhost:5432/axon'

    SECRET_KEY: str
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: list[str] = ['http://localhost:3000', 'http://localhost:5173']

    class Config:
        case_sensitive = True
