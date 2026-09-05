"""
Unit and Integration Tests for Phase 43: Security Architecture
Validates:
- Password hashing with bcrypt and password complexity validation
- JWT access/refresh token generation, validation, and expiration
- Security headers (X-Content-Type-Options, X-Frame-Options, CSP, HSTS, Referrer-Policy)
- File security: magic-bytes detection, size limits, executable blocking, path traversal
- Input validation and XSS sanitization
- Auth endpoints (/api/auth/register, /api/auth/token, /api/auth/me)
- Secrets hygiene verification
"""
from datetime import timedelta
import io
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    validate_password_strength,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_secrets_hygiene,
)
from app.core.file_security import (
    validate_uploaded_file,
    detect_file_type_from_magic_bytes,
    sanitize_filename,
    is_forbidden_executable_or_script,
)
from app.core.input_validation import sanitize_text, sanitize_prompt
from app.core.exceptions import UnauthorizedException, ValidationErrorException
from app.db.session import get_db
from app.models.user import User as UserModel

client = TestClient(app, raise_server_exceptions=False)


# ============================================================================
# 1. Password Hashing and Complexity
# ============================================================================

def test_password_hashing_and_verification():
    raw_password = "SecurePassword123!"
    hashed = get_password_hash(raw_password)

    assert hashed != raw_password
    assert hashed.startswith("$2")  # Standard bcrypt prefix
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False
    assert verify_password("", hashed) is False
    assert verify_password(raw_password, "") is False


def test_password_complexity_rules():
    # Valid password
    is_valid, msg = validate_password_strength("ValidPass123")
    assert is_valid is True
    assert msg is None

    # Too short (< 8 chars)
    is_valid, msg = validate_password_strength("Short1")
    assert is_valid is False
    assert "at least" in msg

    # Missing numeric digit
    is_valid, msg = validate_password_strength("NoDigitsHere")
    assert is_valid is False
    assert "digit" in msg

    # Missing alphabetic character
    is_valid, msg = validate_password_strength("123456789")
    assert is_valid is False
    assert "alphabetic" in msg


# ============================================================================
# 2. JWT Generation, Decoding, and Expiration
# ============================================================================

def test_jwt_token_lifecycle():
    user_id = str(uuid4())
    token = create_access_token(
        subject=user_id,
        claims={"email": "user@example.com", "plan": "Pro Designer"},
        expires_delta=timedelta(minutes=15),
    )

    assert isinstance(token, str)
    assert len(token.split(".")) == 3  # Header.Payload.Signature

    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["email"] == "user@example.com"
    assert payload["plan"] == "Pro Designer"
    assert payload["type"] == "access"


def test_jwt_expired_token_raises_unauthorized():
    user_id = str(uuid4())
    # Create token already expired in the past
    expired_token = create_access_token(
        subject=user_id,
        expires_delta=timedelta(seconds=-10),
    )

    with pytest.raises(UnauthorizedException) as exc_info:
        decode_token(expired_token)
    assert "expired" in str(exc_info.value.message).lower()


def test_jwt_tampered_token_raises_unauthorized():
    user_id = str(uuid4())
    token = create_access_token(subject=user_id)
    parts = token.split(".")
    tampered_token = f"{parts[0]}.{parts[1]}.tampered_signature"

    with pytest.raises(UnauthorizedException) as exc_info:
        decode_token(tampered_token)
    assert "invalid" in str(exc_info.value.message).lower()


# ============================================================================
# 3. Security Headers & Server Fingerprint Stripping
# ============================================================================

def test_security_headers_present_on_responses():
    resp = client.get("/")
    assert resp.status_code == 200

    # OWASP Core Security Headers
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("X-XSS-Protection") == "1; mode=block"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in resp.headers.get("Permissions-Policy", "")
    assert "default-src" in resp.headers.get("Content-Security-Policy", "")

    # Server fingerprinting stripped
    assert "server" not in resp.headers
    assert "x-powered-by" not in resp.headers


# ============================================================================
# 4. Upload File Security (Magic Bytes, Size, Executable & Traversal Defense)
# ============================================================================

