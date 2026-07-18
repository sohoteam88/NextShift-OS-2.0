import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const repoRoot = resolve(import.meta.dirname, '../../..');
const migration = resolve(repoRoot, 'supabase/migrations/20260717135456_u3b_three_space_audit.sql');
const actorTenantId = '10000000-0000-4000-8000-000000000001';
const actorId = '10000000-0000-4000-8000-000000000002';

let clusterRoot: string | null = null;
let clusterPort: number | null = null;
let admin: PrismaClient;
let db: PrismaClient;
let databaseUrl: string;
let databaseName: string;
let legacySnapshot: Record<string, unknown>;

async function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('No TCP test port'));
      server.close(() => resolvePort(address.port));
    });
  });
}

function basePostgresUrl(): string {
  if (process.env.CI) return 'postgresql://ci:ci@127.0.0.1:5432/postgres';
  const user = encodeURIComponent(process.env.USER || 'postgres');
  return `postgresql://${user}@127.0.0.1:${clusterPort}/postgres`;
}

async function provisionPreU3BDatabase(): Promise<void> {
  await db.$executeRawUnsafe(`CREATE TABLE "tenants" (
    "id" uuid PRIMARY KEY, "name" text NOT NULL, "slug" text NOT NULL UNIQUE,
    "plan" text NOT NULL DEFAULT 'starter', "max_ai_calls" integer NOT NULL DEFAULT 200,
    "max_members" integer NOT NULL DEFAULT 10, "settings" jsonb NOT NULL DEFAULT '{}',
    "status" text NOT NULL DEFAULT 'active', "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
  )`);
  await db.$executeRawUnsafe(`CREATE TABLE "users" (
    "id" uuid PRIMARY KEY, "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "email" text NOT NULL, "name" text NOT NULL, "role" text NOT NULL DEFAULT 'member',
    "language_preference" text NOT NULL DEFAULT 'en', "status" text NOT NULL DEFAULT 'active',
    "onboarding_completed" boolean NOT NULL DEFAULT true, "metadata" jsonb NOT NULL DEFAULT '{}',
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
  )`);
  await db.$executeRawUnsafe(`CREATE TABLE "audit_logs" (
    "id" text PRIMARY KEY, "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL, "action" text NOT NULL,
    "target_type" text, "target_id" uuid, "metadata" jsonb NOT NULL DEFAULT '{}',
    "created_at" timestamptz NOT NULL DEFAULT now()
  )`);
  await db.$executeRawUnsafe(`INSERT INTO "tenants" ("id","name","slug") VALUES
    ('${actorTenantId}','Platform Operators','platform-operators')`);
  await db.$executeRawUnsafe(`INSERT INTO "users" ("id","tenant_id","email","name","role") VALUES
    ('${actorId}','${actorTenantId}','platform@example.test','Platform Admin','platform_admin')`);
  await db.$executeRawUnsafe(`INSERT INTO "audit_logs" ("id","tenant_id","actor_id","action","metadata") VALUES
    ('legacy-audit','${actorTenantId}','${actorId}','legacy.action','{"legacy":true}')`);
}

async function createTenant(id: string, slug: string): Promise<void> {
  await db.$executeRawUnsafe(`INSERT INTO "tenants" ("id","name","slug") VALUES ($1::uuid,$2,$3)`, id, slug, slug);
}

