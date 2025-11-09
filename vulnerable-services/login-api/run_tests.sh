#!/bin/bash
# Test runner script for Login API Phase 2.1

set -e

echo "=== Login API Test Suite - Phase 2.1 ==="
echo ""

# Check if Redis is running
echo "1. Checking Redis..."
if ! docker ps | grep -q redis; then
    echo "   Starting Redis..."
    docker-compose up -d redis
    sleep 2
fi
echo "   ✓ Redis is running"

# Install dependencies
echo ""
echo "2. Installing dependencies..."
echo "   Installing app dependencies..."
pip install -q -r requirements.txt
echo "   Installing test dependencies..."
pip install -q -r tests/requirements.txt
echo "   ✓ All dependencies installed"

# Run tests
echo ""
echo "3. Running tests..."
echo ""

pytest -v \
    --cov=app \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-report=xml

echo ""
echo "=== Test Results ==="
echo "Coverage report generated:"
echo "  - HTML: htmlcov/index.html"
echo "  - XML: coverage.xml"
echo ""
echo "✓ All tests completed!"

