# E1A Backup Strategy

Date: 2026-06-19
Status: READY FOR E2
Blocker: E1A-001 Backup & Restore Strategy

## Objective

Define a production backup strategy that covers:

- Supabase managed backup.
- Database export.
- Config backup.
- Backup frequency.
- Retention.
- Restore evidence requirements.

This document does not contain secrets or live database URLs.

## Backup Scope

| Asset | Backup Method | Frequency | Retention | Owner |
| --- | --- | --- | --- | --- |
| Supabase Postgres database | Supabase managed backup plus explicit logical export | Managed daily, logical export weekly | 30 days daily, 12 weekly, 12 monthly | Platform |
| Prisma schema and migrations | Git repository | Every commit | Git history | Engineering |
| Supabase migrations | Git repository, frozen after ADR-024 unless platform-only | Every commit | Git history | Engineering |
| Production env contract | `.env.production.example` plus secret-manager inventory | Every release | Current + previous 3 releases | Platform |
| Nginx config | Git-tracked `deploy/nginx/` plus VPS copy | Every infra change | Current + previous 3 releases | Platform |
| Docker/Compose config | Git repository | Every commit | Git history | Engineering |
| Redis ephemeral/cache data | Not authoritative | No backup required | N/A | Platform |

## Database Backup Policy

Primary backup source:

- Supabase managed database backups.

Secondary verification backup:

- Weekly logical export using `pg_dump` or Supabase CLI from a trusted operator machine.
- Export must be encrypted at rest.
- Export must never be committed to Git.

Recommended export command shape:

```bash
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file "nextshift-$(date +%Y%m%d%H%M%S).dump"
```

Required controls:

- Use production read/backup credentials, not app runtime credentials where possible.
- Store backup in restricted storage.
- Record backup timestamp, size, checksum, and operator.
- Never print the database URL or password in logs.

## Config Backup Policy

Config backup must include:

- Nginx site config.
- Docker Compose production file.
- Production image tag or commit SHA.
- Environment variable key inventory, not secret values.
- Certbot renewal timer status evidence.

Config backup must not include:

- API keys.
- Service-role keys.
- Database credentials.
- Cookie/session secrets.

## Retention

| Backup Type | Retention |
| --- | --- |
| Daily managed DB backup | 30 days |
| Weekly logical DB export | 12 weeks |
| Monthly logical DB export | 12 months |
| Config snapshots | Current + previous 3 releases |
| Restore drill reports | 12 months |

## Verification

Every backup cycle must produce:

- `backupId`
- `startedAt`
- `completedAt`
- `database`
- `method`
- `sizeBytes`
- `checksum`
- `operator`
- `storageLocationLabel`
- `restoreTested` boolean

Do not store credentials or private URLs in verification records.

## Success Criteria

- Backup source exists.
- Backup frequency is defined.
- Backup retention is defined.
- Restore runbook exists.
- Another engineer can execute backup and restore without hidden tribal knowledge.

## Final Decision

READY FOR E2
