import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getAuthUser: vi.fn() }));
vi.mock('@/modules/auth/services/auth-service', () => ({ getAuthUser: auth.getAuthUser }));

const repoRoot = resolve(import.meta.dirname, '../../..');
const migration = resolve(repoRoot, 'supabase/migrations/20260717135456_u3b_three_space_audit.sql');
const schemaIdentityAuthority = resolve(
  repoRoot,
  'scripts/u3b-admin-migration/install-audit-idempotency-authority.sql',
);
const actorTenantId = '10000000-0000-4000-8000-000000000001';
const actorId = '10000000-0000-4000-8000-000000000002';
const schemaActorTenantId = '40000000-0000-4000-8000-000000000001';
const schemaActorId = '40000000-0000-4000-8000-000000000002';

let clusterRoot: string | null = null;
let clusterPort: number | null = null;
let admin: PrismaClient;
let db: PrismaClient;
let schemaDb: PrismaClient;
let databaseUrl: string;
let databaseName: string;
let schemaDatabaseName: string;
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
    "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
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

async function createSchemaTenant(
  id: string,
  slug: string,
  options: { name?: string; userId?: string } = {},
): Promise<void> {
  await schemaDb.tenant.create({ data: { id, name: options.name ?? slug, slug } });
  if (options.userId) {
    await schemaDb.user.create({
      data: {
        id: options.userId,
        tenantId: id,
        email: `${slug}@example.test`,
        name: `${slug} user`,
        role: 'member',
        status: 'active',
      },
    });
  }
}

async function rejectPlatformSuccessAudit(action: string): Promise<void> {
  if (!/^[a-z.]+$/.test(action)) throw new Error(`Unsafe fixture action: ${action}`);
  await schemaDb.$executeRawUnsafe(`CREATE FUNCTION u3b_reject_success_audit() RETURNS trigger AS $$
    BEGIN RAISE EXCEPTION 'forced success audit failure'; END;
    $$ LANGUAGE plpgsql`);
  await schemaDb.$executeRawUnsafe(`CREATE TRIGGER u3b_reject_success_audit
    BEFORE INSERT ON audit_logs FOR EACH ROW
    WHEN (NEW.action = '${action}' AND NEW.metadata->>'outcome' = 'success')
    EXECUTE FUNCTION u3b_reject_success_audit()`);
}

type RealTargetFixture = {
  stableId: string;
  auditAction: string;
  requiredTestIds: readonly string[];
  setup: () => Promise<void>;
  run: (correlationId: string) => Promise<unknown>;
  assertSuccess: () => Promise<void>;
  assertRollback: () => Promise<void>;
};

