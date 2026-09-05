# HomeVerse Security Architecture (Phase 43)

This document specifies the security architecture, cryptography standards, authentication flows, secure HTTP headers, file upload protection, input validation, and defensive measures implemented across HomeVerse.

---

## 1. Overview & Security Principles

HomeVerse implements defense-in-depth across the API, database, and client layers to protect user assets, generative AI inference budgets, and private room scans.

Key principles enforced in **Phase 43**:
- **Zero Trust File Ingestion**: Never trust client-reported filenames, extensions, or MIME types.
- **Strict Cryptographic Standards**: Salted bcrypt hashing for credentials and signed JWT tokens with standard expiration lifetimes.
- **OWASP Secure Transport**: Defense-in-depth HTTP headers mitigating Clickjacking, MIME-sniffing, XSS, and Cross-Origin information leaks.
- **SQL Injection Prevention**: Exclusive use of parameterized ORM queries via SQLAlchemy.
- **Secrets Hygiene**: Active validation preventing weak development keys from operating in production.

---

## 2. Authentication & Cryptography

### Password Hashing (`backend/app/core/security.py`)
- Passwords are encrypted using **bcrypt** with a minimum work factor (salt rounds = 12).
- Plaintext passwords are truncated to bcrypt's 72-byte limit to prevent denial-of-service amplification.
- Passwords must meet complexity requirements:
  - Minimum length: 8 characters (configurable via `PASSWORD_MIN_LENGTH`).
  - At least one numeric digit (`0-9`).
  - At least one alphabetic character (`a-zA-Z`).

### JSON Web Tokens (JWT)
- **Algorithm**: `HS256` (HMAC-SHA256).
- **Access Tokens**: Issued with standard claims:
  - `sub`: User UUID
  - `email`: User email
  - `plan`: Subscription tier (`Free`, `Premium`, `Pro Designer`)
  - `type`: `access`
  - `iat`: Timestamp of issuance
  - `exp`: Expiration time (default 7 days, configurable)
- **Token Verification**: Handled by `decode_token(token: str)`, which verifies cryptographic signatures, expiration, and payload integrity. Expired or forged tokens raise `UnauthorizedException` conforming to Phase 41 error schemas.

---

## 3. Upload Security & Magic Bytes Verification

### "Do Not Blindly Trust Client Metadata"
Attackers commonly bypass naive file filters by appending `.jpg` or `.png` to malicious scripts or executable binaries. HomeVerse inspects the raw binary contents of every upload before it touches filesystem or AI processing queues.

```
Client Upload Request
         │
         ▼
[ Size Check ] ───────────► Exceeds 15MB? ──► Reject (422/413)
         │
         ▼
[ Dangerous Signature Scan ] ► MZ, ELF, PHP, <script? ──► Reject Security Violation
         │
         ▼
[ Binary Magic-Bytes Check ]
  - JPEG: \xff\xd8\xff
  - PNG:  \x89PNG\r\n\x1a\n
  - WebP: RIFF....WEBP
  - GIF:  GIF87a / GIF89a
  - PDF:  %PDF-
         │
         ▼
[ Filename Sanitization ] ──► Strip ../, ..\, null bytes, control chars
         │
         ▼
Safe File Ready for AI Processing
```