describe.sequential('U3B PostgreSQL authority', () => {
  beforeAll(async () => {
    if (!process.env.CI) {
      clusterRoot = mkdtempSync(resolve(tmpdir(), 'nextshift-u3b-pg-'));
      clusterPort = await freePort();
      const data = resolve(clusterRoot, 'data');
      const socket = resolve(clusterRoot, 'socket');
      execFileSync('mkdir', ['-p', socket]);
      execFileSync('initdb', ['-D', data, '--auth=trust', '--no-locale', '--encoding=UTF8'], { stdio: 'ignore' });
      execFileSync('pg_ctl', ['-D', data, '-o', `-F -p ${clusterPort} -k ${socket}`, '-w', 'start'], { stdio: 'ignore' });
    }

    const baseUrl = basePostgresUrl();
    admin = new PrismaClient({ datasourceUrl: baseUrl });
    databaseName = `u3b_${process.pid}_${Date.now()}`;
    await admin.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    databaseUrl = baseUrl.replace(/\/postgres$/, `/${databaseName}`);
    db = new PrismaClient({ datasourceUrl: databaseUrl });
    await provisionPreU3BDatabase();
    execFileSync('pnpm', ['exec', 'prisma', 'db', 'execute', '--file', migration, '--url', databaseUrl], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const rows = await db.$queryRaw<Array<Record<string, unknown>>>`
      SELECT "id", "tenant_id", "scope"::text AS "scope", "idempotency_key", "payload_digest", "metadata"
      FROM "audit_logs" WHERE "id" = 'legacy-audit'
    `;
    legacySnapshot = rows[0];
  }, 120_000);

  beforeEach(async () => {
    await db.$executeRawUnsafe('TRUNCATE TABLE "audit_event_outbox", "audit_logs" CASCADE');
    await db.$executeRawUnsafe(`DELETE FROM "tenants" WHERE "id" <> '${actorTenantId}'::uuid`);
  });

  afterAll(async () => {
    await db?.$disconnect();
    if (admin && databaseName) {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
      await admin.$disconnect();
    }
    if (clusterRoot) {
      execFileSync('pg_ctl', ['-D', resolve(clusterRoot, 'data'), '-m', 'fast', '-w', 'stop'], { stdio: 'ignore' });
      rmSync(clusterRoot, { recursive: true, force: true });
    }
  });

  it('migrates legacy AuditLog deterministically without inventing identity', () => {
    expect(legacySnapshot).toMatchObject({
      id: 'legacy-audit',
      tenant_id: actorTenantId,
      scope: 'TENANT',
      idempotency_key: null,
      payload_digest: null,
      metadata: { legacy: true },
    });
  });

  it('installs database checks and partial indexes in the PostgreSQL catalog', async () => {
    const constraints = await db.$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint
      WHERE conname IN ('audit_logs_scope_tenant_check','audit_logs_idempotency_digest_check',
        'audit_event_outbox_identity_unique','audit_event_outbox_status_check',
        'audit_event_outbox_terminal_check')
    `;
    expect(constraints.map((row) => row.conname).sort()).toHaveLength(5);
    const indexes = await db.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
      SELECT indexname,indexdef FROM pg_indexes
      WHERE indexname IN ('audit_logs_idempotency_key_unique','audit_logs_tenant_chronology_idx',
        'audit_logs_platform_chronology_idx','audit_event_outbox_claim_idx')
    `;
    expect(indexes).toHaveLength(4);
    expect(indexes.find((row) => row.indexname === 'audit_logs_idempotency_key_unique')?.indexdef)
      .toContain('WHERE (idempotency_key IS NOT NULL)');
  });

  it('rejects inconsistent TENANT/PLATFORM and digest rows below the application', async () => {
    await expect(db.$executeRawUnsafe(`INSERT INTO audit_logs
      (id,tenant_id,scope,action,metadata,created_at) VALUES
      ('bad-platform','${actorTenantId}','PLATFORM','bad','{}',now())`)).rejects.toThrow();
    await expect(db.$executeRawUnsafe(`INSERT INTO audit_logs
      (id,tenant_id,scope,action,metadata,idempotency_key,payload_digest,created_at) VALUES
      ('bad-digest','${actorTenantId}','TENANT','bad','{}','bad','bad',now())`)).rejects.toThrow();
  });

  it('collapses concurrent direct writes with the same digest to one stable row', async () => {
    const { writePlatformAuditUsing } = await import('@/modules/admin/services/platform-audit-service');
    const input = { actorId, actorRole: 'platform_admin' as const, action: 'tenant.inspect', targetType: 'tenant', targetKey: 'global', outcome: 'success' as const, correlationId: 'same-correlation', idempotencyIdentity: 'same-attempt', metadata: { value: 1 } };
    const results = await Promise.all(Array.from({ length: 12 }, () => writePlatformAuditUsing(db, input)));
    expect(new Set(results.map((row) => row.id))).toHaveLength(1);
    expect(await db.auditLog.count()).toBe(1);
  });

  it('preserves the original row and emits durable dead-letter evidence on digest conflict', async () => {
    const { writePlatformAuditUsing } = await import('@/modules/admin/services/platform-audit-service');
    const common = { actorId, actorRole: 'platform_admin' as const, action: 'tenant.inspect', targetType: 'tenant', targetKey: 'global', outcome: 'success' as const, correlationId: 'conflict-correlation', idempotencyIdentity: 'conflict-attempt' };
    const original = await writePlatformAuditUsing(db, { ...common, metadata: { value: 1 } });
    await expect(writePlatformAuditUsing(db, { ...common, metadata: { value: 2 } }))
      .rejects.toMatchObject({ code: 'AUDIT_IDEMPOTENCY_CONFLICT' });
    expect((await db.auditLog.findMany())[0].id).toBe(original.id);
    expect(await db.auditEventOutbox.findFirst()).toMatchObject({
      status: 'dead_letter',
      failureCode: 'AUDIT_IDEMPOTENCY_CONFLICT',
    });
  });

  it('makes replay/replay and direct/replay races idempotent', async () => {
    const { buildPlatformAuditEvent, writePlatformAuditUsing } = await import('@/modules/admin/services/platform-audit-service');
    const { runAuditOutboxBatch } = await import('@/modules/admin/workers/audit-outbox-worker');
    const input = { actorId, actorRole: 'platform_admin' as const, action: 'tenant.inspect', targetType: 'tenant', targetKey: 'race', outcome: 'success' as const, correlationId: 'race-correlation', idempotencyIdentity: 'race-attempt', metadata: { value: 1 } };
    const event = buildPlatformAuditEvent(input);
    await db.$executeRaw(Prisma.sql`INSERT INTO "audit_event_outbox"
      ("id","idempotency_key","payload_digest","payload","correlation_id","retention_until") VALUES
      (${crypto.randomUUID()},${event.idempotencyKey},${event.payloadDigest},CAST(${JSON.stringify(event.payload)} AS jsonb),${event.correlationId},now()+interval '24 months')`);
    await Promise.all([runAuditOutboxBatch({ db }), runAuditOutboxBatch({ db }), writePlatformAuditUsing(db, input)]);
    expect(await db.auditLog.count()).toBe(1);
    expect(await db.auditEventOutbox.findFirst()).toMatchObject({ status: 'delivered', attemptCount: 1 });
  });

  it('recovers stale claims and applies bounded retry without purging pending evidence', async () => {
    const { buildPlatformAuditEvent } = await import('@/modules/admin/services/platform-audit-service');
    const { claimNextAuditEvent, deliverClaimedAuditEvent, purgeExpiredAuditOutbox } = await import('@/modules/admin/workers/audit-outbox-worker');
    const event = buildPlatformAuditEvent({ actorId: '20000000-0000-4000-8000-000000000099', actorRole: 'platform_admin', action: 'invalid.actor', targetType: 'tenant', targetKey: 'retry', outcome: 'failure', correlationId: 'retry-correlation', idempotencyIdentity: 'retry-attempt' });
    await db.$executeRaw(Prisma.sql`INSERT INTO "audit_event_outbox"
      ("id","idempotency_key","payload_digest","payload","correlation_id","status","claim_token","claimed_at","retention_until") VALUES
      (${crypto.randomUUID()},${event.idempotencyKey},${event.payloadDigest},CAST(${JSON.stringify(event.payload)} AS jsonb),${event.correlationId},'processing','crashed',now()-interval '10 minutes',now()-interval '1 day')`);
    const claimed = await claimNextAuditEvent(db);
    expect(claimed?.claimToken).not.toBe('crashed');
    expect(await deliverClaimedAuditEvent(claimed!, db)).toBe('retry');
    expect(await db.auditEventOutbox.findFirst()).toMatchObject({ status: 'pending', attemptCount: 1 });
    expect(await purgeExpiredAuditOutbox(db)).toBe(0);
  });

  it('commits logical tenant deletion and platform audit atomically with retry/no-op semantics', async () => {
    const { deleteTenantWithAudit } = await import('@/modules/admin/services/tenant-deletion-service');
    const tenantId = '30000000-0000-4000-8000-000000000001';
    await createTenant(tenantId, 'atomic-delete');
    const first = await deleteTenantWithAudit({ tenantId, actorId, idempotencyKey: 'delete-attempt-0001' }, db);
    const replay = await deleteTenantWithAudit({ tenantId, actorId, idempotencyKey: 'delete-attempt-0001' }, db);
    const independent = await deleteTenantWithAudit({ tenantId, actorId, idempotencyKey: 'delete-attempt-0002' }, db);
    expect(first).toMatchObject({ alreadyDeleted: false, replayed: false });
    expect(replay).toMatchObject({ alreadyDeleted: false, replayed: true });
    expect(independent).toMatchObject({ alreadyDeleted: true, replayed: false });
    expect(await db.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({ status: 'deleted' });
    expect(await db.auditLog.count({ where: { scope: 'PLATFORM' } })).toBe(2);
  });

  it('serializes concurrent independent DELETE requests into one transition and terminal no-ops', async () => {
    const { deleteTenantWithAudit } = await import('@/modules/admin/services/tenant-deletion-service');
    const tenantId = '30000000-0000-4000-8000-000000000002';
    await createTenant(tenantId, 'concurrent-delete');
    const results = await Promise.all(Array.from({ length: 4 }, (_, index) => deleteTenantWithAudit({
      tenantId,
      actorId,
      idempotencyKey: `concurrent-delete-${index}`,
    }, db)));
    expect(results.filter((result) => !result.alreadyDeleted)).toHaveLength(1);
    expect(results.filter((result) => result.alreadyDeleted)).toHaveLength(3);
    expect(await db.auditLog.count({ where: { scope: 'PLATFORM' } })).toBe(4);
  });

  it('rolls back the business transition before isolated failure audit persistence', async () => {
    const { deleteTenantWithAudit } = await import('@/modules/admin/services/tenant-deletion-service');
    const tenantId = '30000000-0000-4000-8000-000000000003';
    await createTenant(tenantId, 'rollback-delete');
    await db.$executeRawUnsafe(`CREATE FUNCTION reject_success_audit() RETURNS trigger AS $$ BEGIN
      IF NEW.metadata->>'outcome' = 'success' THEN RAISE EXCEPTION 'forced success audit failure'; END IF;
      RETURN NEW; END; $$ LANGUAGE plpgsql`);
    await db.$executeRawUnsafe(`CREATE TRIGGER reject_success_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION reject_success_audit()`);
    await expect(deleteTenantWithAudit({ tenantId, actorId, idempotencyKey: 'rollback-delete-1' }, db)).rejects.toThrow();
    expect(await db.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({ status: 'active' });
    expect(await db.auditLog.findFirst()).toMatchObject({ scope: 'PLATFORM' });
    await db.$executeRawUnsafe('DROP TRIGGER reject_success_audit ON audit_logs');
    await db.$executeRawUnsafe('DROP FUNCTION reject_success_audit()');
  });

  it('returns 503 and leaves tenant active when AuditLog and Outbox are both unavailable', async () => {
    const { deleteTenantWithAudit } = await import('@/modules/admin/services/tenant-deletion-service');
    const tenantId = '30000000-0000-4000-8000-000000000004';
    await createTenant(tenantId, 'unavailable-delete');
    await db.$executeRawUnsafe(`CREATE FUNCTION reject_all_audit() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'unavailable'; END; $$ LANGUAGE plpgsql`);
    await db.$executeRawUnsafe('CREATE TRIGGER reject_all_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION reject_all_audit()');
    await db.$executeRawUnsafe('CREATE TRIGGER reject_all_outbox BEFORE INSERT ON audit_event_outbox FOR EACH ROW EXECUTE FUNCTION reject_all_audit()');
    await expect(deleteTenantWithAudit({ tenantId, actorId, idempotencyKey: 'unavailable-delete-1' }, db))
      .rejects.toMatchObject({ code: 'AUDIT_UNAVAILABLE', statusCode: 503 });
    expect(await db.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({ status: 'active' });
    await db.$executeRawUnsafe('DROP TRIGGER reject_all_audit ON audit_logs');
    await db.$executeRawUnsafe('DROP TRIGGER reject_all_outbox ON audit_event_outbox');
    await db.$executeRawUnsafe('DROP FUNCTION reject_all_audit()');
  });

  it('retains platform tombstones across Tenant cascade and enforces retention/hold', async () => {
    const { writePlatformAuditUsing } = await import('@/modules/admin/services/platform-audit-service');
    const tenantId = '30000000-0000-4000-8000-000000000005';
    await createTenant(tenantId, 'cascade-delete');
    const audit = await writePlatformAuditUsing(db, { actorId, actorRole: 'platform_admin', action: 'tenant.tombstone', targetType: 'tenant', targetId: tenantId, targetKey: tenantId, outcome: 'success', idempotencyIdentity: 'cascade-tombstone', correlationId: 'cascade-tombstone' });
    await db.$executeRawUnsafe('DELETE FROM tenants WHERE id = $1::uuid', tenantId);
    expect(await db.auditLog.findUnique({ where: { id: audit.id } })).not.toBeNull();
    await expect(db.$executeRawUnsafe('DELETE FROM audit_logs WHERE id = $1', audit.id)).rejects.toThrow(/retention/);
    await db.auditLog.update({ where: { id: audit.id }, data: { retentionUntil: new Date(0), legalHold: true } });
    await expect(db.$executeRawUnsafe('DELETE FROM audit_logs WHERE id = $1', audit.id)).rejects.toThrow(/retention/);
  });
});
