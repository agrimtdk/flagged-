import time
import logging
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("app.core.redis")


class RedisManager:
    def __init__(self):
        self.pool: Optional[aioredis.ConnectionPool] = None
        self.client: Optional[aioredis.Redis] = None
        self._local_rate_limits: dict = {}
        self._redis_available: bool = True

    def initialize(self):
        try:
            self.pool = aioredis.ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=20,
                decode_responses=True,
                socket_connect_timeout=0.2,
                socket_timeout=0.2
            )
            self.client = aioredis.Redis(connection_pool=self.pool)
            logger.info("Redis connection pool initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Redis pool: {e}")
            self.pool = None
            self.client = None
            self._redis_available = False

    async def close(self):
        if self.client:
            await self.client.close()
        if self.pool:
            await self.pool.disconnect()
        logger.info("Redis connection pool closed.")

    async def ping(self) -> bool:
        if not self.client or not self._redis_available:
            return False
        try:
            return await self.client.ping()
        except Exception as e:
            self._redis_available = False
            logger.warning(f"Redis ping failed: {e}")
            return False

    async def check_rate_limit(self, key: str, max_requests: int = 600, window_seconds: int = 60) -> bool:
        """
        Fixed window / counter rate limiting.
        Returns True if request is within limit, False if rate limit is exceeded.
        Falls back to fast in-memory rate limiter if Redis is offline (<0.1ms latency).
        """
        now = time.perf_counter()
        if not self.client or not self._redis_available:
            return self._check_rate_limit_local(key, max_requests, window_seconds, now)
        try:
            current = await self.client.incr(key)
            if current == 1:
                await self.client.expire(key, window_seconds)
            if current > max_requests:
                logger.warning(f"Rate limit exceeded for key '{key}': {current} > {max_requests}")
                return False
            return True
        except Exception as e:
            self._redis_available = False
            logger.warning(f"Rate limiter Redis error (falling back to fast in-memory limiter): {e}")
            return self._check_rate_limit_local(key, max_requests, window_seconds, now)

    def _check_rate_limit_local(self, key: str, max_requests: int, window_seconds: int, now: float) -> bool:
        entry = self._local_rate_limits.get(key)
        if not entry or (now - entry["window_start"]) >= window_seconds:
            self._local_rate_limits[key] = {"count": 1, "window_start": now}
            return True
        entry["count"] += 1
        if entry["count"] > max_requests:
            return False
        return True

    # Safe Cache Operations (Graceful fallbacks)
    async def get(self, key: str) -> Optional[str]:
        if not self.client:
            return None
        try:
            return await self.client.get(key)
        except Exception as e:
            logger.warning(f"Redis GET failed (falling back to database): {e}")
            return None

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        if not self.client:
            return False
        try:
            await self.client.set(key, value, ex=ex)
            return True
        except Exception as e:
            logger.warning(f"Redis SET failed (falling back to database): {e}")
            return False

    async def delete(self, key: str) -> bool:
        if not self.client:
            return False
        try:
            await self.client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Redis DELETE failed: {e}")
            return False


# Global Redis manager instance
redis_manager = RedisManager()
