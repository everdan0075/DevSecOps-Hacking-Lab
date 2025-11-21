# CI/CD Security Pipeline Documentation

## Overview

Automated security testing pipeline that runs on every push, pull request, and scheduled intervals. The pipeline implements a multi-layered security approach with automated scanning, attack simulation, and security gates.

## Workflows

### 1. security-scan.yml - Main Security Pipeline

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Daily schedule (2 AM UTC)
- Manual dispatch

**Jobs**:

#### Secret Scanning (GitLeaks)
- Scans full git history for leaked secrets
- Detects API keys, passwords, tokens
- Outputs: SARIF format

#### Container Security (Trivy)
- Scans all Docker images:
  - login-api
  - api-gateway
  - user-service
  - incident-bot
- Detects CVEs in base images and dependencies
- Severity: CRITICAL, HIGH, MEDIUM
- **Auto-comments PRs** with critical findings

#### SAST (Static Application Security Testing)
- **Semgrep**: Multi-language security patterns
  - Python security issues
  - Docker misconfigurations
  - OWASP Top 10 patterns
- **Bandit**: Python-specific security linting
  - SQL injection patterns
  - Hardcoded passwords
  - Weak cryptography

#### Dependency Scanning (OWASP Dependency-Check)
- Scans Python dependencies for known CVEs
- Checks against NVD (National Vulnerability Database)
- Generates detailed CVE reports

#### IaC Security (Checkov)
- Scans Dockerfiles
- Scans docker-compose.yml
- Detects infrastructure misconfigurations

#### License Compliance
- Scans Python packages for licenses
- Generates license inventory
- Flags GPL/copyleft dependencies

#### Security Gate (Aggregate Results)
- **Aggregates** all scan results
- **Enforces** security policy:
  - CRITICAL vulnerabilities: ❌ **BLOCKS** merge
  - HIGH >5: ⚠️ **WARNING** (blocks merge)
  - Others: ℹ️ Info only
- **Comments PRs** with summary
- **Creates** GitHub step summary

**Example Output**:

```
🔒 Security Scan Summary

Results:
  🔴 CRITICAL: 0
  🟠 HIGH: 3

Status: ✅ Security Gate: PASSED

Scans Performed:
  - ✅ Secret Scanning (GitLeaks)
  - ✅ Container Security (Trivy)
  - ✅ SAST (Semgrep & Bandit)
  - ✅ Dependency Check (OWASP)
  - ✅ IaC Security (Checkov)
  - ✅ License Compliance
```

### 2. attack-simulation.yml - Attack Testing

**Triggers**:
- Push to `main` or `develop`
- Pull requests
- Weekly schedule (Monday 3 AM UTC)
- Manual dispatch

**Jobs**:

#### Setup Infrastructure
- Starts Docker Compose
- Health checks all services
- Exports logs on failure

#### Smoke Tests
- Runs `pytest tests/smoke/`
- Validates basic security controls
- Fast validation (~1-2 minutes)

#### IDOR Attack Test
- Runs intelligent IDOR exploitation
- Validates vulnerability exists (educational lab)
- Checks smart enumeration works
- **Expected**: Successful exploitation

#### JWT Attack Test
- Algorithm confusion testing
- None algorithm bypass
- Claims tampering
- Secret brute force
- **Expected**: Some attacks succeed

#### Rate Limit Test
- Distributed attack simulation
- Direct service bypass
- **Expected**: Some bypasses work

#### Incident Response Test
- Validates incident bot health
- Checks runbooks loaded
- Ensures automated response works

#### Attack Summary
- Aggregates all attack results
- **Comments PRs** if critical security controls broken
- Distinguishes intentional vs unintentional failures

**Example Output**:

```
🎯 Attack Simulation Summary

Tests Performed:
  | Attack Type         | Status     | Notes                      |
  |--------------------|------------|----------------------------|
  | Smoke Tests         | ✅ Passed  | Basic validation           |
  | IDOR Exploitation   | ✅ Passed  | Vulnerability confirmed    |
  | JWT Manipulation    | ✅ Passed  | Multiple techniques work   |
  | Rate Limit Bypass   | ✅ Passed  | Bypass confirmed           |
  | Incident Response   | ✅ Passed  | Automation functional      |

Purpose:
  These tests validate that:
  1. Intentional vulnerabilities still exist (educational lab)
  2. Security controls are working (rate limits, MFA)
  3. Incident response system functions correctly
  4. Monitoring captures all attack attempts
```

### 3. README Security Status Update

**Triggers**:
- After `security-scan.yml` completes (on main branch only)

**Updates**:
- Automatically updates security status section in README.md
- Shows: Last scan date, vulnerability counts, overall status
- Uses only `GITHUB_TOKEN` (built-in, no external tokens needed)

**GitHub Actions Badges**:

Built-in workflow status badges (no configuration needed):

```markdown
![Security Scan](https://github.com/<owner>/<repo>/actions/workflows/security-scan.yml/badge.svg)
![Attack Simulation](https://github.com/<owner>/<repo>/actions/workflows/attack-simulation.yml/badge.svg)
```

## Security Policy

### Security Gate Rules

| Severity   | Threshold | Action         |
|-----------|-----------|----------------|
| CRITICAL  | >0        | ❌ Block merge |
| HIGH      | >5        | ⚠️ Block merge |
| MEDIUM    | Any       | ℹ️ Info only   |
| LOW       | Any       | ℹ️ Info only   |

### Exceptions

The following paths are **excluded** from blocking:
- `attacks/*` - Attack scripts (intentionally vulnerable)
- `vulnerable-services/*` - Educational vulnerable services
- `tests/*` - Test code

### Override Process

To override security gate (emergency only):

