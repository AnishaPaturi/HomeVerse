"""
Security and Cryptography Utilities (Phase 43)
- Password hashing with bcrypt
- JWT generation, validation, and decoding
- Password policy validation
- Secrets hygiene verification
"""
import bcrypt
from datetime import datetime, timedelta, timezone
import logging
import re
from typing import Any, Dict, Optional, Tuple, Union
from jose import JWTError, jwt

try:
    from app.config import settings
except ImportError:
    from app.core.config import settings

from app.core.exceptions import UnauthorizedException, ValidationErrorException

logger = logging.getLogger("homeverse.security")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against the hashed password using bcrypt."""
    if not plain_password or not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception as exc:
        logger.warning(f"Password verification error: {exc}")
        return False


def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt hash of the provided password."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """
    Enforces password complexity requirements:
    - Minimum length (default 8 chars)
    - At least one digit
    - At least one alphabetic character
    """
    min_len = getattr(settings, "PASSWORD_MIN_LENGTH", 8)
    if len(password) < min_len:
        return False, f"Password must be at least {min_len} characters long."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one numeric digit."
    if not re.search(r"[a-zA-Z]", password):
        return False, "Password must contain at least one alphabetic character."
    return True, None


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Creates a signed JWT access token."""
    secret_key = getattr(settings, "SECRET_KEY", None) or getattr(settings, "JWT_SECRET", "secret")
    algorithm = getattr(settings, "ALGORITHM", None) or getattr(settings, "JWT_ALGORITHM", "HS256")
    expire_minutes = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7)

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)

    to_encode: Dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "iat": datetime.now(timezone.utc),
    }
    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Creates a signed JWT refresh token."""
    secret_key = getattr(settings, "SECRET_KEY", None) or getattr(settings, "JWT_SECRET", "secret")
    algorithm = getattr(settings, "ALGORITHM", None) or getattr(settings, "JWT_ALGORITHM", "HS256")
    expire_days = getattr(settings, "REFRESH_TOKEN_EXPIRE_DAYS", 7)

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=expire_days)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
    }
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token.
    Raises UnauthorizedException if expired or signature is invalid.
    """
    secret_key = getattr(settings, "SECRET_KEY", None) or getattr(settings, "JWT_SECRET", "secret")
    algorithm = getattr(settings, "ALGORITHM", None) or getattr(settings, "JWT_ALGORITHM", "HS256")

    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        if "sub" not in payload:
            raise UnauthorizedException(message="Token payload is missing subject identifier.")
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException(message="Authentication token has expired. Please log in again.")
    except (JWTError, Exception) as exc:
        raise UnauthorizedException(message=f"Invalid authentication token: {str(exc)}")


def verify_secrets_hygiene() -> bool:
    """
    Verifies that development secrets are not used in production environments.
    """
    env = getattr(settings, "ENVIRONMENT", "development")
    secret = getattr(settings, "SECRET_KEY", "") or getattr(settings, "JWT_SECRET", "")
    is_prod = env.lower() in ("production", "prod")

    if is_prod and ("secret" in secret.lower() or "dev" in secret.lower() or len(secret) < 32):
        logger.critical(
            "CRITICAL SECURITY ALERT: Weak or default JWT_SECRET / SECRET_KEY detected in production!"
        )
        return False
    return True