### Path Traversal Defense
User-provided filenames are sanitized via `sanitize_filename()`:
- Strips Unix (`../`) and Windows (`..\`) traversal sequences.
- Eliminates null bytes (`\x00`).
- Replaces unsafe characters with underscores while retaining valid detected extensions.

---

## 4. HTTP Security Headers (`backend/app/core/security_headers.py`)

All API responses are routed through `SecurityHeadersMiddleware`, applying OWASP-recommended headers:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from MIME-sniffing away from declared content types |
| `X-Frame-Options` | `DENY` | Prevents Clickjacking by disallowing framing in `<frame>`, `<iframe>`, `<embed>` |
| `X-XSS-Protection` | `1; mode=block` | Enables browser reflected XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects privacy by withholding full URLs on cross-origin navigation |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Enforces HTTPS transport (when running under HTTPS / production) |
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data: https: blob:; ...` | Restricts origins from which scripts, styles, and media can load |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables browser hardware access for API domains |

### Fingerprint Stripping
The middleware strips framework-revealing headers such as `Server` and `X-Powered-By` to prevent reconnaissance attacks.

---

## 5. Input Validation & XSS Sanitization (`backend/app/core/input_validation.py`)

- User-submitted text (project names, room labels, custom design prompts) is processed through `sanitize_text()`.
- Strips HTML tags, script execution payloads (`<script>`, `<iframe>`, `javascript:`, `onload=`, `onerror=`), and control characters.
- AI design prompts are filtered to strip non-printable binary characters while enforcing length caps.

---

## 6. SQL Injection Prevention

HomeVerse interacts with the database exclusively through SQLAlchemy ORM models and query builders:
```python
# Safe parameterized ORM query
user = db.query(UserModel).filter(UserModel.email == email).first()
```
All parameters are bound using database driver-level placeholders, preventing raw SQL concatenation and SQL injection vulnerabilities.

---

## 7. CORS Hardening

In `backend/app/main.py`, CORS origins are strictly validated:
- Wildcard `["*"]` is disallowed when `allow_credentials=True`.
- Only explicitly authorized origins (e.g., `http://localhost:3000`, `https://app.homeverse.ai`) are permitted.
- Permitted methods: `GET, POST, PUT, DELETE, OPTIONS, PATCH`.
- Whitelisted headers for client telemetry: `X-Request-ID`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.

---

## 8. Secrets Management & Production Hygiene

- `verify_secrets_hygiene()` runs automatically during application startup.
- If `ENVIRONMENT == "production"`, the system verifies that `JWT_SECRET` / `SECRET_KEY` is not using default development keys.
- Sensitive environment variables are loaded securely from `.env` or system environment without exposing secrets in structured JSON logs.

---

## 9. Verification & Testing

The security test suite in `backend/tests/core/test_security.py` validates all 17 security scenarios:
```powershell
# Run security test suite
.\.venv\Scripts\pytest tests/core/test_security.py -v

# Run entire backend test suite (84 tests passing)
.\.venv\Scripts\pytest tests/ -v
```

Verified Test Scenarios:
1. `test_password_hashing_and_verification`: Salted bcrypt hashing and verification.
2. `test_password_complexity_rules`: Length, digit, and alphabetic constraints.
3. `test_jwt_token_lifecycle`: Access token claims and validity.
4. `test_jwt_expired_token_raises_unauthorized`: Expiration handling.
5. `test_jwt_tampered_token_raises_unauthorized`: Signature forgery rejection.
6. `test_security_headers_present_on_responses`: Verification of all OWASP headers.
7. `test_magic_byte_detection_valid_images`: Verification of JPEG, PNG, WebP, PDF.
8. `test_reject_executable_disguised_as_image`: Blocking PE `.exe` disguised as `.jpg`.
9. `test_reject_script_payload_disguised_as_image`: Blocking shell scripts disguised as `.png`.
10. `test_reject_empty_and_oversized_uploads`: Empty & >15MB payload rejection.
11. `test_sanitize_filename_directory_traversal`: Path traversal & null-byte blocking.
12. `test_xss_sanitization`: Script and event handler stripping.
13. `test_prompt_sanitization`: AI prompt sanitization.
14. `test_register_with_password_hashes_in_database`: Registration password hashing.
15. `test_token_issuance_and_profile_retrieval`: Token endpoint and Bearer auth on `/me`.
16. `test_token_issuance_invalid_password_returns_401`: Password mismatch rejection.
17. `test_secrets_hygiene_checker`: Production secret validation.
