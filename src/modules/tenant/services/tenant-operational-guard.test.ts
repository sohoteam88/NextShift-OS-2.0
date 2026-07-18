import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/lib/errors';
import { assertTenantOperational, tenantOperationalState } from './tenant-operational-guard';

function database(status: string | null) {
  return {
    tenant: {
      findUnique: vi.fn().mockResolvedValue(status === null ? null : { status }),
    },
  } as never;
}

describe('deleted tenant operational authority', () => {
  it('allows a live tenant at claim and immediately-before-side-effect phases', async () => {
    const db = database('active');
    await expect(assertTenantOperational('tenant-1', 'claim', db)).resolves.toBeUndefined();
    await expect(assertTenantOperational('tenant-1', 'pre_side_effect', db)).resolves.toBeUndefined();
  });

  it('fails closed with a stable reason for deleted tenants', async () => {
    await expect(assertTenantOperational('tenant-1', 'webhook', database('deleted')))
      .rejects.toMatchObject({ code: 'TENANT_DELETED', statusCode: 403 });
  });

  it('suppresses late callbacks without treating deletion as provider failure', async () => {
    await expect(tenantOperationalState('tenant-1', 'webhook', database('deleted')))
      .resolves.toEqual({ operational: false, reason: 'TENANT_DELETED_TERMINAL' });
  });

  it('does not convert a missing tenant into the deleted suppression state', async () => {
    await expect(tenantOperationalState('tenant-1', 'claim', database(null)))
      .rejects.toBeInstanceOf(AppError);
  });
});
