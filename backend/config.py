from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


_DEFAULT_SQLITE_PATH = (Path(__file__).resolve().parent / 'axon.db').as_posix()
_ROOT_ENV_PATH = (Path(__file__).resolve().parents[1] / '.env').as_posix()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ROOT_ENV_PATH, env_file_encoding='utf-8', extra='ignore')

    APP_NAME: str = 'Axon AI Platform'
    API_PREFIX: str = '/api'

    DATABASE_URL: str = f'sqlite+aiosqlite:///{_DEFAULT_SQLITE_PATH}'

    @field_validator('DATABASE_URL', mode='before')
    @classmethod
    def normalize_sqlite_database_url(cls, value: str) -> str:
        database_url = str(value)
        prefixes = ('sqlite+aiosqlite:///', 'sqlite:///')

        for prefix in prefixes:
            if database_url.startswith(prefix):
                db_path = database_url[len(prefix):]

                # Keep absolute sqlite paths as-is and normalize relative paths to repo root.
                if db_path.startswith('/') or (len(db_path) > 1 and db_path[1] == ':'):
                    return database_url

                root_dir = Path(__file__).resolve().parents[1]
                normalized_path = (root_dir / db_path).resolve().as_posix()
                return f'{prefix}{normalized_path}'

        return database_url

    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    TAVILY_API_KEY: str | None = None

    SECRET_KEY: str = 'dev-secret-change-me'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: list[str] = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']
