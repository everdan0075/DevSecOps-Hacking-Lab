#!/bin/bash
# Generate self-signed CA and service certificates for mTLS
# Usage: ./generate-certs.sh

set -e

CERTS_DIR="$(cd "$(dirname "$0")" && pwd)"
CA_DIR="${CERTS_DIR}/ca"
SERVICES_DIR="${CERTS_DIR}/services"

echo "🔐 Generating mTLS certificates for DevSecOps Lab"
echo "=================================================="

# Create directories
mkdir -p "${CA_DIR}"
mkdir -p "${SERVICES_DIR}/gateway"
mkdir -p "${SERVICES_DIR}/auth-service"
mkdir -p "${SERVICES_DIR}/user-service"

# =============================================================================
# Step 1: Generate CA (Certificate Authority)
# =============================================================================
echo ""
echo "📜 Step 1: Generating CA certificate..."

# CA private key
openssl genrsa -out "${CA_DIR}/ca-key.pem" 4096

# CA certificate (valid for 10 years)
openssl req -new -x509 -days 3650 -key "${CA_DIR}/ca-key.pem" \
    -out "${CA_DIR}/ca-cert.pem" \
    -subj "/C=PL/ST=Mazovia/L=Warsaw/O=DevSecOps Lab/OU=Security/CN=DevSecOps CA"

echo "✅ CA certificate generated: ${CA_DIR}/ca-cert.pem"

# =============================================================================
# Step 2: Generate API Gateway certificates
# =============================================================================
echo ""
echo "🌐 Step 2: Generating API Gateway certificates..."

# Gateway private key
openssl genrsa -out "${SERVICES_DIR}/gateway/key.pem" 4096

# Gateway CSR (Certificate Signing Request)
openssl req -new -key "${SERVICES_DIR}/gateway/key.pem" \
    -out "${SERVICES_DIR}/gateway/csr.pem" \
    -subj "/C=PL/ST=Mazovia/L=Warsaw/O=DevSecOps Lab/OU=Gateway/CN=api-gateway"

# Gateway certificate signed by CA (valid for 2 years)
openssl x509 -req -days 730 \
    -in "${SERVICES_DIR}/gateway/csr.pem" \
    -CA "${CA_DIR}/ca-cert.pem" \
    -CAkey "${CA_DIR}/ca-key.pem" \
    -CAcreateserial \
    -out "${SERVICES_DIR}/gateway/cert.pem"

# Cleanup CSR
rm "${SERVICES_DIR}/gateway/csr.pem"

echo "✅ Gateway certificates generated"

# =============================================================================
# Step 3: Generate Auth Service certificates
# =============================================================================
echo ""
echo "🔑 Step 3: Generating Auth Service certificates..."

# Auth service private key
openssl genrsa -out "${SERVICES_DIR}/auth-service/key.pem" 4096

# Auth service CSR
openssl req -new -key "${SERVICES_DIR}/auth-service/key.pem" \
    -out "${SERVICES_DIR}/auth-service/csr.pem" \
    -subj "/C=PL/ST=Mazovia/L=Warsaw/O=DevSecOps Lab/OU=Auth/CN=login-api"

# Auth service certificate signed by CA
openssl x509 -req -days 730 \
    -in "${SERVICES_DIR}/auth-service/csr.pem" \
    -CA "${CA_DIR}/ca-cert.pem" \
    -CAkey "${CA_DIR}/ca-key.pem" \
    -CAcreateserial \
    -out "${SERVICES_DIR}/auth-service/cert.pem"

# Cleanup CSR
rm "${SERVICES_DIR}/auth-service/csr.pem"

echo "✅ Auth Service certificates generated"

# =============================================================================
# Step 4: Generate User Service certificates
# =============================================================================
echo ""
echo "👤 Step 4: Generating User Service certificates..."

# User service private key
openssl genrsa -out "${SERVICES_DIR}/user-service/key.pem" 4096

# User service CSR
openssl req -new -key "${SERVICES_DIR}/user-service/key.pem" \
    -out "${SERVICES_DIR}/user-service/csr.pem" \
    -subj "/C=PL/ST=Mazovia/L=Warsaw/O=DevSecOps Lab/OU=Users/CN=user-service"

# User service certificate signed by CA
openssl x509 -req -days 730 \
    -in "${SERVICES_DIR}/user-service/csr.pem" \
    -CA "${CA_DIR}/ca-cert.pem" \
    -CAkey "${CA_DIR}/ca-key.pem" \
    -CAcreateserial \
    -out "${SERVICES_DIR}/user-service/cert.pem"

# Cleanup CSR
rm "${SERVICES_DIR}/user-service/csr.pem"

echo "✅ User Service certificates generated"

# =============================================================================
# Step 5: Set permissions
# =============================================================================
echo ""
echo "🔒 Step 5: Setting file permissions..."

# Secure private keys (read-only for owner)
chmod 600 "${CA_DIR}/ca-key.pem"
chmod 600 "${SERVICES_DIR}/gateway/key.pem"
chmod 600 "${SERVICES_DIR}/auth-service/key.pem"
chmod 600 "${SERVICES_DIR}/user-service/key.pem"

# Public certificates can be readable
chmod 644 "${CA_DIR}/ca-cert.pem"
chmod 644 "${SERVICES_DIR}/gateway/cert.pem"
chmod 644 "${SERVICES_DIR}/auth-service/cert.pem"
chmod 644 "${SERVICES_DIR}/user-service/cert.pem"

echo "✅ Permissions set"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=================================================="
echo "✅ mTLS Certificate Generation Complete!"
echo "=================================================="
echo ""
echo "CA Certificate:"
echo "  ${CA_DIR}/ca-cert.pem"
echo ""
echo "Service Certificates:"
echo "  Gateway:      ${SERVICES_DIR}/gateway/{cert,key}.pem"
echo "  Auth Service: ${SERVICES_DIR}/auth-service/{cert,key}.pem"
echo "  User Service: ${SERVICES_DIR}/user-service/{cert,key}.pem"
echo ""
echo "Next steps:"
echo "  1. Update docker-compose.yml to mount certificates"
echo "  2. Configure services to use mTLS"
echo "  3. Test with: openssl s_client -connect localhost:8000 -CAfile ca/ca-cert.pem"
echo ""

