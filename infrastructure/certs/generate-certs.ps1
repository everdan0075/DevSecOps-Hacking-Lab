# Generate self-signed CA and service certificates for mTLS
# Usage: .\generate-certs.ps1
# Requires: OpenSSL installed and in PATH

$ErrorActionPreference = "Stop"

$CERTS_DIR = $PSScriptRoot
$CA_DIR = Join-Path $CERTS_DIR "ca"
$SERVICES_DIR = Join-Path $CERTS_DIR "services"

Write-Host "🔐 Generating mTLS certificates for DevSecOps Lab" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if OpenSSL is available
try {
    $null = Get-Command openssl -ErrorAction Stop
} catch {
    Write-Host "❌ OpenSSL not found in PATH!" -ForegroundColor Red
    Write-Host "Please install OpenSSL or use Git Bash to run generate-certs.sh" -ForegroundColor Yellow
    exit 1
}

# Create directories
New-Item -ItemType Directory -Force -Path $CA_DIR | Out-Null
New-Item -ItemType Directory -Force -Path "$SERVICES_DIR\gateway" | Out-Null
New-Item -ItemType Directory -Force -Path "$SERVICES_DIR\auth-service" | Out-Null
New-Item -ItemType Directory -Force -Path "$SERVICES_DIR\user-service" | Out-Null

# =============================================================================
# Step 1: Generate CA (Certificate Authority)
# =============================================================================
Write-Host ""
Write-Host "📜 Step 1: Generating CA certificate..." -ForegroundColor Yellow

# CA private key
openssl genrsa -out "$CA_DIR\ca-key.pem" 4096

# CA certificate (valid for 10 years)
openssl req -new -x509 -days 3650 -key "$CA_DIR\ca-key.pem" `
    -out "$CA_DIR\ca-cert.pem" `
    -subj "/C=PL/ST=Mazovia/L=Warsaw/O=DevSecOps Lab/OU=Security/CN=DevSecOps CA"

Write-Host "✅ CA certificate generated: $CA_DIR\ca-cert.pem" -ForegroundColor Green

# =============================================================================
# Step 2: Generate API Gateway certificates
# =============================================================================
Write-Host ""
Write-Host "🌐 Step 2: Generating API Gateway certificates..." -ForegroundColor Yellow

# Gateway private key
openssl genrsa -out "$SERVICES_DIR\gateway\key.pem" 4096

# Gateway CSR
openssl req -new -key "$SERVICES_DIR\gateway\key.pem" `
    -out "$SERVICES_DIR\gateway\csr.pem" `
    -subj "/C=PL/ST=Mazovia/L=Warsaw/O=DevSecOps Lab/OU=Gateway/CN=api-gateway"

# Gateway certificate signed by CA
openssl x509 -req -days 730 `
    -in "$SERVICES_DIR\gateway\csr.pem" `
    -CA "$CA_DIR\ca-cert.pem" `
    -CAkey "$CA_DIR\ca-key.pem" `
    -CAcreateserial `
    -out "$SERVICES_DIR\gateway\cert.pem"

# Cleanup CSR
Remove-Item "$SERVICES_DIR\gateway\csr.pem"

Write-Host "✅ Gateway certificates generated" -ForegroundColor Green

# =============================================================================
# Step 3: Generate Auth Service certificates
# =============================================================================
Write-Host ""
Write-Host "🔑 Step 3: Generating Auth Service certificates..." -ForegroundColor Yellow

# Auth service private key
openssl genrsa -out "$SERVICES_DIR\auth-service\key.pem" 4096

# Auth service CSR
openssl req -new -key "$SERVICES_DIR\auth-service\key.pem" `
    -out "$SERVICES_DIR\auth-service\csr.pem" `
    -subj "/C=PL/ST=Mazovia/L=Warsaw/O=DevSecOps Lab/OU=Auth/CN=login-api"

# Auth service certificate signed by CA
openssl x509 -req -days 730 `
    -in "$SERVICES_DIR\auth-service\csr.pem" `
    -CA "$CA_DIR\ca-cert.pem" `
    -CAkey "$CA_DIR\ca-key.pem" `
    -CAcreateserial `
    -out "$SERVICES_DIR\auth-service\cert.pem"

# Cleanup CSR
Remove-Item "$SERVICES_DIR\auth-service\csr.pem"

Write-Host "✅ Auth Service certificates generated" -ForegroundColor Green

# =============================================================================
# Step 4: Generate User Service certificates
# =============================================================================
Write-Host ""
Write-Host "👤 Step 4: Generating User Service certificates..." -ForegroundColor Yellow

# User service private key
openssl genrsa -out "$SERVICES_DIR\user-service\key.pem" 4096

# User service CSR
openssl req -new -key "$SERVICES_DIR\user-service\key.pem" `
    -out "$SERVICES_DIR\user-service\csr.pem" `
    -subj "/C=PL/ST=Mazovia/L=Warsaw/O=DevSecOps Lab/OU=Users/CN=user-service"

# User service certificate signed by CA
openssl x509 -req -days 730 `
    -in "$SERVICES_DIR\user-service\csr.pem" `
    -CA "$CA_DIR\ca-cert.pem" `
    -CAkey "$CA_DIR\ca-key.pem" `
    -CAcreateserial `
    -out "$SERVICES_DIR\user-service\cert.pem"

# Cleanup CSR
Remove-Item "$SERVICES_DIR\user-service\csr.pem"

Write-Host "✅ User Service certificates generated" -ForegroundColor Green

# =============================================================================
# Summary
# =============================================================================
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "✅ mTLS Certificate Generation Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CA Certificate:"
Write-Host "  $CA_DIR\ca-cert.pem"
Write-Host ""
Write-Host "Service Certificates:"
Write-Host "  Gateway:      $SERVICES_DIR\gateway\cert.pem and key.pem"
Write-Host "  Auth Service: $SERVICES_DIR\auth-service\cert.pem and key.pem"
Write-Host "  User Service: $SERVICES_DIR\user-service\cert.pem and key.pem"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Update docker-compose.yml to mount certificates"
Write-Host "  2. Configure services to use mTLS"
Write-Host "  3. Test connection"
Write-Host ""

