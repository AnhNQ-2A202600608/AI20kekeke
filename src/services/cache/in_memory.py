import time

from src.services.cache.base import BaseCacheStore


class InMemoryCacheStore(BaseCacheStore):
    """Bộ nhớ cache lưu tạm thời trong RAM (Python dictionary), hỗ trợ TTL."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[str, float | None]] = {}

    def get(self, key: str) -> str | None:
        """Lấy giá trị từ dict. Nếu hết hạn TTL thì xóa và trả về None."""
        if key not in self._store:
            return None

        value, expire_at = self._store[key]
        if expire_at is not None and time.time() > expire_at:
            # TTL hết hạn, tự động xóa
            del self._store[key]
            return None

        return value

    def set(self, key: str, value: str, ttl: int | None = None) -> bool:
        """Lưu giá trị với tùy chọn TTL tính bằng giây."""
        expire_at = time.time() + ttl if ttl is not None else None
        self._store[key] = (value, expire_at)
        return True

    def delete(self, key: str) -> bool:
        """Xóa key khỏi dict."""
        if key in self._store:
            del self._store[key]
            return True
        return False

    def exists(self, key: str) -> bool:
        """Kiểm tra key tồn tại và chưa hết hạn TTL."""
        return self.get(key) is not None
