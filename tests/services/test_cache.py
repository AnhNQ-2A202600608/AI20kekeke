import time
from unittest.mock import MagicMock, patch

from src.services.cache import get_cache_store
from src.services.cache.in_memory import InMemoryCacheStore
from src.services.cache.redis_store import RedisCacheStore


def test_in_memory_cache_store_basic():
    """Kiểm tra các hoạt động cơ bản của InMemoryCacheStore: set, get, exists, delete."""
    store = InMemoryCacheStore()
    assert store.get("key1") is None
    assert store.exists("key1") is False

    assert store.set("key1", "value1") is True
    assert store.get("key1") == "value1"
    assert store.exists("key1") is True

    assert store.delete("key1") is True
    assert store.get("key1") is None
    assert store.exists("key1") is False


def test_in_memory_cache_store_ttl():
    """Kiểm tra thời gian sống TTL của InMemoryCacheStore."""
    store = InMemoryCacheStore()

    # Set key1 có TTL là 0.1 giây
    assert store.set("key1", "value1", ttl=0.1) is True
    assert store.get("key1") == "value1"

    # Đợi 0.15 giây
    time.sleep(0.15)
    assert store.get("key1") is None
    assert store.exists("key1") is False


@patch("redis.Redis.from_url")
def test_redis_cache_store(mock_from_url):
    """Kiểm tra RedisCacheStore bằng cách mock client kết nối thực tế."""
    mock_client = MagicMock()
    mock_from_url.return_value = mock_client

    store = RedisCacheStore(redis_url="redis://localhost:6379/0", redis_token="test_token")

    # 1. Test connection
    mock_from_url.assert_called_once_with("redis://localhost:6379/0", password="test_token", decode_responses=True)

    # 2. Test GET
    mock_client.get.return_value = "redis_value"
    assert store.get("key2") == "redis_value"
    mock_client.get.assert_called_with("key2")

    # 3. Test SET
    mock_client.set.return_value = True
    assert store.set("key2", "val2", ttl=60) is True
    mock_client.set.assert_called_with("key2", "val2", ex=60)

    # 4. Test DELETE
    mock_client.delete.return_value = 1
    assert store.delete("key2") is True
    mock_client.delete.assert_called_with("key2")

    # 5. Test EXISTS
    mock_client.exists.return_value = True
    assert store.exists("key2") is True
    mock_client.exists.assert_called_with("key2")


@patch("src.services.cache.RedisCacheStore")
@patch("src.services.cache.get_settings")
def test_cache_factory(mock_get_settings, mock_redis_store):
    """Kiểm tra cache factory trả về đúng class tương ứng cấu hình."""
    # 1. Cấu hình cache_type = in_memory
    mock_settings = MagicMock()
    mock_settings.cache_type = "in_memory"
    mock_get_settings.return_value = mock_settings

    get_cache_store.cache_clear()  # Clear cache của lru_cache
    store = get_cache_store()
    assert isinstance(store, InMemoryCacheStore)

    # 2. Cấu hình cache_type = redis
    mock_settings.cache_type = "redis"
    mock_settings.redis_url = "redis://localhost:6379/0"
    mock_settings.redis_token = "abc"
    mock_get_settings.return_value = mock_settings

    get_cache_store.cache_clear()
    store = get_cache_store()
    mock_redis_store.assert_called_once_with(redis_url="redis://localhost:6379/0", redis_token="abc")
