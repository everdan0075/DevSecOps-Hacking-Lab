# Login API Tests - Phase 2.1

Comprehensive test suite for the Secure Login API 2.0 implementation.

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Pytest fixtures and configuration
├── test_security.py         # Unit tests for security module
├── test_api.py              # Integration tests for API endpoints
├── requirements.txt         # Test dependencies
└── README.md               # This file
```

## Test Coverage

### Unit Tests (`test_security.py`)

**Login Verification:**
- ✅ Valid credentials
- ✅ Invalid credentials
- ✅ Non-existent users

**MFA/TOTP Functions:**
- ✅ TOTP secret generation
- ✅ MFA code format validation
- ✅ MFA code verification (valid/invalid)

**JWT Functions:**
- ✅ Access token creation
- ✅ Token format validation
- ✅ Token expiration timing

**Token Bundle:**
- ✅ Complete bundle generation
- ✅ Redis storage verification
- ✅ Refresh token verification
- ✅ Token revocation

**IP Banning:**
- ✅ Record failed attempts
- ✅ Get failed attempt count
- ✅ Clear failed attempts
- ✅ Ban IP functionality
- ✅ Ban expiration (TTL)

**MFA Challenges:**
- ✅ Challenge creation
- ✅ Challenge retrieval
- ✅ Increment attempts counter
- ✅ Challenge deletion

### Integration Tests (`test_api.py`)

**Login Endpoint (`/auth/login`):**
- ✅ Successful login with MFA
- ✅ Invalid credentials
- ✅ Missing username/password validation
- ✅ Rate limiting

**MFA Verify Endpoint (`/auth/mfa/verify`):**
- ✅ Successful verification
- ✅ Invalid code
- ✅ Non-existent challenge
- ✅ Max attempts limit

**Token Refresh Endpoint (`/auth/token/refresh`):**
- ✅ Successful refresh
- ✅ Invalid token
- ✅ Token rotation (old token rejection)

**Logout Endpoint (`/auth/logout`):**
- ✅ Single session logout
- ✅ All sessions logout
- ✅ Token revocation verification

**Health Endpoints:**
- ✅ Health check
- ✅ Root endpoint
- ✅ Metrics endpoint

**Complete Auth Flow:**
- ✅ End-to-end: login → MFA → refresh → logout

## Running Tests

### Prerequisites

```bash
# Install dependencies
pip install -r requirements.txt
pip install -r tests/requirements.txt

# Ensure Redis is running
docker-compose up -d redis
```

### Run All Tests

```bash
# From login-api directory
pytest

# With verbose output
pytest -v

# With coverage report
pytest --cov=app --cov-report=html
```

### Run Specific Test Files

```bash
# Unit tests only
pytest tests/test_security.py

# Integration tests only
pytest tests/test_api.py

# Specific test class
pytest tests/test_api.py::TestLoginEndpoint

# Specific test function
pytest tests/test_api.py::TestLoginEndpoint::test_login_success_with_mfa
```

### Run with Markers

```bash
# Run only async tests
pytest -m asyncio

# Run only integration tests
pytest -m integration

# Skip slow tests
pytest -m "not slow"
```

### Watch Mode

```bash
# Install pytest-watch
pip install pytest-watch

# Run tests on file changes
ptw
```

## Test Configuration

Tests use a separate Redis database (DB 1) to avoid conflicts with development data.

**Configuration (conftest.py):**
- Test client with FastAPI TestClient
- Redis client with auto-cleanup
- Test fixtures for credentials
- Event loop for async tests

## Coverage Goals

Target: **90%+ code coverage**

Current coverage:
- `security.py`: ~95%
- `main.py`: ~85%
- `models.py`: 100%
- `metrics.py`: 100%
- `config.py`: 100%

## CI/CD Integration

Tests are automatically run in GitHub Actions:

```yaml
- name: Run pytest
  run: |
    cd vulnerable-services/login-api
    pytest --cov=app --cov-report=xml
```

## Writing New Tests

### Test Naming Convention

- **File**: `test_<module>.py`
- **Class**: `Test<Feature>`
- **Method**: `test_<scenario>`

### Example Test

```python
def test_new_feature(client, test_credentials):
    """Test description"""
    # Arrange
    payload = {"key": "value"}
    
    # Act
    response = client.post("/endpoint", json=payload)
    
    # Assert
    assert response.status_code == 200
    assert response.json()["success"] is True
```

### Async Test

```python
@pytest.mark.asyncio
async def test_async_feature(redis_client):
    """Test async functionality"""
    result = await some_async_function(redis_client)
    assert result is not None
```

## Troubleshooting

### Redis Connection Error

```bash
# Ensure Redis is running
docker-compose up -d redis

# Test Redis connection
redis-cli ping
```

### Import Errors

```bash
# Ensure app module is in PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or run from login-api directory
cd vulnerable-services/login-api
pytest
```

### Async Test Warnings

If you see async warnings, ensure `pytest-asyncio` is installed:

```bash
pip install pytest-asyncio
```

## Test Results

After running tests, view coverage report:

```bash
# Open HTML coverage report
open htmlcov/index.html  # macOS
start htmlcov/index.html  # Windows
xdg-open htmlcov/index.html  # Linux
```

## Future Tests

Planned additions:
- [ ] Performance tests (load testing)
- [ ] Security penetration tests
- [ ] Token expiration timing tests
- [ ] Concurrent request tests
- [ ] Rate limit boundary tests
- [ ] MFA timing attack tests

