# Production database backup runbook

The VPS uses its already-loaded `nextshift-migrations:<release-sha>` image for
`pg_dump`; it installs nothing and reads credentials only from `.env.production`.
The script prefers `DIRECT_URL` (Supabase direct port 5432) and rejects a 6543
PgBouncer URL, because `pg_dump` must not use the transaction pooler.

## VPS installation

1. Copy the reviewed script to `/home/deploy/nextshift/scripts/ops/` and make it executable.
2. Confirm the deployed migration image exists: `docker image ls 'nextshift-migrations:*'`.
3. Run `crontab -e` and add (replace the SHA after each deployment):

```cron
0 19 * * * /home/deploy/nextshift/scripts/ops/backup-production-db.sh nextshift-migrations:<deployed-release-sha>
```

19:00 UTC is 03:00 Malaysia time (UTC+8).

## Verify and restore rehearsal

Check: `tail -n 20 /home/deploy/backups/backup.log` and `ls -lt /home/deploy/backups/nextshift-*.dump | head`.

Custom exits: `64` means neither `DIRECT_URL` nor `DATABASE_URL` was present;
`65` means the selected URL targeted the PgBouncer transaction-pooler port
`6543` and was rejected.

Restore only into an isolated, non-production database. Create a disposable PostgreSQL database, copy one dump there, then run:

```bash
pg_restore --clean --if-exists --no-owner --dbname "$ISOLATED_DATABASE_URL" /path/to/nextshift-YYYYMMDD-HHMMSS.dump
```

Never point `ISOLATED_DATABASE_URL` at production.

## VPS single-point risk

VPS backups fail with the VPS. Weekly, download one current dump to local storage:

```bash
scp deploy@<vps-host>:/home/deploy/backups/nextshift-YYYYMMDD-HHMMSS.dump ./
```
