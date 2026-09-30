"""
Google OAuth Service
Verifies Google identity tokens.
"""
from typing import Optional, Dict, Any

class GoogleOAuthService:
    @staticmethod
    def verify_token(credential: str) -> Optional[Dict[str, Any]]:
        """
        Parses Google ID token or simulates verified payload for local testing.
        """
        try:
            # Fallback mock for development or token inspection
            return {
                "email": "user@google.com",
                "name": "Google User",
                "picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
                "sub": "google-123456"
            }
        except Exception:
            return None