def test_magic_byte_detection_valid_images():
    # JPEG magic bytes
    jpeg_bytes = b"\xff\xd8\xff\xe0" + b"\x00" * 50
    mime, ext = detect_file_type_from_magic_bytes(jpeg_bytes)
    assert mime == "image/jpeg"
    assert ext == ".jpg"

    # PNG magic bytes
    png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
    mime, ext = detect_file_type_from_magic_bytes(png_bytes)
    assert mime == "image/png"
    assert ext == ".png"

    # WebP magic bytes
    webp_bytes = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"\x00" * 50
    mime, ext = detect_file_type_from_magic_bytes(webp_bytes)
    assert mime == "image/webp"
    assert ext == ".webp"

    # PDF magic bytes
    pdf_bytes = b"%PDF-1.4 " + b"\x00" * 50
    mime, ext = detect_file_type_from_magic_bytes(pdf_bytes)
    assert mime == "application/pdf"
    assert ext == ".pdf"


def test_reject_executable_disguised_as_image():
    # Windows PE executable (starts with MZ) disguised as photo.jpg
    fake_jpg = b"MZ\x90\x00\x03\x00\x00\x00" + b"\x00" * 100
    is_forbidden, desc = is_forbidden_executable_or_script(fake_jpg)
    assert is_forbidden is True
    assert "Windows PE" in desc

    with pytest.raises(ValidationErrorException) as exc_info:
        validate_uploaded_file(fake_jpg, "innocent_room.jpg")
    assert "forbidden" in str(exc_info.value.message).lower()


def test_reject_script_payload_disguised_as_image():
    # Shell script disguised as blueprint.png
    fake_png = b"#!/bin/bash\nrm -rf /"
    is_forbidden, desc = is_forbidden_executable_or_script(fake_png)
    assert is_forbidden is True

    with pytest.raises(ValidationErrorException) as exc_info:
        validate_uploaded_file(fake_png, "floor_plan.png")
    assert "forbidden" in str(exc_info.value.message).lower()


def test_reject_empty_and_oversized_uploads():
    # Empty file
    with pytest.raises(ValidationErrorException) as exc_info:
        validate_uploaded_file(b"", "empty.jpg")
    assert "empty" in str(exc_info.value.message).lower()

    # Oversized file (> 15MB)
    fake_oversized = b"\xff\xd8\xff\xe0" + b"\x00" * (16 * 1024 * 1024)
    with pytest.raises(ValidationErrorException) as exc_info:
        validate_uploaded_file(fake_oversized, "huge.jpg", max_size_mb=15)
    assert "exceeds" in str(exc_info.value.message).lower()


def test_sanitize_filename_directory_traversal():
    # Unix traversal
    safe = sanitize_filename("../../../../etc/passwd.jpg")
    assert ".." not in safe
    assert "/" not in safe
    assert safe.endswith(".jpg")

    # Windows traversal
    safe_win = sanitize_filename("..\\..\\Windows\\System32\\cmd.exe")
    assert ".." not in safe_win
    assert "\\" not in safe_win
    assert safe_win.endswith(".jpg")

    # Null byte injection
    safe_null = sanitize_filename("safe_photo.jpg\x00.exe")
    assert "\x00" not in safe_null


# ============================================================================
# 5. Input Validation & XSS Sanitization
# ============================================================================

def test_xss_sanitization():
    xss_payload = "<script>alert('xss')</script>Living Room"
    cleaned = sanitize_text(xss_payload)
    assert "<script>" not in cleaned
    assert "alert('xss')" not in cleaned
    assert "Living Room" in cleaned

    event_payload = "<img src=x onerror=alert(1)>"
    cleaned_event = sanitize_text(event_payload)
    assert "onerror=" not in cleaned_event


def test_prompt_sanitization():
    raw_prompt = "Modern minimalist living room\x00 with marble accents\t\n"
    cleaned = sanitize_prompt(raw_prompt, max_length=50)
    assert "\x00" not in cleaned
    assert "Modern minimalist" in cleaned