1. Add label: `security-override`
2. Get approval from 2 security team members
3. Create follow-up issue to fix vulnerability
4. Merge with caution

## GitHub Actions Badges (Zero Configuration)

The workflows automatically provide status badges:

```markdown
<!-- Add these to your README.md -->
![Security Scan](https://github.com/YOUR_USERNAME/DevSecOps-Hacking-Lab/actions/workflows/security-scan.yml/badge.svg)
![Attack Simulation](https://github.com/YOUR_USERNAME/DevSecOps-Hacking-Lab/actions/workflows/attack-simulation.yml/badge.svg)
```

**Benefits**:
- ✅ Zero external tokens needed
- ✅ Auto-updates with workflow status
- ✅ Shows: passing ✓, failing ✗, in progress ●
- ✅ 100% safe for public repositories

**Security Status Section**:

Add this to your README.md for auto-updating vulnerability counts:

```markdown
## Security Status

![Security Scan](https://github.com/YOUR_USERNAME/DevSecOps-Hacking-Lab/actions/workflows/security-scan.yml/badge.svg)
![Attack Simulation](https://github.com/YOUR_USERNAME/DevSecOps-Hacking-Lab/actions/workflows/attack-simulation.yml/badge.svg)

<!-- SECURITY-STATUS-START -->
**Last Scan**: 2025-01-20
**Vulnerabilities**: 0 CRITICAL, 3 HIGH
**Status**: PASSING
<!-- SECURITY-STATUS-END -->

*Security status automatically updated by CI/CD pipeline.*
```

The section between `<!-- SECURITY-STATUS-START -->` and `<!-- SECURITY-STATUS-END -->` will be automatically updated after each security scan on the main branch.

## Dependabot Configuration

Automated dependency updates configured in `.github/dependabot.yml`:

### Update Schedule

- **Python dependencies**: Weekly (Monday 2 AM)
- **Docker base images**: Weekly
- **GitHub Actions**: Weekly
- **NPM dependencies**: Weekly
- **Attack scripts**: Monthly (lower priority)

### Pull Request Limits

- Services: 5 PRs per dependency
- Attacks: 3 PRs per dependency
- GitHub Actions: 5 PRs

### Auto-labeling

- `dependencies` - All dependency updates
- `python` - Python packages
- `docker` - Docker images
- `github-actions` - Action versions
- `npm` - Frontend dependencies

## Artifacts

All workflows save artifacts for 30 days:

### Security Scan Artifacts
- `gitleaks-results` - Secret scan SARIF
- `trivy-*-results` - Container scan SARIF (per image)
- `semgrep-results` - SAST SARIF
- `bandit-results` - Python SAST SARIF
- `dependency-check-results` - CVE reports
- `checkov-results` - IaC scan SARIF
- `license-scan-results` - License inventory

### Attack Simulation Artifacts
- `smoke-test-results` - Pytest XML
- `idor-attack-results` - IDOR exploitation JSON
- `jwt-attack-results` - JWT attack JSON
- `rate-limit-test-results` - Rate limit bypass JSON
- `infrastructure-logs` - Docker logs (on failure)

### Security Badge Artifacts
- `security-summary-report` - Markdown summary (90 days)

## Manual Workflow Dispatch

All workflows support manual triggering:

```bash
# Trigger security scan
gh workflow run security-scan.yml

# Trigger attack simulation
gh workflow run attack-simulation.yml

# Regenerate badges
gh workflow run security-badge.yml
```

## Integration with GitHub Security

All SARIF files are automatically uploaded to GitHub Security tab:

1. Navigate to **Security** → **Code scanning**
2. View all findings by severity
3. Filter by tool (Trivy, Semgrep, Checkov, etc.)
4. Track remediation over time

## Notifications

Configure workflow notifications in GitHub settings:

- **Email**: On failure
- **Slack**: Via GitHub App
- **Discord**: Via webhook
- **PagerDuty**: For CRITICAL findings

## Troubleshooting

### Security scan fails with "No artifacts found"

**Cause**: SARIF files not generated
**Fix**: Check individual job logs for scan failures

### Attack simulation times out

**Cause**: Services not starting
**Fix**: Check Docker Compose health checks, increase sleep time

### Badges not showing

**Cause**: Incorrect repository path in badge URL
**Fix**:
1. Replace `YOUR_USERNAME` with your GitHub username
2. Replace `DevSecOps-Hacking-Lab` with your repo name if different
3. Badge URL format: `https://github.com/<owner>/<repo>/actions/workflows/<workflow>.yml/badge.svg`

### Security gate blocks legitimate PR

**Cause**: False positive from scanner
**Fix**:
1. Review finding in artifact
2. If false positive, add to ignore list in workflow
3. Or add `security-override` label (with approval)

## Best Practices

1. **Review all security findings** before merging
2. **Fix CRITICAL immediately** (within 24h)
3. **Track HIGH in issues** if not fixed in PR
4. **Update dependencies weekly** (Dependabot PRs)
5. **Run attack simulation** after major changes
6. **Monitor badge status** on main branch
7. **Review artifacts** for detailed findings
8. **Keep workflows updated** (Dependabot handles this)

## Metrics

Track security posture over time:

- **Mean Time to Remediate (MTTR)**: CRITICAL findings
- **Vulnerability Trend**: Critical/High over time
- **Attack Success Rate**: % of attacks that succeed
- **Coverage**: % of code scanned
- **False Positive Rate**: Scanner accuracy

## Future Enhancements

- [ ] DAST (Dynamic Application Security Testing)
- [ ] Fuzzing with AFL/LibFuzzer
- [ ] Threat modeling automation
- [ ] SCA (Software Composition Analysis)
- [ ] Container runtime security (Falco)
- [ ] Network policy validation
- [ ] Secrets rotation automation
- [ ] Security Champions program metrics
