# app/core/config.py
# app/core/config.py
from pathlib import Path

from dotenv import load_dotenv

# ── 1. Load the env file immediately ────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[2]  # → backend/
load_dotenv(PROJECT_ROOT / ".env", override=False)
# -------------------------------------------------------------------

from functools import lru_cache
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # -------- Supabase ----------
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_JWT_SECRET: str

    # -------- LLMs --------------
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None  # <- now declared

    # -------- App ---------------
    ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )
    DEV_FAKE_UID: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # <- silently ignore any other env-vars


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
