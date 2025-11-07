# 🚀 Quick Start Guide

Get DevSecOps Hacking Lab up and running in 5 minutes!

## Prerequisites

Ensure you have installed:
- ✅ Docker 24.0+
- ✅ Docker Compose 2.0+
- ✅ Python 3.11+ (for attack scripts)
- ✅ Git

## Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/DevSecOps-Hacking-Lab.git
cd DevSecOps-Hacking-Lab
```

## Step 2: Start the Environment

```bash
# Build and start all services
docker-compose up -d

# Check services are running
docker-compose ps
```

Expected output:
```
NAME                COMMAND                  SERVICE             STATUS
login-api           "uvicorn app.main:ap…"   login-api           Up (healthy)
```

## Step 3: Verify Services

```bash
# Check health
curl http://localhost:8000/health

# Test login endpoint
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}'
```

## Step 4: Run Your First Attack

```bash
# Install attack script dependencies
cd attacks/brute-force
pip install -r requirements.txt

# Run brute-force attack
python brute_force.py \
  --target http://localhost:8000/login \
  --username admin
```

You should see:
- ⚔️ Attack progress in real-time
- 🎯 Successful password found (admin123)
- ⚠️ Rate limiting detection
- 📊 Detailed attack statistics

## Step 5: Explore the Results

Results are saved in `attacks/brute-force/results/` as JSON files.

View logs:
```bash
docker-compose logs login-api
```

## What's Next?

### Experiment with Defenses

Edit `docker-compose.yml` to adjust defense parameters:

```yaml
environment:
  - RATE_LIMIT_REQUESTS=3      # More aggressive rate limiting
  - RATE_LIMIT_WINDOW=60       # Time window in seconds
  - BAN_THRESHOLD=5            # Ban after 5 failed attempts
  - BAN_DURATION=1800          # 30-minute ban
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### Try Different Attack Scenarios

```bash
# Use custom wordlist
python brute_force.py \
  --target http://localhost:8000/login \
  --username admin \
  --wordlist wordlists/common-passwords.txt

# Slower attack to evade detection
python brute_force.py \
  --target http://localhost:8000/login \
  --username admin \
  --delay 1.0 \
  --max-concurrent 2
```

### Monitor API Statistics

```bash
# Check current defense status
curl http://localhost:8000/stats
```

### View Available Endpoints

Open in browser: http://localhost:8000/docs

## Troubleshooting

### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead
```

### Container Won't Start

```bash
# View logs
docker-compose logs login-api

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Permission Errors

On Linux, you may need to fix permissions:
```bash
sudo chown -R $USER:$USER attacks/brute-force/results/
```

## Clean Up

Stop and remove all containers:
```bash
docker-compose down

# Remove volumes as well
docker-compose down -v
```

## Security Reminder

⚠️ **Only test on localhost!** Never run attacks against systems you don't own.

Read [DISCLAIMER.md](./DISCLAIMER.md) for full ethical usage guidelines.

## Next Steps

- 📖 Read the full [README.md](./README.md)
- 🛡️ Study the defense mechanisms in `vulnerable-services/login-api/app/security.py`
- 📊 Analyze attack results in JSON format
- 🔧 Customize rate limiting and banning thresholds
- 🤝 Contribute new vulnerabilities or attacks

Happy Ethical Hacking! 🎯




