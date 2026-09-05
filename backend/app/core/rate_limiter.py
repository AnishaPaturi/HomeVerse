"""
Sliding Window Rate Limiter for HomeVerse (Phase 42)
Protects:
- Login (5 req/min)
- Registration (3 req/min)
- AI Generation (Tier-Aware: Free = 5/day, Premium = 50/day)
- Image & Blueprint Uploads (10 req/min)
- General API Endpoints (100 req/min)

Supports Redis backend with seamless in-memory fallback for offline/development environments.
"""
from collections import defaultdict
import logging
import threading
import time
from typing import Any, Dict, Optional, Tuple
import uuid

from fastapi import Depends, Request, Response
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import RateLimitExceededException
from app.db.session import get_db
from app.models.user import User as UserModel

logger = logging.getLogger("homeverse.rate_limiter")


class _InMemorySlidingWindow:
    """Thread-safe sliding window rate limiter fallback when Redis is unavailable."""

    def __init__(self):
        self._lock = threading.Lock()
        self._store: Dict[str, list] = defaultdict(list)

    def check(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, int, int, int]:
        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            # Purge timestamps outside current window
            timestamps = [t for t in self._store[key] if t > window_start]

            if len(timestamps) >= limit:
                oldest = timestamps[0]
                retry_after = max(1, int(oldest + window_seconds - now))
                reset_time = int(oldest + window_seconds)
                self._store[key] = timestamps
                return True, 0, retry_after, reset_time

            # Record current timestamp
            timestamps.append(now)
            self._store[key] = timestamps
            remaining = limit - len(timestamps)
            reset_time = int(now + window_seconds)
            return False, remaining, 0, reset_time

    def get_count(self, key: str, window_seconds: int) -> int:
        now = time.time()
        window_start = now - window_seconds
        with self._lock:
            self._store[key] = [t for t in self._store[key] if t > window_start]
            return len(self._store[key])

    def clear(self):
        with self._lock:
            self._store.clear()


_in_memory_store = _InMemorySlidingWindow()


