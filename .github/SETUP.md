# CI/CD Security Pipeline - Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Update README.md Badge URLs

Open `README.md` and replace `YOUR_USERNAME` with your GitHub username:

**Line 7-8** - Find:
```markdown
![Security Scan](https://github.com/YOUR_USERNAME/DevSecOps-Hacking-Lab/actions/workflows/security-scan.yml/badge.svg)
![Attack Simulation](https://github.com/YOUR_USERNAME/DevSecOps-Hacking-Lab/actions/workflows/attack-simulation.yml/badge.svg)
```

**Replace with** (example if your username is `jankowalski`):
```markdown
![Security Scan](https://github.com/jankowalski/DevSecOps-Hacking-Lab/actions/workflows/security-scan.yml/badge.svg)
![Attack Simulation](https://github.com/jankowalski/DevSecOps-Hacking-Lab/actions/workflows/attack-simulation.yml/badge.svg)
```

**Line 20** - Find:
```markdown
*Security status automatically updated by CI/CD pipeline. View detailed results in [GitHub Actions](https://github.com/YOUR_USERNAME/DevSecOps-Hacking-Lab/actions).*
```

**Replace with**:
```markdown
*Security status automatically updated by CI/CD pipeline. View detailed results in [GitHub Actions](https://github.com/jankowalski/DevSecOps-Hacking-Lab/actions).*
```

### Step 2: Enable GitHub Actions (If Not Already Enabled)

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Actions** → **General**
4. Under "Actions permissions":
   - ✅ Select: **Allow all actions and reusable workflows**
5. Under "Workflow permissions":
   - ✅ Select: **Read and write permissions**
   - ✅ Check: **Allow GitHub Actions to create and approve pull requests**
6. Click **Save**

### Step 3: Commit and Push

```bash
git add .github/ README.md
git commit -m "feat(ci-cd): add comprehensive security scanning pipeline"
git push
```

### Step 4: Watch First Run

1. Go to GitHub → **Actions** tab
2. You should see "Security Scan Pipeline" running
3. Wait ~5-10 minutes for first run to complete
4. Check that badges appear in README

## What Happens Next?

### Automatic Scans

The pipeline will automatically run:

✅ **On every push** to `main` or `develop`
- Secret scanning (GitLeaks)
- Container security (Trivy)
- SAST (Semgrep & Bandit)
- Dependency check (OWASP)
- IaC security (Checkov)

✅ **On every pull request**
- All security scans
- Auto-comments with findings
- Blocks merge if CRITICAL vulnerabilities found

✅ **Daily at 2 AM UTC**
- Full security scan on main branch

✅ **Weekly on Monday 3 AM UTC**
- Attack simulation tests

### Dependabot Updates

Dependabot will automatically create PRs for:
- Python package updates (weekly)
- Docker base image updates (weekly)
- GitHub Actions updates (weekly)

## Verification

### Check Badges Work

Refresh your README.md page on GitHub. You should see:

✅ Green badges: Workflows passing
⚠️ Yellow badges: Workflows in progress
❌ Red badges: Workflows failing

### Check Security Scan Results

1. Go to **Actions** → "Security Scan Pipeline" → Latest run
2. Click on jobs to see details
3. Download artifacts for detailed reports

### Check PR Comments

1. Create a test branch and PR
2. Wait for workflow to complete
3. You should see automated comment with security findings

## Troubleshooting

### Badge shows "workflow not found"

**Fix**: Wait 1-2 minutes after first push. GitHub needs to discover the workflow.

### Workflow fails with "Resource not accessible"

**Fix**:
1. Settings → Actions → General
2. Workflow permissions → "Read and write permissions"
3. Re-run workflow

### README security status not updating

**Fix**: This only updates on `main` branch after security scan completes. Wait for workflow to finish.

### Container scan fails

**Fix**: Make sure Docker images exist. Run:
```bash
docker-compose build
```

## No External Tokens Needed! 🎉

This setup uses **ONLY** GitHub's built-in `GITHUB_TOKEN`:
- ✅ Zero configuration
- ✅ Zero secrets to manage
- ✅ 100% safe for public repos
- ✅ Works out of the box

## Next Steps

After setup is complete:

1. Review first security scan results
2. Fix any CRITICAL/HIGH vulnerabilities found
3. Set up branch protection rules (optional)
4. Customize security gate thresholds if needed

## Optional: Branch Protection

To enforce security gates on PRs:

1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. ✅ Require status checks to pass
4. Search and select:
   - "Security Gate"
   - "secret-scan"
   - "container-scan"
5. Save changes

Now PRs with security issues will be blocked from merging!

## Support

- **Documentation**: See `.github/workflows/README.md`
- **Security Policy**: See `.github/SECURITY.md`
- **Issues**: Open GitHub issue for questions
