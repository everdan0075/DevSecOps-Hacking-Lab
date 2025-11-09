"""Unit tests for security module (JWT, MFA, Redis functions)"""

import pytest
from datetime import datetime, timedelta

from app.security import (
    verify_login,
    generate_totp_secret,
    current_mfa_code,
    verify_mfa_code,
    create_access_token,
    generate_token_bundle,
    verify_refresh_token,
    record_failed_attempt,
    get_failed_attempts,
    ban_ip,
    is_ip_banned,
    clear_failed_attempts,
)


class TestLoginVerification:
    """Tests for basic login verification"""

    def test_valid_credentials(self):
        """Test login with valid credentials"""
        assert verify_login("admin", "admin123") is True
        assert verify_login("user", "password") is True
        assert verify_login("test", "test123") is True

    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        assert verify_login("admin", "wrongpassword") is False
        assert verify_login("nonexistent", "password") is False
        assert verify_login("", "") is False


class TestMFAFunctions:
    """Tests for MFA/TOTP functions"""

    def test_generate_totp_secret(self):
        """Test TOTP secret generation"""
        secret = generate_totp_secret("admin")
        assert isinstance(secret, str)
        assert len(secret) > 0
        # Should be deterministic for same user
        assert generate_totp_secret("admin") == secret

    def test_current_mfa_code_format(self):
        """Test MFA code generation returns 6-digit code"""
        code = current_mfa_code("admin")
        assert isinstance(code, str)
        assert len(code) == 6
        assert code.isdigit()

    def test_verify_mfa_code_valid(self):
        """Test MFA code verification with current code"""
        username = "admin"
        code = current_mfa_code(username)
        assert verify_mfa_code(username, code) is True

    def test_verify_mfa_code_invalid(self):
        """Test MFA code verification with invalid code"""
        assert verify_mfa_code("admin", "000000") is False
        assert verify_mfa_code("admin", "invalid") is False


class TestJWTFunctions:
    """Tests for JWT token functions"""

    def test_create_access_token(self):
        """Test JWT access token creation"""
        token, expires_at = create_access_token("testuser")
        
        assert isinstance(token, str)
        assert len(token) > 0
        assert isinstance(expires_at, datetime)
        
        # Token should expire in the future
        assert expires_at > datetime.utcnow()
        
        # Should be roughly 5 minutes from now
        time_diff = (expires_at - datetime.utcnow()).total_seconds()
        assert 290 < time_diff < 310  # Allow some tolerance

    def test_jwt_token_format(self):
        """Test JWT token has correct format (3 parts)"""
        token, _ = create_access_token("testuser")
        parts = token.split(".")
        assert len(parts) == 3  # header.payload.signature


@pytest.mark.asyncio
class TestTokenBundle:
    """Tests for token bundle generation"""

    async def test_generate_token_bundle(self, redis_client):
        """Test complete token bundle generation"""
        bundle = await generate_token_bundle(redis_client, "testuser")
        
        assert bundle.access_token is not None
        assert bundle.refresh_token is not None
        assert isinstance(bundle.access_token, str)
        assert isinstance(bundle.refresh_token, str)
        
        # Check expiration times
        assert bundle.access_expires_at > datetime.utcnow()
        assert bundle.refresh_expires_at > datetime.utcnow()
        assert bundle.refresh_expires_at > bundle.access_expires_at

    async def test_refresh_token_stored_in_redis(self, redis_client):
        """Test that refresh token is stored in Redis"""
        bundle = await generate_token_bundle(redis_client, "testuser")
        
        # Check token exists in Redis
        key = f"refresh_token:{bundle.refresh_token}"
        stored_username = await redis_client.get(key)
        assert stored_username == "testuser"

    async def test_verify_refresh_token_valid(self, redis_client):
        """Test verification of valid refresh token"""
        bundle = await generate_token_bundle(redis_client, "testuser")
        
        username = await verify_refresh_token(
            redis_client, bundle.refresh_token, revoke=False
        )
        assert username == "testuser"

    async def test_verify_refresh_token_invalid(self, redis_client):
        """Test verification of invalid refresh token"""
        username = await verify_refresh_token(
            redis_client, "invalid_token", revoke=False
        )
        assert username is None

    async def test_refresh_token_revocation(self, redis_client):
        """Test that refresh token is revoked after use"""
        bundle = await generate_token_bundle(redis_client, "testuser")
        
        # Verify and revoke
        username = await verify_refresh_token(
            redis_client, bundle.refresh_token, revoke=True
        )
        assert username == "testuser"
        
        # Try to use again - should fail
        username = await verify_refresh_token(
            redis_client, bundle.refresh_token, revoke=False
        )
        assert username is None


