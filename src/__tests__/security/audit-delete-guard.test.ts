import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertAuditDeleteAllowed, assertTenantHardDeleteAllowed } from '@/lib/audit-delete-guard';

describe('audit delete guard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('blocks audit delete operations in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(() => assertAuditDeleteAllowed('auditLog.deleteMany()')).toThrow();
  });

  it('blocks tenant hard delete operations in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(() => assertTenantHardDeleteAllowed()).toThrow();
  });
});
