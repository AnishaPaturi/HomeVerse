# Authentication Architecture

## 1. Overview
HomeVerse supports a hybrid authentication layer allowing frictionless access for homeowners, design studios, and enterprise contractors.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant DB
    participant Google

    User->>Frontend: Enter credentials / Click Google Auth
    alt Email & Password
        Frontend->>Backend: POST /api/auth/login
        Backend->>DB: Verify bcrypt password hash
        DB-->>Backend: User Record
        Backend-->>Frontend: JWT Token & Session Profile
    else Google OAuth
        Frontend->>Google: OAuth 2.0 Handshake
        Google-->>Frontend: OAuth Token
        Frontend->>Backend: POST /api/auth/google
        Backend->>Google: Validate token
        Backend->>DB: Upsert User Profile
        Backend-->>Frontend: Session & Bearer Tokens
    end
    Frontend->>Frontend: Persist in sessionStorage & Cookie
```

## 2. Token Specification & Security
- **Algorithm**: HMAC SHA-256 (HS256)
- **Token Expiry**: Access Token (24 hours), Refresh Token (7 days)
- **RBAC**: Standard Homeowner (`homeowner`), Pro Designer (`designer`), Admin (`admin`).
- **Demo Mode**: Instant 1-click profiles for testing and continuous evaluation without database lockouts.
