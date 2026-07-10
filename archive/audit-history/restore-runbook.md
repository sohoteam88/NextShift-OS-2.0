# E1A Restore Runbook

Date: 2026-06-19
Status: READY FOR E2
Blocker: E1A-001 Backup & Restore Strategy

## Objective

Provide a step-by-step restore procedure that another engineer can execute safely.

## Preconditions

Required access:

- Supabase project admin access or approved database restore credentials.
- Production deployment access.
- GitHub repository access.
- Current production image tag or commit SHA.
- Encrypted backup artifact access.

Required data:

- Backup ID.
- Backup timestamp.
- Backup checksum.
- Target restore environment.
- Restore approval.

Do not paste secrets into tickets, chat, terminal transcripts, or audit reports.

## Restore Types

| Restore Type | Use Case |
| --- | --- |
| Point-in-time managed restore | Supabase-managed rollback or incident recovery |
| Logical export restore | Restore from `.dump` artifact into clean database |
| Config restore | Reapply known-good Nginx/Compose/env contract |
| Application rollback | Redeploy previous known-good image/tag |

## Logical Database Restore Procedure

1. Declare incident or maintenance window.
2. Stop write traffic if restoring production data.
3. Confirm selected backup checksum.
4. Create a clean restore database or staging restore target.
5. Restore the dump:

```bash
pg_restore \
  --dbname "$RESTORE_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  "nextshift-YYYYMMDDHHMMSS.dump"
```

6. Run Prisma validation against restored schema:

```bash
pnpm exec prisma validate
```

7. Run migration status check against target:

```bash
pnpm exec prisma migrate status
```

8. Run smoke checks:

```bash
curl -fsS https://nextshiftos.com/api/v1/health
```

9. Verify tenant isolation with a known non-production restore drill dataset or approved production checklist.
10. Verify critical tables:

- tenants
- users
- audit_logs
- leads
- funnels
- content
- brand_profiles

11. Re-enable application traffic.
12. Record restore evidence.

## Verification Checklist

Required:

- Health endpoint returns `ok` or expected degraded state.
- Database responds to `SELECT 1`.
- App can load login.
- Authenticated dashboard loads.
- Tenant-scoped data remains tenant-scoped.
- `audit_logs` records from before restore are present.
- No secrets were written to logs.

## Rollback

If restore fails:

1. Keep failed restore target isolated for investigation.
2. Do not overwrite the source backup artifact.
3. Revert app traffic to previous healthy database or maintenance mode.
4. Restore previous known-good image if application and schema mismatch is suspected.
5. Escalate to Platform owner.

## Restore Drill Schedule

- Quarterly restore drill to staging or isolated restore target.
- After any migration authority change.
- After any incident involving database integrity.

## Evidence Record

Each restore drill must record:

- `restoreDrillId`
- backup ID
- restore target
- operator
- start/end time
- checksum result
- health check result
- migration status result
- tenant isolation result
- final decision

## Final Decision

READY FOR E2