function realTargetFixtures(): RealTargetFixture[] {
  const feedbackTenantId = '50000000-0000-4000-8000-000000000001';
  const feedbackUserId = '50000000-0000-4000-8000-000000000002';
  const feedbackId = '50000000-0000-4000-8000-000000000003';
  const overrideSetTenantId = '50000000-0000-4000-8000-000000000004';
  const overrideRevokeTenantId = '50000000-0000-4000-8000-000000000005';
  const userUpdateTenantId = '50000000-0000-4000-8000-000000000006';
  const userUpdateId = '50000000-0000-4000-8000-000000000007';
  const userDeleteTenantId = '50000000-0000-4000-8000-000000000008';
  const userDeleteId = '50000000-0000-4000-8000-000000000009';
  const createdTenantId = '50000000-0000-4000-8000-000000000010';
  const tenantUpdateId = '50000000-0000-4000-8000-000000000011';
  const tenantDeleteId = '50000000-0000-4000-8000-000000000012';
  const reconcileTenantId = '50000000-0000-4000-8000-000000000013';
  const reconcileCurrentId = '50000000-0000-4000-8000-000000000014';
  const reconcileDesiredId = '50000000-0000-4000-8000-000000000015';

  return [
    {
      stableId: 'U3B-REAL-TARGET-SUPER-001', auditAction: 'feedback.update',
      requiredTestIds: ['U3B-TARGET-SUPER-001-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-001-AUDIT-FAILURE', 'U3B-TARGET-SUPER-001-IDEMPOTENCY', 'U3B-TARGET-SUPER-001-TENANT-SCOPE'],
      setup: async () => {
        await createSchemaTenant(feedbackTenantId, 'feedback-target', { userId: feedbackUserId });
        await schemaDb.feedback.create({
          data: { id: feedbackId, tenantId: feedbackTenantId, userId: feedbackUserId, type: 'bug', message: 'fixture' },
        });
      },
      run: async (correlationId) => {
        const { updatePlatformFeedbackWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
        return updatePlatformFeedbackWithAudit(schemaActorId, feedbackId, correlationId, 'resolved', schemaDb);
      },
      assertSuccess: async () => expect(await schemaDb.feedback.findUnique({ where: { id: feedbackId } })).toMatchObject({ status: 'resolved' }),
      assertRollback: async () => expect(await schemaDb.feedback.findUnique({ where: { id: feedbackId } })).toMatchObject({ status: 'open' }),
    },
    {
      stableId: 'U3B-REAL-TARGET-SUPER-002', auditAction: 'override.set',
      requiredTestIds: ['U3B-TARGET-SUPER-002-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-002-AUDIT-FAILURE', 'U3B-TARGET-SUPER-002-IDEMPOTENCY', 'U3B-TARGET-SUPER-002-TENANT-SCOPE'],
      setup: () => createSchemaTenant(overrideSetTenantId, 'override-set'),
      run: async (correlationId) => {
        const { setPlatformOverrideWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
        return setPlatformOverrideWithAudit(schemaActorId, overrideSetTenantId, correlationId, {
          enabled: true, reason: 'fixture', grantedBy: schemaActorId, grantedAt: '', updatedAt: '',
        }, schemaDb);
      },
      assertSuccess: async () => expect(await schemaDb.tenant.findUnique({ where: { id: overrideSetTenantId } })).toMatchObject({ settings: expect.objectContaining({ manual_override: expect.objectContaining({ enabled: true }) }) }),
      assertRollback: async () => expect(await schemaDb.tenant.findUnique({ where: { id: overrideSetTenantId } })).toMatchObject({ settings: {} }),
    },
    {
      stableId: 'U3B-REAL-TARGET-SUPER-003', auditAction: 'override.revoke',
      requiredTestIds: ['U3B-TARGET-SUPER-003-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-003-AUDIT-FAILURE', 'U3B-TARGET-SUPER-003-IDEMPOTENCY', 'U3B-TARGET-SUPER-003-TENANT-SCOPE'],
      setup: async () => {
        await createSchemaTenant(overrideRevokeTenantId, 'override-revoke');
        await schemaDb.tenant.update({ where: { id: overrideRevokeTenantId }, data: { settings: { manual_override: { enabled: true } } } });
      },
      run: async (correlationId) => {
        const { revokePlatformOverrideWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
        return revokePlatformOverrideWithAudit(schemaActorId, overrideRevokeTenantId, correlationId, schemaDb);
      },
      assertSuccess: async () => expect(await schemaDb.tenant.findUnique({ where: { id: overrideRevokeTenantId } })).toMatchObject({ settings: expect.objectContaining({ manual_override: null }) }),
      assertRollback: async () => expect(await schemaDb.tenant.findUnique({ where: { id: overrideRevokeTenantId } })).toMatchObject({ settings: expect.objectContaining({ manual_override: expect.objectContaining({ enabled: true }) }) }),
    },
    {
      stableId: 'U3B-REAL-TARGET-SUPER-004', auditAction: 'user.update',
      requiredTestIds: ['U3B-TARGET-SUPER-004-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-004-AUDIT-FAILURE', 'U3B-TARGET-SUPER-004-IDEMPOTENCY', 'U3B-TARGET-SUPER-004-TENANT-SCOPE'],
      setup: () => createSchemaTenant(userUpdateTenantId, 'user-update', { userId: userUpdateId }),
      run: async (correlationId) => {
        const { updatePlatformUserWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
        return updatePlatformUserWithAudit(schemaActorId, userUpdateId, correlationId, { status: 'suspended' }, schemaDb);
      },
      assertSuccess: async () => expect(await schemaDb.user.findUnique({ where: { id: userUpdateId } })).toMatchObject({ status: 'suspended' }),
      assertRollback: async () => expect(await schemaDb.user.findUnique({ where: { id: userUpdateId } })).toMatchObject({ status: 'active' }),
    },
    {
      stableId: 'U3B-REAL-TARGET-SUPER-005', auditAction: 'user.delete',
      requiredTestIds: ['U3B-TARGET-SUPER-005-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-005-AUDIT-FAILURE', 'U3B-TARGET-SUPER-005-IDEMPOTENCY', 'U3B-TARGET-SUPER-005-TENANT-SCOPE'],
      setup: () => createSchemaTenant(userDeleteTenantId, 'user-delete-real', { userId: userDeleteId }),
      run: async (correlationId) => {
        const { deletePlatformUserWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
        return deletePlatformUserWithAudit(schemaActorId, userDeleteId, correlationId, schemaDb);
      },
      assertSuccess: async () => expect(await schemaDb.user.findUnique({ where: { id: userDeleteId } })).toMatchObject({ status: 'suspended', deletedAt: expect.any(Date) }),
      assertRollback: async () => expect(await schemaDb.user.findUnique({ where: { id: userDeleteId } })).toMatchObject({ status: 'active', deletedAt: null }),
    },
    {
      stableId: 'U3B-REAL-TARGET-SUPER-006', auditAction: 'tenant.create',
      requiredTestIds: ['U3B-TARGET-SUPER-006-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-006-AUDIT-FAILURE', 'U3B-TARGET-SUPER-006-IDEMPOTENCY', 'U3B-TARGET-SUPER-006-TENANT-SCOPE'],
      setup: async () => undefined,
      run: async (correlationId) => {
        const { createPlatformTenantWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
        return createPlatformTenantWithAudit(schemaActorId, correlationId, {
          name: 'Created Tenant', slug: 'created-tenant', plan: 'starter', ownerId: createdTenantId,
          ownerEmail: 'created@example.test', ownerName: 'Created Owner',
        }, schemaDb);
      },
      assertSuccess: async () => expect(await schemaDb.tenant.findUnique({ where: { slug: 'created-tenant' } })).not.toBeNull(),
      assertRollback: async () => expect(await schemaDb.tenant.findUnique({ where: { slug: 'created-tenant' } })).toBeNull(),
    },
    {
      stableId: 'U3B-REAL-TARGET-SUPER-007', auditAction: 'tenant.update',
      requiredTestIds: ['U3B-TARGET-SUPER-007-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-007-AUDIT-FAILURE', 'U3B-TARGET-SUPER-007-IDEMPOTENCY', 'U3B-TARGET-SUPER-007-TENANT-SCOPE'],
      setup: () => createSchemaTenant(tenantUpdateId, 'tenant-update-real', { name: 'Before Update' }),
      run: async (correlationId) => {
        const { updatePlatformTenantWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
        return updatePlatformTenantWithAudit(schemaActorId, tenantUpdateId, correlationId, { name: 'After Update' }, schemaDb);
      },
      assertSuccess: async () => expect(await schemaDb.tenant.findUnique({ where: { id: tenantUpdateId } })).toMatchObject({ name: 'After Update' }),
      assertRollback: async () => expect(await schemaDb.tenant.findUnique({ where: { id: tenantUpdateId } })).toMatchObject({ name: 'Before Update' }),
    },
    {
      stableId: 'U3B-REAL-TARGET-SUPER-008', auditAction: 'tenant.delete',
      requiredTestIds: ['U3B-TARGET-SUPER-008-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-008-AUDIT-FAILURE', 'U3B-TARGET-SUPER-008-IDEMPOTENCY', 'U3B-TARGET-SUPER-008-TENANT-SCOPE'],
      setup: () => createSchemaTenant(tenantDeleteId, 'tenant-delete-real', { name: 'Tenant Delete Real' }),
      run: async (correlationId) => {
        const { deleteTenantWithAudit } = await import('@/modules/admin/services/tenant-deletion-service');
        return deleteTenantWithAudit({ tenantId: tenantDeleteId, actorId: schemaActorId, idempotencyKey: correlationId, correlationId }, schemaDb);
      },
      assertSuccess: async () => expect(await schemaDb.tenant.findUnique({ where: { id: tenantDeleteId } })).toMatchObject({ status: 'deleted' }),
      assertRollback: async () => expect(await schemaDb.tenant.findUnique({ where: { id: tenantDeleteId } })).toMatchObject({ status: 'active' }),
    },
    {
      stableId: 'U3B-REAL-TARGET-SUPER-009', auditAction: 'platform.usage.record',
      requiredTestIds: ['U3B-TARGET-SUPER-009-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-009-AUDIT-FAILURE', 'U3B-TARGET-SUPER-009-IDEMPOTENCY', 'U3B-TARGET-SUPER-009-TENANT-SCOPE'],
      setup: async () => undefined,
      run: async (correlationId) => {
        const { recordPlatformUsageWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
        return recordPlatformUsageWithAudit(schemaActorId, correlationId, {
          eventType: 'click', targetId: 'security-queue', targetKind: 'queue', section: 'operations',
        }, schemaDb);
      },
      assertSuccess: async () => undefined,
      assertRollback: async () => undefined,
    },
    {
      stableId: 'U3B-REAL-TARGET-SUPER-010', auditAction: 'auth.uid.reconcile',
      requiredTestIds: ['U3B-TARGET-SUPER-010-AUDIT-SUCCESS', 'U3B-TARGET-SUPER-010-AUDIT-FAILURE', 'U3B-TARGET-SUPER-010-IDEMPOTENCY', 'U3B-TARGET-SUPER-010-TENANT-SCOPE'],
      setup: () => createSchemaTenant(reconcileTenantId, 'uid-reconcile-real', { userId: reconcileCurrentId }),
      run: async (correlationId) => {
        const { reconcilePlatformAuthUidWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
        return reconcilePlatformAuthUidWithAudit(schemaActorId, correlationId, {
          targetTenantId: reconcileTenantId, currentUserId: reconcileCurrentId, desiredAuthUserId: reconcileDesiredId,
        }, schemaDb);
      },
      assertSuccess: async () => {
        expect(await schemaDb.user.findUnique({ where: { id: reconcileCurrentId } })).toBeNull();
        expect(await schemaDb.user.findUnique({ where: { id: reconcileDesiredId } })).not.toBeNull();
      },
      assertRollback: async () => {
        expect(await schemaDb.user.findUnique({ where: { id: reconcileCurrentId } })).not.toBeNull();
        expect(await schemaDb.user.findUnique({ where: { id: reconcileDesiredId } })).toBeNull();
      },
    },
  ];
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

    schemaDatabaseName = `u3b_schema_${process.pid}_${Date.now()}`;
    await admin.$executeRawUnsafe(`CREATE DATABASE "${schemaDatabaseName}"`);
    const schemaDatabaseUrl = baseUrl.replace(/\/postgres$/, `/${schemaDatabaseName}`);
    execFileSync('pnpm', ['exec', 'prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'], {
      cwd: repoRoot,
      env: { ...process.env, DATABASE_URL: schemaDatabaseUrl, DIRECT_URL: schemaDatabaseUrl },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    execFileSync('pnpm', [
      'exec', 'prisma', 'db', 'execute', '--schema', 'prisma/schema.prisma', '--file', schemaIdentityAuthority,
    ], {
      cwd: repoRoot,
      env: { ...process.env, DATABASE_URL: schemaDatabaseUrl, DIRECT_URL: schemaDatabaseUrl },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    schemaDb = new PrismaClient({ datasourceUrl: schemaDatabaseUrl });
  }, 120_000);

  beforeEach(async () => {
    await db.$executeRawUnsafe('TRUNCATE TABLE "audit_operational_alerts", "audit_event_outbox", "audit_logs" CASCADE');
    await db.$executeRawUnsafe(`DELETE FROM "tenants" WHERE "id" <> '${actorTenantId}'::uuid`);
    await schemaDb.$executeRawUnsafe('DROP TRIGGER IF EXISTS u3b_reject_success_audit ON audit_logs');
    await schemaDb.$executeRawUnsafe('DROP FUNCTION IF EXISTS u3b_reject_success_audit()');
    await schemaDb.$executeRawUnsafe(
      'TRUNCATE TABLE "audit_operational_alerts", "audit_event_outbox", "audit_logs", "feedback", "users", "tenants" CASCADE',
    );
    await schemaDb.tenant.create({
      data: { id: schemaActorTenantId, name: 'Schema Authority', slug: 'schema-authority' },
    });
    await schemaDb.user.create({
      data: {
        id: schemaActorId,
        tenantId: schemaActorTenantId,
        email: 'schema-platform@example.test',
        name: 'Schema Platform Admin',
        role: 'platform_admin',
        status: 'active',
      },
    });
    auth.getAuthUser.mockResolvedValue({
      id: schemaActorId,
      email: 'schema-platform@example.test',
      tenantId: schemaActorTenantId,
      role: 'platform_admin',
      name: 'Schema Platform Admin',
      preferredLanguage: 'en',
      status: 'active',
      tenantStatus: 'active',
    });
  });

  afterAll(async () => {
    await db?.$disconnect();
    await schemaDb?.$disconnect();
    if (admin && schemaDatabaseName) {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${schemaDatabaseName}" WITH (FORCE)`);
    }
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
        'audit_event_outbox_terminal_check','audit_operational_alert_digest_check',
        'audit_operational_alert_status_check','audit_operational_alert_receipt_check')
    `;
    expect(constraints.map((row) => row.conname).sort()).toHaveLength(8);
    const indexes = await db.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
      SELECT indexname,indexdef FROM pg_indexes
      WHERE indexname IN ('audit_logs_idempotency_key_unique','audit_logs_tenant_chronology_idx',
        'audit_logs_platform_chronology_idx','audit_event_outbox_claim_idx',
        'audit_operational_alert_claim_idx')
    `;
    expect(indexes).toHaveLength(5);
    expect(indexes.find((row) => row.indexname === 'audit_logs_idempotency_key_unique')?.indexdef)
      .toContain('WHERE (idempotency_key IS NOT NULL)');
    const schemaIndex = await schemaDb.$queryRaw<Array<{ indexdef: string }>>`
      SELECT indexdef FROM pg_indexes WHERE indexname = 'audit_logs_idempotency_key_unique'
    `;
    expect(schemaIndex).toHaveLength(1);
    expect(schemaIndex[0].indexdef).toContain('WHERE (idempotency_key IS NOT NULL)');
  });

  it('U3B-PG-PRISMA-SCHEMA-IDEMPOTENCY supports exact-key conflict handling after prisma db push', async () => {
    const { writePlatformAuditUsing } = await import('@/modules/admin/services/platform-audit-service');
    const input = {
      actorId: schemaActorId,
      actorRole: 'platform_admin' as const,
      action: 'schema.idempotency',
      targetType: 'tenant',
      targetKey: 'schema-vector',
      outcome: 'success' as const,
      correlationId: 'schema-correlation',
      metadata: { version: 1 },
    };
    const first = await writePlatformAuditUsing(schemaDb, input);
    const replay = await writePlatformAuditUsing(schemaDb, input);
    expect(replay.id).toBe(first.id);
    await expect(writePlatformAuditUsing(schemaDb, { ...input, metadata: { version: 2 } }))
      .rejects.toMatchObject({ code: 'AUDIT_IDEMPOTENCY_CONFLICT' });
    expect(await schemaDb.auditLog.count({ where: { idempotencyKey: { not: null } } })).toBe(1);
    expect(await schemaDb.auditOperationalAlert.count()).toBe(1);
  });

  it('rejects inconsistent TENANT/PLATFORM and digest rows below the application', async () => {
    await expect(db.$executeRawUnsafe(`INSERT INTO audit_logs
      (id,tenant_id,scope,action,metadata,created_at) VALUES
      ('bad-platform','${actorTenantId}','PLATFORM','bad','{}',now())`)).rejects.toThrow();
    await expect(db.$executeRawUnsafe(`INSERT INTO audit_logs
      (id,tenant_id,scope,action,metadata,idempotency_key,payload_digest,created_at) VALUES
      ('bad-digest','${actorTenantId}','TENANT','bad','{}','bad','bad',now())`)).rejects.toThrow();
  });

  it('U3B-PG-IDEMPOTENCY-DIRECT-RACE collapses concurrent direct writes with the same digest to one stable row', async () => {
    const { writePlatformAuditUsing } = await import('@/modules/admin/services/platform-audit-service');
    const input = { actorId, actorRole: 'platform_admin' as const, action: 'tenant.inspect', targetType: 'tenant', targetKey: 'global', outcome: 'success' as const, correlationId: 'same-correlation', idempotencyIdentity: 'same-attempt', metadata: { value: 1 } };
    const results = await Promise.all(Array.from({ length: 12 }, () => writePlatformAuditUsing(db, input)));
    expect(new Set(results.map((row) => row.id))).toHaveLength(1);
    expect(await db.auditLog.count()).toBe(1);
  });

  it('U3B-PG-DIGEST-CONFLICT preserves the original row and emits durable dead-letter evidence', async () => {
    const { writePlatformAuditUsing } = await import('@/modules/admin/services/platform-audit-service');
    const common = { actorId, actorRole: 'platform_admin' as const, action: 'tenant.inspect', targetType: 'tenant', targetKey: 'global', outcome: 'success' as const, correlationId: 'conflict-correlation', idempotencyIdentity: 'conflict-attempt' };
    const original = await writePlatformAuditUsing(db, { ...common, metadata: { value: 1 } });
    await expect(writePlatformAuditUsing(db, { ...common, metadata: { value: 2 } }))
      .rejects.toMatchObject({ code: 'AUDIT_IDEMPOTENCY_CONFLICT' });
    expect((await db.auditLog.findMany())[0].id).toBe(original.id);
    expect(await db.auditEventOutbox.findFirst()).toMatchObject({
      status: 'dead_letter',
      failureCode: 'AUDIT_IDEMPOTENCY_CONFLICT',
      alertedAt: null,
    });
    expect(await db.auditOperationalAlert.findFirst()).toMatchObject({
      status: 'pending', alertType: 'AUDIT_IDEMPOTENCY_CONFLICT', correlationId: 'conflict-correlation',
    });
  });

  it('U3B-PG-IDEMPOTENCY-REPLAY-RACES makes replay/replay and direct/replay races idempotent', async () => {
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

  it('U3B-PG-CANONICAL-VECTORS uses correlation ID in canonical identity while excluding retry metadata', async () => {
    const { buildPlatformAuditEvent } = await import('@/modules/admin/services/platform-audit-service');
    const base = { actorId, actorRole: 'platform_admin' as const, action: 'canonical.vector', targetType: 'tenant', targetKey: 'vector', outcome: 'failure' as const, correlationId: 'canonical-correlation', metadata: { reason: 'fixture' } };
    const first = buildPlatformAuditEvent({ ...base, idempotencyIdentity: 'delivery-attempt-one' });
    const retry = buildPlatformAuditEvent({ ...base, idempotencyIdentity: 'delivery-attempt-two' });
    const other = buildPlatformAuditEvent({ ...base, correlationId: 'different-correlation' });
    expect(first.identity).toMatchObject({ version: 1, correlationId: 'canonical-correlation', scope: 'PLATFORM' });
    expect(first.identity).not.toHaveProperty('retryIdentity');
    expect(first.idempotencyKey).toBe('9c9568dc398b9db60c026b924bfc3d693032cea7475839c8bba49a22a8ba9c23');
    expect(first.payloadDigest).toBe('299820a74ff311e1c5a0b5343279716ef10cd8535cbf38de91071e9e21ee1b7c');
    expect(first.idempotencyKey).toBe(retry.idempotencyKey);
    expect(first.payloadDigest).toBe(retry.payloadDigest);
    expect(first.idempotencyKey).not.toBe(other.idempotencyKey);
  });

  it('U3B-PG-CORRELATION-ORDERING blocks later same-correlation delivery while an earlier event retries', async () => {
    const { buildPlatformAuditEvent } = await import('@/modules/admin/services/platform-audit-service');
    const { claimNextAuditEvent } = await import('@/modules/admin/workers/audit-outbox-worker');
    const common = { actorId, actorRole: 'platform_admin' as const, targetType: 'tenant', targetKey: 'ordered', outcome: 'failure' as const, correlationId: 'ordered-correlation' };
    const first = buildPlatformAuditEvent({ ...common, action: 'ordered.first' });
    const second = buildPlatformAuditEvent({ ...common, action: 'ordered.second' });
    await db.$executeRaw(Prisma.sql`INSERT INTO "audit_event_outbox"
      ("id","idempotency_key","payload_digest","payload","correlation_id","next_attempt_at","retention_until","created_at") VALUES
      ('ordered-first',${first.idempotencyKey},${first.payloadDigest},CAST(${JSON.stringify(first.payload)} AS jsonb),${first.correlationId},now()+interval '1 hour',now()+interval '24 months',now()-interval '1 minute'),
      ('ordered-second',${second.idempotencyKey},${second.payloadDigest},CAST(${JSON.stringify(second.payload)} AS jsonb),${second.correlationId},now(),now()+interval '24 months',now())`);
    expect(await claimNextAuditEvent(db)).toBeNull();
    await db.auditEventOutbox.update({ where: { id: 'ordered-first' }, data: { nextAttemptAt: new Date(0) } });
    expect((await claimNextAuditEvent(db))?.id).toBe('ordered-first');
  });

  it('U3B-PG-ALERT-DELIVERY-RECEIPT delivers dead-letter alerts through a durable receipt', async () => {
    const { writePlatformAuditUsing } = await import('@/modules/admin/services/platform-audit-service');
    const { claimNextOperationalAlert, deliverClaimedOperationalAlert } = await import('@/modules/admin/workers/audit-outbox-worker');
    const common = { actorId, actorRole: 'platform_admin' as const, action: 'alert.vector', targetType: 'tenant', targetKey: 'alert', outcome: 'failure' as const, correlationId: 'alert-correlation' };
    await writePlatformAuditUsing(db, { ...common, metadata: { version: 1 } });
    await expect(writePlatformAuditUsing(db, { ...common, metadata: { version: 2 } })).rejects.toMatchObject({ code: 'AUDIT_IDEMPOTENCY_CONFLICT' });
    const outboxBefore = await db.auditEventOutbox.findFirstOrThrow();
    expect(outboxBefore.alertedAt).toBeNull();
    const alert = await claimNextOperationalAlert(db);
    expect(alert).not.toBeNull();
    expect(await deliverClaimedOperationalAlert(alert!, async () => ({ receipt: 'security-channel:receipt-001' }), db)).toBe('delivered');
    expect(await db.auditOperationalAlert.findUnique({ where: { id: alert!.id } })).toMatchObject({
      status: 'delivered', deliveryReceipt: 'security-channel:receipt-001',
    });
    expect((await db.auditEventOutbox.findUniqueOrThrow({ where: { id: outboxBefore.id } })).alertedAt).not.toBeNull();
    await expect(db.$executeRawUnsafe('DELETE FROM audit_operational_alerts WHERE id = $1', alert!.id))
      .rejects.toThrow(/retention/);
  });

  it.each(realTargetFixtures())(
    '$stableId success executes the real service and commits PLATFORM evidence',
    async (fixture) => {
      await fixture.setup();
      const correlationId = `${fixture.stableId.toLowerCase()}-success`;
      await fixture.run(correlationId);
      await fixture.assertSuccess();
      const event = await schemaDb.auditLog.findFirstOrThrow({
        where: { scope: 'PLATFORM', action: fixture.auditAction },
        orderBy: { createdAt: 'desc' },
      });
      expect(event.tenantId).toBeNull();
      expect(event.idempotencyKey).toMatch(/^[0-9a-f]{64}$/);
      expect(event.payloadDigest).toMatch(/^[0-9a-f]{64}$/);
      expect(event.retentionUntil).not.toBeNull();
      expect(event.metadata).toMatchObject({ outcome: 'success', correlation_id: correlationId });
    },
  );

  it.each(realTargetFixtures())(
    '$stableId forced success-audit failure rolls the real service back and persists PLATFORM failure evidence',
    async (fixture) => {
      await fixture.setup();
      const correlationId = `${fixture.stableId.toLowerCase()}-failure`;
      await rejectPlatformSuccessAudit(fixture.auditAction);
      await expect(fixture.run(correlationId)).rejects.toThrow();
      await fixture.assertRollback();
      const failure = await schemaDb.auditLog.findFirstOrThrow({
        where: { scope: 'PLATFORM', action: fixture.auditAction },
        orderBy: { createdAt: 'desc' },
      });
      expect(failure.tenantId).toBeNull();
      expect(failure.metadata).toMatchObject({ outcome: 'failure', correlation_id: correlationId });
      if (fixture.stableId === 'U3B-REAL-TARGET-SUPER-005') {
        expect(await schemaDb.auditLog.findFirst({
          where: { scope: 'PLATFORM', action: 'user.delete.intent' },
        })).not.toBeNull();
      }
    },
  );

  it('persists user-delete intent before external work and commits the database outcome with its success audit', async () => {
    const { deletePlatformUserWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
    const tenantId = '30000000-0000-4000-8000-000000000013';
    const userId = '30000000-0000-4000-8000-000000000014';
    await createTenant(tenantId, 'user-delete-intent');
    await db.$executeRawUnsafe(`INSERT INTO users (id,tenant_id,email,name,role,status)
      VALUES ($1::uuid,$2::uuid,'member@example.test','Member','member','active')`, userId, tenantId);
    const result = await deletePlatformUserWithAudit(actorId, userId, 'user-delete-protocol', db);
    expect(result).toMatchObject({ id: userId, status: 'suspended' });
    expect((await db.$queryRawUnsafe<Array<{ status: string; deleted_at: Date | null }>>(
      'SELECT status,deleted_at FROM users WHERE id = $1::uuid', userId,
    ))[0]).toMatchObject({ status: 'suspended', deleted_at: expect.any(Date) });
    const events = await db.auditLog.findMany({ where: { scope: 'PLATFORM' }, orderBy: { createdAt: 'asc' } });
    expect(events.map((event) => event.action)).toEqual(['user.delete.intent', 'user.delete']);
    expect(events.every((event) => (event.metadata as Record<string, unknown>).correlation_id === 'user-delete-protocol')).toBe(true);
  });

  it('keeps user-delete intent and isolated failure evidence when the outcome transaction rolls back', async () => {
    const { deletePlatformUserWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
    const tenantId = '30000000-0000-4000-8000-000000000015';
    const userId = '30000000-0000-4000-8000-000000000016';
    await createTenant(tenantId, 'user-delete-rollback');
    await db.$executeRawUnsafe(`INSERT INTO users (id,tenant_id,email,name,role,status)
      VALUES ($1::uuid,$2::uuid,'rollback@example.test','Rollback','member','active')`, userId, tenantId);
    await db.$executeRawUnsafe(`CREATE FUNCTION reject_user_delete_success() RETURNS trigger AS $$ BEGIN
      IF NEW.action = 'user.delete' AND NEW.metadata->>'outcome' = 'success' THEN RAISE EXCEPTION 'forced outcome failure'; END IF;
      RETURN NEW; END; $$ LANGUAGE plpgsql`);
    await db.$executeRawUnsafe('CREATE TRIGGER reject_user_delete_success BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION reject_user_delete_success()');
    await expect(deletePlatformUserWithAudit(actorId, userId, 'user-delete-rollback', db)).rejects.toThrow();
    expect((await db.$queryRawUnsafe<Array<{ status: string; deleted_at: Date | null }>>(
      'SELECT status,deleted_at FROM users WHERE id = $1::uuid', userId,
    ))[0]).toMatchObject({ status: 'active', deleted_at: null });
    const events = await db.auditLog.findMany({ where: { scope: 'PLATFORM' }, orderBy: { createdAt: 'asc' } });
    expect(events.map((event) => event.action)).toEqual(['user.delete.intent', 'user.delete']);
    expect((events[1].metadata as Record<string, unknown>).outcome).toBe('failure');
    await db.$executeRawUnsafe('DROP TRIGGER reject_user_delete_success ON audit_logs');
    await db.$executeRawUnsafe('DROP FUNCTION reject_user_delete_success()');
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

  it('U3B-TARGET-SUPER-008-HTTP-IDEMPOTENT-REPLAY reuses one route-level attempt without X-Correlation-ID', async () => {
    const { createTenantDeleteRoute } = await import('@/app/api/v1/superadmin/tenants/[id]/route');
    const { deleteTenantWithAudit } = await import('@/modules/admin/services/tenant-deletion-service');
    const tenantId = '40000000-0000-4000-8000-000000000008';
    await schemaDb.tenant.create({ data: { id: tenantId, name: 'Delete Replay Tenant', slug: 'delete-replay' } });
    const handler = createTenantDeleteRoute((command) => deleteTenantWithAudit(command, schemaDb));
    const invoke = () => handler(new NextRequest(`https://example.test/api/v1/superadmin/tenants/${tenantId}`, {
      method: 'DELETE',
      headers: { 'Idempotency-Key': 'tenant-delete-attempt-0008' },
    }), { params: Promise.resolve({ id: tenantId }) });

    const firstResponse = await invoke();
    const replayResponse = await invoke();
    expect(firstResponse.status).toBe(200);
    expect(replayResponse.status).toBe(200);
    const first = await firstResponse.json();
    const replay = await replayResponse.json();
    expect(first.data).toMatchObject({ alreadyDeleted: false, replayed: false });
    expect(replay.data).toMatchObject({ alreadyDeleted: false, replayed: true });
    expect(first.correlationId).toBe('tenant-delete-attempt-0008');
    expect(replay.correlationId).toBe(first.correlationId);

    const events = await schemaDb.auditLog.findMany({ where: { scope: 'PLATFORM' } });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      tenantId: null,
      action: 'tenant.delete',
      targetId: tenantId,
      scope: 'PLATFORM',
    });
    expect(events[0].metadata).toEqual({
      tenant_id: tenantId,
      tenant_label_sha256: createHash('sha256').update('Delete Replay Tenant').digest('hex'),
      prior_status: 'active',
      correlation_id: 'tenant-delete-attempt-0008',
      actor_role: 'platform_admin',
      outcome: 'success',
      failure_code: null,
    });
  });

  it('U3B-TARGET-SUPER-008-HEADER-MISMATCH rejects competing route identities before mutation', async () => {
    const { createTenantDeleteRoute } = await import('@/app/api/v1/superadmin/tenants/[id]/route');
    const { deleteTenantWithAudit } = await import('@/modules/admin/services/tenant-deletion-service');
    const tenantId = '40000000-0000-4000-8000-000000000009';
    await schemaDb.tenant.create({ data: { id: tenantId, name: 'Mismatch Tenant', slug: 'mismatch-tenant' } });
    const handler = createTenantDeleteRoute((command) => deleteTenantWithAudit(command, schemaDb));
    const response = await handler(new NextRequest(`https://example.test/api/v1/superadmin/tenants/${tenantId}`, {
      method: 'DELETE',
      headers: {
        'Idempotency-Key': 'tenant-delete-attempt-0009',
        'X-Correlation-ID': 'different-correlation-0009',
      },
    }), { params: Promise.resolve({ id: tenantId }) });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'IDEMPOTENCY_CORRELATION_MISMATCH' } });
    expect(await schemaDb.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({ status: 'active' });
    expect(await schemaDb.auditLog.count()).toBe(0);
  });

  it('U3B-PG-DELETED-TERMINAL allows only non-deleted PATCH statuses and reserves deleted for DELETE', async () => {
    const { updatePlatformTenantWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
    const tenantId = '30000000-0000-4000-8000-000000000011';
    await createTenant(tenantId, 'patch-status');
    await updatePlatformTenantWithAudit(actorId, tenantId, 'tenant-patch-suspend', { status: 'suspended' }, db);
    expect(await db.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({ status: 'suspended' });
    await expect(updatePlatformTenantWithAudit(actorId, tenantId, 'tenant-patch-delete', {
      status: 'deleted',
    } as never, db)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(await db.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({ status: 'suspended' });
    await db.tenant.update({ where: { id: tenantId }, data: { status: 'deleted' } });
    await expect(updatePlatformTenantWithAudit(actorId, tenantId, 'tenant-patch-restore', { status: 'active' }, db))
      .rejects.toMatchObject({ code: 'TENANT_DELETED_TERMINAL' });
    expect(await db.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({ status: 'deleted' });
  });

  it('validates override target existence and deleted-terminal state before atomic settings mutation', async () => {
    const { revokePlatformOverrideWithAudit, setPlatformOverrideWithAudit } = await import('@/modules/admin/services/platform-mutation-service');
    const tenantId = '30000000-0000-4000-8000-000000000012';
    await createTenant(tenantId, 'override-target');
    await setPlatformOverrideWithAudit(actorId, tenantId, 'override-retained', {
      enabled: true, reason: 'fixture', grantedBy: actorId, grantedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }, db);
    expect(await db.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({
      settings: expect.objectContaining({ manual_override: expect.objectContaining({ enabled: true }) }),
    });
    await revokePlatformOverrideWithAudit(actorId, tenantId, 'override-revoke-retained', db);
    expect(await db.tenant.findUnique({ where: { id: tenantId } })).toMatchObject({
      settings: expect.objectContaining({ manual_override: null }),
    });
    await db.tenant.update({ where: { id: tenantId }, data: { status: 'deleted' } });
    await expect(setPlatformOverrideWithAudit(actorId, tenantId, 'override-deleted', {
      enabled: true, reason: 'forbidden', grantedBy: actorId, grantedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }, db)).rejects.toMatchObject({ code: 'TENANT_DELETED_TERMINAL' });
    await expect(revokePlatformOverrideWithAudit(actorId, tenantId, 'override-revoke-deleted', db))
      .rejects.toMatchObject({ code: 'TENANT_DELETED_TERMINAL' });
    await expect(setPlatformOverrideWithAudit(actorId, '30000000-0000-4000-8000-000000000099', 'override-missing', {
      enabled: true, reason: 'missing', grantedBy: actorId, grantedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }, db)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(revokePlatformOverrideWithAudit(
      actorId,
      '30000000-0000-4000-8000-000000000099',
      'override-revoke-missing',
      db,
    )).rejects.toMatchObject({ code: 'NOT_FOUND' });
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
    const failure = await db.auditLog.findFirstOrThrow();
    expect(failure.metadata).toEqual({
      tenant_id: tenantId,
      tenant_label_sha256: createHash('sha256').update('rollback-delete').digest('hex'),
      prior_status: 'active',
      correlation_id: 'rollback-delete-1',
      actor_role: 'platform_admin',
      outcome: 'failure',
      failure_code: 'TENANT_DELETE_TRANSACTION_FAILED',
    });
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
