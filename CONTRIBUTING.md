# Contributing to DevSecOps Hacking Lab

First off, thank you for considering contributing to DevSecOps Hacking Lab! 🎉

## Code of Conduct

This project aims to be an educational resource for security professionals. All contributors must:

- Use ethical practices
- Respect the educational nature of the project
- Never contribute malicious code
- Follow responsible disclosure practices
- Be respectful and professional

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please create an issue with:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Environment details** (OS, Docker version, etc.)

### Suggesting Enhancements

We welcome suggestions! Please create an issue with:

- **Clear description** of the enhancement
- **Use case** - why is this useful?
- **Proposed implementation** (if you have ideas)

### Adding New Vulnerabilities/Attacks

When adding new attack scenarios:

1. Create a new directory under `vulnerable-services/` or `attacks/`
2. Include comprehensive documentation
3. Add defense mechanisms
4. Update main README.md
5. Ensure all code is well-commented
6. Add safety checks to prevent misuse

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Make your changes**
4. **Test thoroughly** - ensure Docker builds and services run
5. **Update documentation** - README, inline comments, etc.
6. **Commit with clear messages** - follow conventional commits
7. **Push to your fork** (`git push origin feature/AmazingFeature`)
8. **Open a Pull Request**

### Commit Message Guidelines

Use conventional commits:

```
feat: add SQL injection vulnerability to user-api
fix: correct rate limiting logic in login-api
docs: update README with new attack scenarios
test: add integration tests for brute-force attack
chore: update dependencies
```

### Code Style

- **Python**: Follow PEP 8
- **Use type hints** where appropriate
- **Write docstrings** for all functions/classes
- **Add comments** for complex logic
- **Keep functions focused** and small

### Testing

Before submitting:

```bash
# Test Docker build
docker-compose build

# Start services
docker-compose up -d

# Run health checks
curl http://localhost:8000/health

# Test attacks work
cd attacks/brute-force
python brute_force.py --target http://localhost:8000/login --username admin

# Clean up
docker-compose down
```

### Documentation

- Update README.md if adding new features
- Add inline code comments
- Create module-specific READMEs
- Include usage examples
- Document configuration options

## Project Structure

```
DevSecOps-Hacking-Lab/
├── vulnerable-services/    # Add new vulnerable microservices here
│   └── login-api/
├── attacks/               # Add new attack scripts here
│   └── brute-force/
├── defenses/             # Add defense mechanisms here
│   └── rate-limiter/
├── monitoring/           # Add monitoring configs here
├── infrastructure/       # Add IaC configs here
│   └── docker/
└── .github/              # CI/CD workflows
    └── workflows/
```

## Ideas for Contributions

### New Vulnerabilities

- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- SSRF (Server-Side Request Forgery)
- Path Traversal
- Command Injection
- XXE (XML External Entity)
- Insecure Deserialization

### New Defenses

- WAF (Web Application Firewall)
- Input validation
- Output encoding
- CSRF tokens
- Security headers
- Content Security Policy

### Infrastructure

- Kubernetes manifests
- Terraform AWS deployment
- Helm charts
- Ansible playbooks

### Monitoring

- Prometheus metrics
- Grafana dashboards
- ELK Stack integration
- Alert rules

### Testing

- Unit tests
- Integration tests
- Security tests
- Load tests

## Questions?

Feel free to open an issue with the `question` label!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make security education better! 🛡️




