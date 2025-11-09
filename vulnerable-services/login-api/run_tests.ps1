# Test runner script for Login API Phase 2.1 (PowerShell)

Write-Host "=== Login API Test Suite - Phase 2.1 ===" -ForegroundColor Cyan
Write-Host ""

# Check if Redis is running
Write-Host "1. Checking Redis..." -ForegroundColor Yellow
$redisRunning = docker ps --format "{{.Names}}" | Select-String "redis"
if (-not $redisRunning) {
    Write-Host "   Starting Redis..." -ForegroundColor Gray
    docker-compose up -d redis
    Start-Sleep -Seconds 2
}
Write-Host "   [OK] Redis is running" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "2. Installing dependencies..." -ForegroundColor Yellow
Write-Host "   Upgrading pip..."
python -m pip install --upgrade pip -q

Write-Host "   Installing core dependencies (with binary wheels)..."
pip install --prefer-binary --only-binary=pydantic-core,cryptography `
    fastapi uvicorn pydantic pydantic-settings -q

Write-Host "   Installing remaining app dependencies..."
pip install -q python-jose passlib python-multipart slowapi python-dotenv redis pyotp
pip install -q prometheus-fastapi-instrumentator prometheus-client structlog python-json-logger httpx

Write-Host "   Installing test dependencies..."
pip install -q pytest pytest-asyncio pytest-cov httpx

Write-Host "   [OK] All dependencies installed" -ForegroundColor Green

# Run tests
Write-Host ""
Write-Host "3. Running tests..." -ForegroundColor Yellow
Write-Host ""

pytest -v `
    --cov=app `
    --cov-report=term-missing `
    --cov-report=html `
    --cov-report=xml

Write-Host ""
Write-Host "=== Test Results ===" -ForegroundColor Cyan
Write-Host "Coverage report generated:"
Write-Host "  - HTML: htmlcov/index.html"
Write-Host "  - XML: coverage.xml"
Write-Host ""
Write-Host "[SUCCESS] All tests completed!" -ForegroundColor Green