@pytest.mark.asyncio
class TestIPBanning:
    """Tests for IP banning functionality"""

    async def test_record_failed_attempt(self, redis_client):
        """Test recording failed login attempts"""
        ip = "192.168.1.100"
        
        count = await record_failed_attempt(redis_client, ip, "admin")
        assert count == 1
        
        count = await record_failed_attempt(redis_client, ip, "admin")
        assert count == 2

    async def test_get_failed_attempts(self, redis_client):
        """Test retrieving failed attempt count"""
        ip = "192.168.1.100"
        
        # Should be 0 initially
        count = await get_failed_attempts(redis_client, ip)
        assert count == 0
        
        # Add some attempts
        await record_failed_attempt(redis_client, ip, "admin")
        await record_failed_attempt(redis_client, ip, "admin")
        
        count = await get_failed_attempts(redis_client, ip)
        assert count == 2

    async def test_clear_failed_attempts(self, redis_client):
        """Test clearing failed attempts"""
        ip = "192.168.1.100"
        
        # Add attempts
        await record_failed_attempt(redis_client, ip, "admin")
        await record_failed_attempt(redis_client, ip, "admin")
        
        # Clear
        await clear_failed_attempts(redis_client, ip)
        
        # Should be 0 now
        count = await get_failed_attempts(redis_client, ip)
        assert count == 0

    async def test_ban_ip(self, redis_client):
        """Test IP banning"""
        ip = "192.168.1.100"
        
        # Should not be banned initially
        is_banned = await is_ip_banned(redis_client, ip)
        assert is_banned is False
        
        # Ban the IP
        await ban_ip(redis_client, ip)
        
        # Should be banned now
        is_banned = await is_ip_banned(redis_client, ip)
        assert is_banned is True

    async def test_ban_expiration(self, redis_client):
        """Test that IP ban has TTL set"""
        ip = "192.168.1.100"
        
        await ban_ip(redis_client, ip)
        
        # Check TTL is set
        key = f"banned_ip:{ip}"
        ttl = await redis_client.ttl(key)
        assert ttl > 0  # Should have expiration
        assert ttl <= 900  # Should not exceed BAN_DURATION


@pytest.mark.asyncio
class TestMFAChallenges:
    """Tests for MFA challenge management"""

    async def test_create_mfa_challenge(self, redis_client):
        """Test MFA challenge creation"""
        from app.security import create_mfa_challenge
        
        challenge_id = await create_mfa_challenge(
            redis_client, "testuser", "192.168.1.1"
        )
        
        assert challenge_id is not None
        assert isinstance(challenge_id, str)
        assert len(challenge_id) > 0

    async def test_get_mfa_challenge(self, redis_client):
        """Test retrieving MFA challenge"""
        from app.security import create_mfa_challenge, get_mfa_challenge
        
        challenge_id = await create_mfa_challenge(
            redis_client, "testuser", "192.168.1.1"
        )
        
        challenge = await get_mfa_challenge(redis_client, challenge_id)
        assert challenge is not None
        assert challenge["username"] == "testuser"
        assert challenge["client_ip"] == "192.168.1.1"
        assert challenge["attempts"] == "0"

    async def test_increment_mfa_attempts(self, redis_client):
        """Test incrementing MFA attempt counter"""
        from app.security import (
            create_mfa_challenge,
            increment_mfa_attempts,
        )
        
        challenge_id = await create_mfa_challenge(
            redis_client, "testuser", "192.168.1.1"
        )
        
        attempts = await increment_mfa_attempts(redis_client, challenge_id)
        assert attempts == 1
        
        attempts = await increment_mfa_attempts(redis_client, challenge_id)
        assert attempts == 2

    async def test_delete_mfa_challenge(self, redis_client):
        """Test deleting MFA challenge"""
        from app.security import (
            create_mfa_challenge,
            delete_mfa_challenge,
            get_mfa_challenge,
        )
        
        challenge_id = await create_mfa_challenge(
            redis_client, "testuser", "192.168.1.1"
        )
        
        # Should exist
        challenge = await get_mfa_challenge(redis_client, challenge_id)
        assert challenge is not None
        
        # Delete
        await delete_mfa_challenge(redis_client, challenge_id)
        
        # Should not exist
        challenge = await get_mfa_challenge(redis_client, challenge_id)
        assert challenge is None

