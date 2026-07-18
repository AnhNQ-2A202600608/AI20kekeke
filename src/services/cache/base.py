from abc import ABC, abstractmethod


class BaseCacheStore(ABC):
    """Lớp cơ sở trừu tượng định nghĩa các phương thức giao tiếp của Cache Store."""

    @abstractmethod
    def get(self, key: str) -> str | None:
        """Lấy giá trị từ cache theo key. Trả về None nếu không tìm thấy."""
        pass

    @abstractmethod
    def set(self, key: str, value: str, ttl: int | None = None) -> bool:
        """Lưu giá trị vào cache theo key cùng thời gian sống (TTL) tính bằng giây."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Xóa giá trị khỏi cache theo key."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Kiểm tra xem key có tồn tại trong cache hay không."""
        pass
