# mTLS Certificates for DevSecOps Lab

This directory contains the infrastructure for mutual TLS (mTLS) authentication between microservices.

## 🔐 What is mTLS?

**Mutual TLS (mTLS)** is a security protocol where both client and server authenticate each other using X.509 certificates. This prevents:
- Man-in-the-middle attacks
- Unauthorized service access
- Service impersonation

## 📂 Directory Structure

```
infrastructure/certs/
├── ca/                          # Certificate Authority
│   ├── ca-cert.pem             # CA public certificate
│   ├── ca-key.pem              # CA private key (SENSITIVE!)
│   └── ca-cert.srl             # Serial number file
├── services/
│   ├── gateway/
│   │   ├── cert.pem            # Gateway public certificate
│   │   └── key.pem             # Gateway private key (SENSITIVE!)
│   ├── auth-service/
│   │   ├── cert.pem            # Auth service public certificate
│   │   └── key.pem             # Auth service private key (SENSITIVE!)
│   └── user-service/
│       ├── cert.pem            # User service public certificate
│       └── key.pem             # User service private key (SENSITIVE!)
├── generate-certs.sh           # Certificate generation script (Linux/Mac)
├── generate-certs.ps1          # Certificate generation script (Windows)
└── README.md                   # This file
```

## 🚀 Generate Certificates

### Linux / Mac / Git Bash

```bash
cd infrastructure/certs
chmod +x generate-certs.sh
./generate-certs.sh
```

### Windows PowerShell

```powershell
cd infrastructure\certs
.\generate-certs.ps1
```

**Requirements**: OpenSSL must be installed and in PATH

### What Gets Generated

1. **CA (Certificate Authority)**
   - Self-signed root certificate
   - Valid for 10 years
   - Signs all service certificates

2. **Service Certificates**
   - API Gateway certificate
   - Auth Service certificate
   - User Service certificate
   - Each valid for 2 years
   - Signed by our CA

## 🔒 Security Best Practices

### ⚠️ Private Keys

Private keys (`*-key.pem`) are **HIGHLY SENSITIVE**:
- Never commit to git (excluded via `.gitignore`)
- Store with `600` permissions (owner read-only)
- Rotate regularly in production
- Use hardware security modules (HSM) in prod

### Certificate Validation

Services must validate:
1. Certificate is signed by trusted CA
2. Certificate is not expired
3. Certificate Common Name (CN) matches service name
4. Certificate is not revoked (CRL/OCSP in production)

## 🛡️ mTLS Communication Flow

```
┌─────────────┐                  ┌──────────────┐
│ API Gateway │                  │ Auth Service │
│             │                  │              │
│ Client Cert │─────────────────▶│ Server Cert  │
│             │  1. TLS Handshake│              │
│             │◀─────────────────│              │
│             │  2. Verify Certs │              │
│             │                  │              │
│             │─────────────────▶│              │
│             │  3. HTTP Request │              │
│             │◀─────────────────│              │
│             │  4. HTTP Response│              │
└─────────────┘                  └──────────────┘
```

### Steps:

1. **Gateway initiates connection** to Auth Service
2. **Server presents certificate** (auth-service cert)
3. **Client presents certificate** (gateway cert)
4. **Both validate** certificates against CA
5. **Encrypted communication** begins if validation succeeds

## 🧪 Testing Certificates

### Verify CA Certificate

```bash
openssl x509 -in ca/ca-cert.pem -text -noout
```

### Verify Service Certificate

```bash
# Check certificate details
openssl x509 -in services/gateway/cert.pem -text -noout

# Verify certificate is signed by CA
openssl verify -CAfile ca/ca-cert.pem services/gateway/cert.pem
```

### Test TLS Connection

```bash
# Test connection to service (once mTLS is configured)
openssl s_client -connect localhost:8000 \
  -CAfile ca/ca-cert.pem \
  -cert services/gateway/cert.pem \
  -key services/gateway/key.pem
```

## 📋 Integration with Services

### API Gateway Configuration

```python
import httpx
import ssl

# Load client certificate for outgoing requests
cert = ("/certs/gateway/cert.pem", "/certs/gateway/key.pem")
verify = "/certs/ca/ca-cert.pem"

# Create HTTPS client with mTLS
client = httpx.AsyncClient(cert=cert, verify=verify)

# Make authenticated request to backend
response = await client.get("https://auth-service:8443/endpoint")
```

### Backend Service Configuration

```python
import uvicorn
import ssl

# SSL context for server
ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
ssl_context.load_cert_chain("/certs/auth-service/cert.pem", "/certs/auth-service/key.pem")
ssl_context.load_verify_locations("/certs/ca/ca-cert.pem")
ssl_context.verify_mode = ssl.CERT_REQUIRED  # Require client certificate

# Run with mTLS
uvicorn.run(app, host="0.0.0.0", port=8443, ssl=ssl_context)
```

## 🔄 Certificate Rotation

To regenerate certificates (e.g., before expiration):

```bash
# Backup old certificates
mv ca ca.old
mv services services.old

# Generate new certificates
./generate-certs.sh

# Update running services (requires restart)
docker-compose restart
```

## ⚠️ Vulnerabilities to Demonstrate

Even with mTLS, vulnerabilities can exist:

1. **Certificate Validation Bypass**
   - Disabling certificate verification
   - Not checking CN/SAN fields

2. **Weak Cipher Suites**
   - Using deprecated TLS versions
   - Allowing weak encryption

3. **Private Key Exposure**
   - Keys in source code
   - Insufficient file permissions

4. **Missing Certificate Revocation**
   - No CRL/OCSP checking
   - Expired certs still accepted

## 📚 References

- [RFC 8446 - TLS 1.3](https://datatracker.ietf.org/doc/html/rfc8446)
- [mTLS Best Practices](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [OWASP Transport Layer Protection](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

---

**Remember**: This is for educational purposes. In production:
- Use proper PKI infrastructure
- Implement certificate rotation
- Monitor certificate expiration
- Use hardware security for CA keys

