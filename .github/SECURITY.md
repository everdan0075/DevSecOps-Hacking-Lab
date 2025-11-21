# Security Policy

## Overview

DevSecOps Hacking Lab is an **intentionally vulnerable** educational security testing environment. This project is designed to demonstrate both offensive and defensive security techniques in a controlled setting.

## Important Notice

⚠️ **This project contains intentional security vulnerabilities for educational purposes.**

**DO NOT**:
- Deploy this project to production environments
- Expose this project to the public internet
- Use production credentials or real user data
- Attack systems without proper authorization

**DO**:
- Use in isolated local/development environments
- Follow responsible disclosure practices
- Report unintentional security issues
- Learn and practice security testing techniques

## Intentional Vulnerabilities

The following vulnerabilities are **by design** and should **NOT** be reported as security issues:

### Authentication & Authorization
- **IDOR (Insecure Direct Object Reference)**: User profiles accessible without authorization (`/api/profile/{user_id}`)
- **JWT Algorithm Confusion**: Server may accept `alg: none` tokens
- **Weak JWT Secrets**: Development secret keys (should be rotated in production)
- **MFA Bypass**: Race conditions in MFA verification
- **Credential Stuffing**: No account lockout after failed attempts

### API Security
- **Rate Limit Bypass**: Direct service access bypasses gateway rate limits
- **No Authentication on Internal Services**: User service (`8002`) lacks JWT validation
- **SQL Injection**: User service endpoints may be vulnerable to SQL injection
- **XSS (Cross-Site Scripting)**: Input validation intentionally weak in some endpoints
- **Path Traversal**: File access endpoints may not validate paths

### Infrastructure
- **Exposed Services**: Backend services exposed on public ports (8000, 8002, 8080, etc.)
- **No mTLS**: Service-to-service communication not encrypted
- **Default Credentials**: Prometheus/Grafana using default credentials (admin/admin)
- **Exposed Metrics**: Metrics endpoints publicly accessible
- **No Network Segmentation**: All services on same Docker network

### Container Security
- **Outdated Base Images**: May use older Python/Alpine versions with known CVEs
- **Running as Root**: Some containers may run as root user
- **Secrets in Environment Variables**: JWT secrets passed via env vars
- **No Resource Limits**: Containers may not have CPU/memory limits

## Reporting Unintentional Security Issues

If you discover a security vulnerability that is **NOT** listed above and could impact users of this educational project, please report it responsibly.

### Scope

**In Scope**:
- Vulnerabilities in the CI/CD pipeline
- Vulnerabilities in the build/deployment process
- Security issues in documentation that could mislead users
- Vulnerabilities in monitoring/incident response that could leak real data
- Security issues in the frontend (GitHub Pages) that could affect visitors

**Out of Scope**:
- Any vulnerabilities listed in the "Intentional Vulnerabilities" section above
- Social engineering attacks
- Denial of service attacks against the infrastructure
- Third-party dependencies with known CVEs (we track these separately)

### Reporting Process

1. **Do NOT** open a public GitHub issue
2. **Do NOT** discuss the vulnerability publicly until it's fixed
3. **Email** the maintainers at: [your-email@example.com] with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

### Response Timeline

- **24 hours**: Initial acknowledgment of your report
- **7 days**: Assessment and triage
- **30 days**: Fix developed and tested
- **Public disclosure**: After fix is released (coordinated with reporter)

## Security Best Practices for Users

If you're using this lab for learning, follow these guidelines:

### Local Development

```bash
# 1. Run in isolated environment
docker-compose up -d

# 2. Don't expose to public internet
# Use localhost only, no port forwarding

# 3. Use strong passwords even in dev
# Edit .env and change default credentials

# 4. Regular cleanup
docker-compose down -v
docker system prune -f
```

### Production Deployment

**DO NOT DEPLOY THIS TO PRODUCTION**. If you must deploy for educational purposes:

1. **Network Isolation**:
   - Use VPN or firewall rules
   - Whitelist only authorized IPs
   - Use internal Docker networks

2. **Authentication**:
   - Change all default credentials
   - Generate strong JWT secrets (256-bit random)
   - Enable MFA for all users
   - Use HTTPS with valid certificates

3. **Monitoring**:
   - Enable all security monitoring
   - Configure alerting to security team
   - Log all access attempts
   - Regular security audits

4. **Updates**:
   - Keep Docker images updated
   - Monitor CVE databases
   - Apply security patches promptly

## Vulnerability Disclosure Examples

### Example 1: Unintentional Vulnerability (Report It)

```
Subject: Unintentional XSS in incident report viewer

Description:
The incident report viewer (/reports/{id}) in the incident-bot service
renders user-controlled data without sanitization, allowing reflected XSS.

This is NOT an intentional vulnerability for educational purposes, as the
incident-bot is part of the defensive infrastructure.

Steps to Reproduce:
1. Create incident with payload: <script>alert(1)</script>
2. View report at /reports/{id}
3. XSS executes

Impact: Could compromise incident response workflow

Suggested Fix: Sanitize all user input before rendering in templates
```

**Action**: This would be fixed as it affects the defensive tooling.

### Example 2: Intentional Vulnerability (Don't Report)

```
Subject: IDOR vulnerability in user profiles

Description:
User profiles are accessible without authorization check.
Any authenticated user can access /api/profile/{user_id} for any user_id.

Impact: Information disclosure
```

**Action**: This is intentional and listed in the "Intentional Vulnerabilities" section. No action needed.

## Security Scanning

This project uses automated security scanning in CI/CD:

- **GitLeaks**: Secret scanning
- **Trivy**: Container vulnerability scanning
- **Semgrep**: SAST (Static Application Security Testing)
- **Bandit**: Python security linting
- **OWASP Dependency-Check**: Dependency vulnerability scanning
- **Checkov**: IaC security scanning

### Security Gate Policy

Pull requests are subject to the following security gates:

| Severity | Policy |
|----------|--------|
| **CRITICAL** | ❌ Blocks merge |
| **HIGH** | ⚠️ Warning (>5 blocks merge) |
| **MEDIUM** | ℹ️ Info only |
| **LOW** | ℹ️ Info only |

### Exceptions

Security findings in the following paths are **expected** and won't block PRs:
- `attacks/*` - Attack scripts (intentionally use vulnerable patterns)
- `vulnerable-services/*` - Intentionally vulnerable services
- `tests/*` - Test code

## Security Contact

- **GitHub Issues**: For non-sensitive security questions and discussions
- **Private Reporting**: Use GitHub's private vulnerability reporting feature (Security tab → Report a vulnerability)

## Security Champions

This is an open-source educational project. Security reviews are welcome from the community.

## Credits

We thank the following security researchers for responsible disclosure:

- [List of contributors who reported security issues]

## Legal

This project is for **educational purposes only**. Users are responsible for:
- Complying with all applicable laws and regulations
- Obtaining proper authorization before testing
- Using the knowledge gained ethically and responsibly

Unauthorized use of the techniques demonstrated in this project may be illegal.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Responsible Disclosure Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html)
