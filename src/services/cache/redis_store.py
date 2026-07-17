from __future__ import annotations

import logging

try:
    import redis
except ModuleNotFoundError:  # optional dependency
    redis = None  # type: ignore[assignment]

from src.services.cache.base import BaseCacheStore

logger = logging.getLogger(__name__)


class RedisCacheStore(BaseCacheStore):
    def __init__(self, redis_url: str, redis_token: str | None = None) -> None:
        if redis is None:
            raise ModuleNotFoundError("redis package is not installed")

        self.redis_url = redis_url
        self.redis_token = redis_token
        self._client = None
        self._connect()

    def _connect(self) -> None:
        try:
            if redis is None:
                self._client = None
                return

            if self.redis_token:
                self._client = redis.Redis.from_url(
                    self.redis_url,
                    password=self.redis_token,
                    decode_responses=True,
                )
            else:
                self._client = redis.Redis.from_url(
                    self.redis_url,
                    decode_responses=True,
                )
        except Exception as e:
            logger.error(f"Lỗi kết nối tới Redis ({self.redis_url}): {str(e)}")
            self._client = None

    @property
    def client(self):
        if self._client is None:
            self._connect()
        return self._client

    def get(self, key: str) -> str | None:
        client = self.client
        if not client:
            return None
        try:
            val = client.get(key)
            if val is not None:
                return val
            return None
        except Exception as e:
            logger.error(f"Lỗi Redis GET ({key}): {str(e)}")
            return None

    def set(self, key: str, value: str, ttl: int | None = None) -> bool:
        client = self.client
        if not client:
            return False
        try:
            if ttl is not None:
                return bool(client.set(key, value, ex=ttl))
            return bool(client.set(key, value))
        except Exception as e:
            logger.error(f"Lỗi Redis SET ({key}): {str(e)}")
            return False

    def delete(self, key: str) -> bool:
        client = self.client
        if not client:
            return False
        try:
            return bool(client.delete(key))
        except Exception as e:
            logger.error(f"Lỗi Redis DEL ({key}): {str(e)}")
            return False

    def exists(self, key: str) -> bool:
        client = self.client
        if not client:
            return False
        try:
            return bool(client.exists(key))
        except Exception as e:
            logger.error(f"Lỗi Redis EXISTS ({key}): {str(e)}")
            return False
