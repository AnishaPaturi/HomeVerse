"""
Uploaded File Security and Validation Engine (Phase 43)

Security Rules:
- Never blindly trust client-supplied filename, MIME type, or extension.
- Inspect file binary content (magic bytes) to verify true format.
- Disallow executable and script formats (PE, ELF, PHP, HTML/SVG scripts, shell scripts).
- Enforce strict file size limits (default 15MB).
- Sanitize filenames to completely prevent directory traversal and null-byte injection.
"""
import os
import re
from typing import Optional, Set, Tuple
import uuid

try:
    from app.config import settings
except ImportError:
    from app.core.config import settings

from app.core.exceptions import ValidationErrorException

# Magic byte signatures for authorized media
# Format: (magic_bytes, offset, mime_type, standard_extension)
VALID_IMAGE_SIGNATURES = [
    (b"\xff\xd8\xff", 0, "image/jpeg", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", 0, "image/png", ".png"),
    (b"GIF87a", 0, "image/gif", ".gif"),
    (b"GIF89a", 0, "image/gif", ".gif"),
    (b"%PDF-", 0, "application/pdf", ".pdf"),
]

# Explicitly forbidden executable and dangerous signatures
FORBIDDEN_SIGNATURES = [
    (b"MZ", 0, "Executable (Windows PE)"),
    (b"\x7fELF", 0, "Executable (Linux ELF)"),
    (b"\xca\xfe\xba\xbe", 0, "Java Bytecode"),
    (b"#!/", 0, "Shell Script"),
    (b"<?php", 0, "PHP Script"),
    (b"<script", 0, "HTML/JavaScript Payload"),
    (b"<html", 0, "HTML Document"),
    (b"<!DOCTYPE html", 0, "HTML Document"),
]


def detect_file_type_from_magic_bytes(file_bytes: bytes) -> Optional[Tuple[str, str]]:
    """
    Inspects binary header to determine genuine MIME type and extension.
    Returns (mime_type, extension) or None if format is unrecognized.
    """
    if not file_bytes or len(file_bytes) < 4:
        return None

    # Check WEBP: Starts with 'RIFF' and has 'WEBP' at offset 8
    if len(file_bytes) >= 12 and file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP":
        return "image/webp", ".webp"

    for magic, offset, mime, ext in VALID_IMAGE_SIGNATURES:
        end = offset + len(magic)
        if len(file_bytes) >= end and file_bytes[offset:end] == magic:
            return mime, ext

    return None


def is_forbidden_executable_or_script(file_bytes: bytes) -> Tuple[bool, Optional[str]]:
    """
    Scans for hazardous file signatures including binaries, bytecode, and script payloads.
    """
    sample = file_bytes[:512].lower()

    for sig, offset, desc in FORBIDDEN_SIGNATURES:
        if sig.lower() in sample:
            return True, desc

    return False, None


def sanitize_filename(filename: str, fallback_ext: str = ".jpg") -> str:
    """
    Sanitizes user filename to eliminate path traversal, control chars, and null bytes.
    Retains safe alphanumeric characters, dashes, and underscores.
    """
    if not filename:
        return f"upload_{uuid.uuid4().hex[:8]}{fallback_ext}"

    # Remove path traversal characters (both forward and backward slashes)
    clean_name = os.path.basename(filename.replace("\\", "/"))
    # Remove null bytes
    clean_name = clean_name.replace("\x00", "")

    # Split name and extension
    name_part, ext_part = os.path.splitext(clean_name)

    # Normalize name_part
    sanitized_name = re.sub(r"[^\w\-_.]", "_", name_part)
    sanitized_name = re.sub(r"_+", "_", sanitized_name).strip("._")

    if not sanitized_name:
        sanitized_name = f"upload_{uuid.uuid4().hex[:8]}"

    # Use fallback extension if none or unsafe
    ext = ext_part.lower() if ext_part else fallback_ext
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"]:
        ext = fallback_ext

    return f"{sanitized_name}{ext}"


def validate_uploaded_file(
    file_bytes: bytes,
    claimed_filename: str,
    claimed_content_type: Optional[str] = None,
    max_size_mb: Optional[int] = None,
    allow_pdf: bool = True,
) -> Tuple[str, str, str]:
    """
    Comprehensive upload verification (Phase 43):
    1. Validates file size against MAX_UPLOAD_SIZE_MB.
    2. Scans for forbidden executable/script binary signatures.
    3. Verifies authentic magic bytes against authorized image/pdf formats.
    4. Generates a secure, sanitized filename.

    Returns:
        Tuple of (detected_mime, detected_extension, secure_filename)

    Raises:
        ValidationErrorException with descriptive security guidance.
    """
    limit_mb = max_size_mb or getattr(settings, "MAX_UPLOAD_SIZE_MB", 15)
    max_bytes = limit_mb * 1024 * 1024

    # 1. Size Check
    if not file_bytes or len(file_bytes) == 0:
        raise ValidationErrorException(
            message="Uploaded file is empty. Please provide a valid room photo or blueprint."
        )

    if len(file_bytes) > max_bytes:
        raise ValidationErrorException(
            message=f"File exceeds the maximum allowed size of {limit_mb}MB (Received: {len(file_bytes) / (1024 * 1024):.1f}MB)."
        )

    # 2. Check for Executables or Scripts
    is_forbidden, danger_type = is_forbidden_executable_or_script(file_bytes)
    if is_forbidden:
        raise ValidationErrorException(
            message=f"Security violation: Uploaded file contains forbidden content ({danger_type}). Executable files and scripts are not permitted."
        )

    # 3. Magic Bytes Inspection
    detected = detect_file_type_from_magic_bytes(file_bytes)
    if not detected:
        raise ValidationErrorException(
            message=(
                "Invalid file format. The file content does not match any allowed image or blueprint format. "
                "Supported formats: JPEG, PNG, WebP, GIF, and PDF. "
                "Do not rename unsupported files to image extensions."
            )
        )

    detected_mime, detected_ext = detected

    if not allow_pdf and detected_mime == "application/pdf":
        raise ValidationErrorException(
            message="PDF files are not permitted for this endpoint. Please upload an image (JPEG, PNG, WebP)."
        )

    # 4. Generate Safe Filename
    safe_name = sanitize_filename(claimed_filename, fallback_ext=detected_ext)

    return detected_mime, detected_ext, safe_name
