"""
Configuration for User Service
"""
import os

# Service Configuration
SERVICE_NAME = "user-service"
SERVICE_VERSION = "0.1.0"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# JWT Configuration (for when we need to parse tokens)
SECRET_KEY = os.getenv("SECRET_KEY", "devsecops-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

# Database (fake in-memory for demo)
USERS_DB = {
    "1": {
        "user_id": "1",
        "username": "admin",
        "email": "admin@devsecops.local",
        "role": "admin",
        "full_name": "Admin User",
        "phone": "+48 123 456 789",
        "address": "Warsaw, Poland",
        "ssn": "12345678901",  # Sensitive data
        "credit_card": "**** **** **** 1234",  # Sensitive data
    },
    "2": {
        "user_id": "2",
        "username": "user1",
        "email": "user1@devsecops.local",
        "role": "user",
        "full_name": "John Doe",
        "phone": "+48 987 654 321",
        "address": "Krakow, Poland",
        "ssn": "98765432109",
        "credit_card": "**** **** **** 5678",
    },
    "3": {
        "user_id": "3",
        "username": "user2",
        "email": "user2@devsecops.local",
        "role": "user",
        "full_name": "Jane Smith",
        "phone": "+48 111 222 333",
        "address": "Gdansk, Poland",
        "ssn": "11122233344",
        "credit_card": "**** **** **** 9012",
    },
    "4": {
        "user_id": "4",
        "username": "testuser",
        "email": "test@devsecops.local",
        "role": "user",
        "full_name": "Test User",
        "phone": "+48 444 555 666",
        "address": "Poznan, Poland",
        "ssn": "55566677788",
        "credit_card": "**** **** **** 3456",
    },
}

# Settings database (per user)
SETTINGS_DB = {
    "1": {
        "theme": "dark",
        "notifications_enabled": True,
        "two_factor_enabled": True,
        "api_key": "admin-secret-api-key-12345",
    },
    "2": {
        "theme": "light",
        "notifications_enabled": False,
        "two_factor_enabled": False,
        "api_key": "user1-secret-api-key-67890",
    },
    "3": {
        "theme": "dark",
        "notifications_enabled": True,
        "two_factor_enabled": True,
        "api_key": "user2-secret-api-key-abcde",
    },
    "4": {
        "theme": "light",
        "notifications_enabled": True,
        "two_factor_enabled": False,
        "api_key": "test-secret-api-key-fghij",
    },
}

# Metrics
ENABLE_METRICS = os.getenv("ENABLE_METRICS", "true").lower() == "true"

