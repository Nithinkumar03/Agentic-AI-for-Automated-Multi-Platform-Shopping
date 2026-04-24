from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
SCREENSHOT_DIR = STATIC_DIR / "screenshots"

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
# GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b").strip()

DMART_BASE_URL = os.environ.get("DMART_BASE_URL", "http://127.0.0.1:3000").rstrip("/")

SELENIUM_HEADLESS = os.environ.get("SELENIUM_HEADLESS", "1").strip() not in (
    "0",
    "false",
    "False",
    "",
)
SELENIUM_IMPLICIT_WAIT = int(os.environ.get("SELENIUM_IMPLICIT_WAIT", "3") or "3")
