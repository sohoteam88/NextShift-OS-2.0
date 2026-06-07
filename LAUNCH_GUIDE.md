# NextShift OS — Soft Launch Guide

## Pre-Launch
1. Run `bash scripts/pre-launch-checklist.sh` - all checks must pass
2. Ensure production `.env` is configured
3. Run database migration: `npx prisma migrate deploy`
4. Deploy via `git push origin main` (triggers CI/CD)
5. Verify health check: `curl https://app.nextshift.my/api/v1/health`

## Create First Tenant
1. Go to `https://app.nextshift.my/signup`
2. Create operator account
3. Complete onboarding
4. Generate invite links for beta testers

## Beta Tester Onboarding
1. Share invite link via WhatsApp
2. Beta tester registers and waits for approval
3. Operator approves
4. Beta tester completes onboarding

## Monitor
- UptimeRobot: check every 5 min
- Docker logs: `docker logs nextshift-app --tail 100 -f`
- Error tracking: check browser console for client errors
- AI costs: check `/analytics` in operator view

## Feedback Collection
- Create a WhatsApp group for beta testers
- Weekly check-in: what works, what doesn't, what's confusing
- Track bugs in GitHub Issues

## Emergency Rollback
```bash
ssh deploy@vps
cd /home/deploy/nextshift
docker compose -f docker-compose.prod.yml down
docker tag nextshift-app:previous nextshift-app:latest
docker compose -f docker-compose.prod.yml up -d
```
