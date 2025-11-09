"""Pytest configuration and fixtures for Login API tests"""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from redis.asyncio import Redis

from app.main import app


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Setup test environment - runs once per session."""
    import os
    # Increase rate limit for tests
    os.environ["RATE_LIMIT_REQUESTS"] = "100"
    os.environ["RATE_LIMIT_WINDOW"] = "1"
    yield


@pytest.fixture(scope="function")
def client() -> TestClient:
    """Create a test client for the FastAPI app with mock Redis."""
    from unittest.mock import AsyncMock
    from app.main import limiter
    
    # Clear rate limiter storage before each test
    if hasattr(limiter, '_storage'):
        limiter._storage.storage.clear()
    
    # Create mock Redis for client tests (fresh for each test)
    mock_redis = AsyncMock()
    mock_redis.ping = AsyncMock(return_value=True)
    
    # Token storage (fresh dict for each test)
    _token_storage = {}
    _hash_storage = {}
    
    async def mock_get(key):
        return _token_storage.get(key)
    
    async def mock_setex(key, ttl, value):
        _token_storage[key] = value
        return True
    
    async def mock_delete(key):
        _token_storage.pop(key, None)
        _hash_storage.pop(key, None)
        return 1
    
    async def mock_hset(key, mapping=None, **kwargs):
        if mapping:
            _hash_storage[key] = mapping
        return 1
    
    async def mock_hgetall(key):
        return _hash_storage.get(key)
    
    mock_redis.get = AsyncMock(side_effect=mock_get)
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.setex = AsyncMock(side_effect=mock_setex)
    mock_redis.delete = AsyncMock(side_effect=mock_delete)
    mock_redis.zadd = AsyncMock(return_value=1)
    mock_redis.zcard = AsyncMock(return_value=0)  # Start with 0 failed attempts
    mock_redis.zremrangebyscore = AsyncMock(return_value=1)
    mock_redis.expire = AsyncMock(return_value=True)
    mock_redis.hset = AsyncMock(side_effect=mock_hset)
    mock_redis.hgetall = AsyncMock(side_effect=mock_hgetall)
    mock_redis.hincrby = AsyncMock(return_value=1)
    mock_redis.sadd = AsyncMock(return_value=1)
    mock_redis.srem = AsyncMock(return_value=1)
    mock_redis.smembers = AsyncMock(return_value=set())
    mock_redis.keys = AsyncMock(return_value=[])
    
    app.state.redis = mock_redis
    
    test_client = TestClient(app)
    return test_client


@pytest_asyncio.fixture
async def redis_client() -> AsyncGenerator[Redis, None]:
    """Create a Redis client for testing."""
    redis = Redis(
        host="localhost",
        port=6379,
        db=1,  # Use different DB for tests
        decode_responses=True,
    )
    
    # Clear test database before each test
    await redis.flushdb()
    
    yield redis
    
    # Cleanup after test
    await redis.flushdb()
    await redis.close()


@pytest.fixture
def test_credentials() -> dict:
    """Test user credentials."""
    return {
        "username": "admin",
        "password": "admin123",
    }


@pytest.fixture
def invalid_credentials() -> dict:
    """Invalid test credentials."""
    return {
        "username": "admin",
        "password": "wrongpassword",
    }

