# Deployment Engineer Examples

## Example 1: Initial Production Setup

**Input:** "I have a fresh Hetzner VPS (4 vCPU, 8GB RAM, Ubuntu 24) and the NextShift codebase. Help me deploy to production at app.nextshift.my."

**Expected output:** Step-by-step: VPS hardening script (firewall, deploy user, SSH key-only), Dockerfile, docker-compose.prod.yml, Nginx config with SSL, Certbot wildcard command, health check verification, first deploy commands.

## Example 2: CI/CD Pipeline

**Input:** "Set up GitHub Actions so pushing to main auto-deploys to production."

**Expected output:** Complete `.github/workflows/deploy.yml` with test → build → push → SSH deploy jobs, using repository secrets for VPS_HOST, VPS_SSH_KEY. Includes rollback note.

## Example 3: Production 502 Error

**Input:** "Users are getting 502 Bad Gateway intermittently."

**Expected output:** Troubleshooting checklist: check `docker logs`, check `docker stats` for OOM, check Nginx upstream timeout, check health endpoint, check disk space. Most likely cause + fix.

## When NOT to Use This Skill

- User needs **application code architecture** → use `core/nextshift-os-architect`
- User needs **security review** → use `core/security-auditor`
- User needs **database schema** → use `data/crm-database`
