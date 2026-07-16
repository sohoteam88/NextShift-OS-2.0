import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve('prisma/migrations/20260715220949_add_content_updated_at/migration.sql'),
  'utf8',
);

describe('E2 Content.updatedAt migration contract', () => {
  it('adds, backfills, then constrains updated_at in data-safe order', () => {
    const add = migration.indexOf('ADD COLUMN "updated_at" TIMESTAMPTZ(6)');
    const backfill = migration.indexOf('SET "updated_at" = "created_at"');
    const notNull = migration.indexOf('ALTER COLUMN "updated_at" SET NOT NULL');

    expect(add).toBeGreaterThan(-1);
    expect(backfill).toBeGreaterThan(add);
    expect(notNull).toBeGreaterThan(backfill);
    expect(migration).toContain('ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP');
  });

  it('adds both tenant/owner and tenant-only deterministic ordering indexes', () => {
    expect(migration).toContain('"contents_tenant_id_owner_id_updated_at_id_idx"');
    expect(migration).toContain('("tenant_id", "owner_id", "updated_at", "id")');
    expect(migration).toContain('"contents_tenant_id_updated_at_id_idx"');
    expect(migration).toContain('("tenant_id", "updated_at", "id")');
  });

  it('contains no destructive table, column, or row operation', () => {
    expect(migration).not.toMatch(/\bDROP\b/i);
    expect(migration).not.toMatch(/\bDELETE\b/i);
    expect(migration).not.toMatch(/\bTRUNCATE\b/i);
    expect(migration).not.toMatch(/\bRENAME\b/i);
  });
});
