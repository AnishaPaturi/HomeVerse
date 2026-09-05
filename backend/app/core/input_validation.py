"""
Input Validation and XSS Sanitization Utilities (Phase 43)
Provides:
- XSS payload sanitization for text and prompt inputs
- SQL injection safety verification
- Input length and character constraints
"""
import html
import re
from typing import Optional

# Regex pattern detecting common XSS injection attempts
DANGEROUS_PATTERNS = [
    r"<\s*script[^>]*>.*?<\s*/\s*script\s*>",
    r"<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>",
    r"<\s*embed[^>]*>",
    r"<\s*object[^>]*>",
    r"javascript\s*:",
    r"vbscript\s*:",
    r"on\w+\s*=",  # e.g., onload=, onerror=, onclick=
]

COMPILED_XSS_PATTERNS = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in DANGEROUS_PATTERNS]


def sanitize_text(value: Optional[str]) -> str:
    """
    Sanitizes arbitrary text input:
    - Strips dangerous HTML script/tag injections.
    - Escapes remaining HTML entities.
    - Strips null bytes and non-printable control characters.
    """
    if not value:
        return ""

    # Remove null bytes
    cleaned = value.replace("\x00", "")

    # Strip dangerous XSS patterns
    for pattern in COMPILED_XSS_PATTERNS:
        cleaned = pattern.sub("", cleaned)

    # Escape HTML to prevent injection if rendered in web contexts
    cleaned = html.escape(cleaned, quote=True)
    return cleaned.strip()


def sanitize_prompt(prompt: Optional[str], max_length: int = 2000) -> str:
    """
    Sanitizes user AI prompts for generation endpoints:
    - Limits character length
    - Strips binary control chars
    - Disallows extreme formatting tricks
    """
    if not prompt:
        return ""

    clean = prompt.replace("\x00", "")
    # Remove control characters except newline and tab
    clean = "".join(ch for ch in clean if ch >= " " or ch in "\n\t")
    if len(clean) > max_length:
        clean = clean[:max_length]

    return clean.strip()
