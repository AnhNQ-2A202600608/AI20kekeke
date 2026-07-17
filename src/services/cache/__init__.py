from functools import lru_cache

from src.config import get_settings
from src.services.cache.base import BaseCacheStore
from src.services.cache.in_memory import InMemoryCacheStore

try:
    from src.services.cache.redis_store import RedisCacheStore
except ModuleNotFoundError:  # optional dependency
    RedisCacheStore = None  # type: ignore[assignment]


@lru_cache
def get_cache_store() -> BaseCacheStore:
    settings = get_settings()
    if settings.cache_type == "redis" and settings.redis_url and RedisCacheStore is not None:
        return RedisCacheStore(
            redis_url=settings.redis_url,
            redis_token=settings.redis_token or None,
        )
    return InMemoryCacheStore()


__all__ = [
    "BaseCacheStore",
    "InMemoryCacheStore",
    "RedisCacheStore",
    "get_cache_store",
]