class RateLimiter:
    """
    FastAPI dependency enforcing sliding window rate limits.
    Injects standard RFC headers:
    - X-RateLimit-Limit
    - X-RateLimit-Remaining
    - X-RateLimit-Reset
    - Retry-After (on 429)
    """

    def __init__(
        self,
        times: int,
        seconds: int,
        scope: str = "default",
        tier_aware: bool = False,
    ):
        self.default_times = times
        self.seconds = seconds
        self.scope = scope
        self.tier_aware = tier_aware
        self._redis_client = None
        self._redis_failed = False

    @property
    def redis(self):
        """Lazy connection to Redis server."""
        if self._redis_client is None and not self._redis_failed:
            try:
                import redis
                self._redis_client = redis.Redis.from_url(
                    settings.REDIS_URL,
                    socket_connect_timeout=0.5,
                    socket_timeout=0.5,
                )
                self._redis_client.ping()
            except Exception as e:
                logger.debug(f"Redis not available for rate limiting ({e}). Using in-memory store.")
                self._redis_failed = True
                self._redis_client = None
        return self._redis_client

    def _check_redis(self, key: str, limit: int, window_seconds: int) -> Optional[Tuple[bool, int, int, int]]:
        """Evaluate sliding window using Redis sorted sets (ZADD/ZREMRANGEBYSCORE)."""
        r = self.redis
        if r is None:
            return None

        now = time.time()
        window_start = now - window_seconds
        redis_key = f"rl:{self.scope}:{key}"

        try:
            pipe = r.pipeline()
            # Remove timestamps older than window
            pipe.zremrangebyscore(redis_key, "-inf", window_start)
            # Count remaining items in window
            pipe.zcard(redis_key)
            results = pipe.execute()
            current_count = results[1]

            if current_count >= limit:
                # Find oldest item to calculate reset/retry_after
                oldest = r.zrange(redis_key, 0, 0, withscores=True)
                oldest_ts = oldest[0][1] if oldest else now
                retry_after = max(1, int(oldest_ts + window_seconds - now))
                reset_time = int(oldest_ts + window_seconds)
                return True, 0, retry_after, reset_time

            # Add new timestamp with unique member tag
            unique_member = f"{now}-{uuid.uuid4().hex[:6]}"
            pipe = r.pipeline()
            pipe.zadd(redis_key, {unique_member: now})
            pipe.expire(redis_key, window_seconds + 1)
            pipe.execute()

            remaining = limit - current_count - 1
            reset_time = int(now + window_seconds)
            return False, remaining, 0, reset_time
        except Exception as e:
            logger.warning(f"Redis error during rate limiting check: {e}. Falling back to in-memory store.")
            self._redis_failed = True
            return None

    def check(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, int, int, int]:
        """Runs rate check against Redis if available, else in-memory fallback."""
        if not getattr(settings, "RATE_LIMIT_ENABLED", True):
            return False, limit, 0, int(time.time() + window_seconds)

        res = self._check_redis(key, limit, window_seconds)
        if res is not None:
            return res

        return _in_memory_store.check(f"{self.scope}:{key}", limit, window_seconds)

    def _resolve_client_ip(self, request: Request) -> str:
        """Extracts client IP considering proxy X-Forwarded-For."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "127.0.0.1"

    async def __call__(
        self,
        request: Request,
        response: Response,
        db: Session = Depends(get_db),
    ) -> None:
        """FastAPI Dependency Entrypoint."""
        if not getattr(settings, "RATE_LIMIT_ENABLED", True):
            return

        client_ip = self._resolve_client_ip(request)
        identifier = client_ip
        limit = self.default_times

        # Tier-aware resolution (e.g. Free: 5/day, Premium: 50/day)
        if self.tier_aware:
            user_plan = "Free"
            user = None

            # Resolve user from header or query param
            user_id_hdr = request.headers.get("X-User-Id")
            user_email_hdr = request.headers.get("X-User-Email")
            email_param = request.query_params.get("email")
            user_id_param = request.query_params.get("user_id")

            target_id = user_id_hdr or user_id_param
            target_email = user_email_hdr or email_param

            if target_id:
                try:
                    uid = uuid.UUID(str(target_id))
                    user = db.query(UserModel).filter(UserModel.id == uid).first()
                except (ValueError, TypeError):
                    pass

            if not user and target_email:
                user = db.query(UserModel).filter(UserModel.email == str(target_email)).first()

            if user:
                identifier = f"user:{user.id}"
                user_plan = user.plan or "Free"
            else:
                # Use client IP as identity for unauthenticated users
                identifier = f"ip:{client_ip}"

            if user_plan.lower() in ("premium", "pro", "pro designer"):
                limit = settings.RATE_LIMIT_AI_PREMIUM_PER_DAY
            else:
                limit = settings.RATE_LIMIT_AI_FREE_PER_DAY

        is_limited, remaining, retry_after, reset_time = self.check(
            identifier, limit, self.seconds
        )

        # Injects standard RFC rate limit headers into response
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(reset_time)

        if is_limited:
            response.headers["Retry-After"] = str(retry_after)
            human_msg = (
                f"Rate limit exceeded for {self.scope}. "
                f"You have reached your limit of {limit} requests per window. "
                f"Please retry in {retry_after} seconds."
            )
            if self.tier_aware and limit == settings.RATE_LIMIT_AI_FREE_PER_DAY:
                human_msg = (
                    f"Daily AI generation limit reached ({limit} designs/day for Free tier). "
                    f"Upgrade to Premium for {settings.RATE_LIMIT_AI_PREMIUM_PER_DAY} designs/day."
                )
            rate_headers = {
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_time),
                "Retry-After": str(retry_after),
            }

            raise RateLimitExceededException(
                message=human_msg,
                retry_after_seconds=retry_after,
                headers=rate_headers,
            )


# Pre-configured reusable dependencies
rate_limit_login = RateLimiter(
    times=getattr(settings, "RATE_LIMIT_LOGIN_PER_MINUTE", 5),
    seconds=60,
    scope="auth:login",
)

rate_limit_register = RateLimiter(
    times=getattr(settings, "RATE_LIMIT_REGISTER_PER_MINUTE", 3),
    seconds=60,
    scope="auth:register",
)

rate_limit_ai_generation = RateLimiter(
    times=getattr(settings, "RATE_LIMIT_AI_FREE_PER_DAY", 5),
    seconds=86400,
    scope="ai:generation",
    tier_aware=True,
)

rate_limit_upload = RateLimiter(
    times=getattr(settings, "RATE_LIMIT_UPLOAD_PER_MINUTE", 10),
    seconds=60,
    scope="upload",
)

rate_limit_general = RateLimiter(
    times=getattr(settings, "RATE_LIMIT_DEFAULT_PER_MINUTE", 100),
    seconds=60,
    scope="general:api",
)


def get_user_ai_quota(user: Optional[UserModel], client_ip: str = "127.0.0.1") -> Dict[str, Any]:
    """Inspects daily AI generation usage and remaining quota for display in UI."""
    plan = user.plan if user else "Free"
    is_premium = plan.lower() in ("premium", "pro", "pro designer")
    limit = (
        settings.RATE_LIMIT_AI_PREMIUM_PER_DAY
        if is_premium
        else settings.RATE_LIMIT_AI_FREE_PER_DAY
    )

    identifier = f"user:{user.id}" if user else f"ip:{client_ip}"
    key = f"ai:generation:{identifier}"
    used = 0

    r = rate_limit_ai_generation.redis
    if r is not None:
        try:
            redis_key = f"rl:ai:generation:{identifier}"
            window_start = time.time() - 86400
            r.zremrangebyscore(redis_key, "-inf", window_start)
            used = r.zcard(redis_key)
        except Exception:
            used = _in_memory_store.get_count(key, 86400)
    else:
        used = _in_memory_store.get_count(key, 86400)

    remaining = max(0, limit - used)

    return {
        "tier": plan,
        "is_premium": is_premium,
        "limit_per_day": limit,
        "used_today": used,
        "remaining_today": remaining,
        "resets_in_seconds": 86400,
    }
