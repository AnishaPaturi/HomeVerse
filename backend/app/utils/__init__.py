"""
HomeVerse Utility Functions
"""
from typing import Any, Dict

def sanitize_text(text: str) -> str:
    return text.strip() if text else ""
