from pathlib import Path
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Process-wide config. Fails fast at startup if required env vars are missing."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    mineru_token: str = Field(..., alias="MINERU_TOKEN")
    app_password: str = Field(..., alias="APP_PASSWORD")
    app_jwt_secret: str = Field(..., alias="APP_JWT_SECRET")
    app_jwt_exp_hours: float = Field(24.0, alias="APP_JWT_EXP_HOURS")

    max_job_history: int = Field(20, alias="MAX_JOB_HISTORY")
    data_dir: Path = Field(Path("/data"), alias="DATA_DIR")
    mineru_base_url: str = Field("https://mineru.net", alias="MINERU_BASE_URL")

    chunk_pages: int = Field(200, alias="CHUNK_PAGES")
    mineru_poll_interval_s: float = Field(5.0, alias="MINERU_POLL_INTERVAL_S")
    latex_compile_timeout_s: int = Field(900, alias="LATEX_COMPILE_TIMEOUT_S")

    @field_validator("app_jwt_secret")
    @classmethod
    def _secret_min_len(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("APP_JWT_SECRET must be at least 32 chars (use `openssl rand -hex 32`)")
        return v

    @field_validator("app_password")
    @classmethod
    def _password_nonempty(cls, v: str) -> str:
        if not v:
            raise ValueError("APP_PASSWORD must not be empty")
        return v


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()  # type: ignore[call-arg]
    return _settings