# ============================================================================
# 6. Auth API Endpoints (Registration with Password, Token, and Me)
# ============================================================================

def test_register_with_password_hashes_in_database():
    email = f"secure_user_{uuid4().hex[:6]}@example.com"
    password = "StrongPassword456!"

    resp = client.post(
        "/api/auth/register",
        json={"name": "Secure <script>User</script>", "email": email, "password": password, "plan": "Free"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == email
    assert "<script>" not in data["name"]

    # Verify hashed in DB
    db = next(get_db())
    try:
        user = db.query(UserModel).filter(UserModel.email == email).first()
        assert user is not None
        assert user.password_hash is not None
        assert verify_password(password, user.password_hash) is True
    finally:
        db.close()


def test_token_issuance_and_profile_retrieval():
    email = f"jwt_user_{uuid4().hex[:6]}@example.com"
    password = "MyPassword789!"

    # Register user
    reg_resp = client.post(
        "/api/auth/register",
        json={"name": "JWT User", "email": email, "password": password, "plan": "Pro Designer"},
    )
    assert reg_resp.status_code == 201

    # Request Token via /api/auth/token
    token_resp = client.post(
        "/api/auth/token",
        json={"email": email, "password": password},
    )
    assert token_resp.status_code == 200
    token_data = token_resp.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    token = token_data["access_token"]

    # Fetch profile using Bearer token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    profile = me_resp.json()
    assert profile["email"] == email
    assert profile["plan"] == "Pro Designer"


def test_token_issuance_invalid_password_returns_401():
    email = f"bad_pwd_{uuid4().hex[:6]}@example.com"
    password = "GoodPassword123!"

    client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": email, "password": password},
    )

    bad_resp = client.post(
        "/api/auth/token",
        json={"email": email, "password": "WrongPassword!"},
    )
    assert bad_resp.status_code == 401
    assert bad_resp.json()["error"]["code"] == "UNAUTHORIZED"


# ============================================================================
# 7. Secrets Hygiene
# ============================================================================

def test_secrets_hygiene_checker():
    # In development mode, returns True
    assert verify_secrets_hygiene() is True


# ============================================================================
# 8. CSRF Protection and Token Cryptography
# ============================================================================

from app.core.csrf import generate_csrf_token, verify_csrf_token

def test_csrf_token_generation_and_validation():
    token = generate_csrf_token()
    assert isinstance(token, str)
    assert "." in token
    assert verify_csrf_token(token) is True

    # Tampered token
    tampered = f"{token[:-4]}aaaa"
    assert verify_csrf_token(tampered) is False
    assert verify_csrf_token("") is False
    assert verify_csrf_token("invalid-format") is False


def test_csrf_middleware_enforcement_on_session_cookies():
    client_ip = f"192.168.50.{uuid4().int % 240 + 1}"

    # A request with session cookie but missing CSRF token is rejected with 403
    resp = client.post(
        "/api/auth/register",
        json={"name": "Attacker", "email": "attacker@example.com"},
        cookies={"session": "session_id_123"},
        headers={"X-Forwarded-For": client_ip},
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"

    # With valid CSRF token header, the request is permitted through
    valid_csrf = generate_csrf_token()
    resp_valid = client.post(
        "/api/auth/register",
        json={"name": "Valid User", "email": f"valid_{uuid4().hex[:6]}@example.com"},
        cookies={"session": "session_id_123"},
        headers={"X-CSRF-Token": valid_csrf, "X-Forwarded-For": client_ip},
    )
    assert resp_valid.status_code == 201


# ============================================================================
# 9. SQL Injection Parameterization Defense
# ============================================================================

def test_sql_injection_defense_in_orm_queries():
    db = next(get_db())
    try:
        # Classical SQL injection strings
        sqli_attempts = [
            "' OR '1'='1",
            "admin' --",
            "'; DROP TABLE users; --",
            "1' UNION SELECT * FROM users --",
        ]

        for payload in sqli_attempts:
            # Querying by injected payload must return None safely without syntax error or table drop
            result = db.query(UserModel).filter(UserModel.email == payload).first()
            assert result is None
    finally:
        db.close()

