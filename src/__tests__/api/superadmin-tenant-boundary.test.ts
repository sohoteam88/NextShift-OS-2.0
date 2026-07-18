import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';

const auth = vi.hoisted(() => ({ getAuthUser: vi.fn() }));
const mutations = vi.hoisted(() => ({
  updatePlatformTenantWithAudit: vi.fn(),
  setPlatformOverrideWithAudit: vi.fn(),
  revokePlatformOverrideWithAudit: vi.fn(),
  requireRetainedPlatformTenant: vi.fn(),
}));

vi.mock('@/modules/auth/services/auth-service', () => ({ getAuthUser: auth.getAuthUser }));
vi.mock('@/modules/admin/services/platform-mutation-service', () => mutations);

import { PATCH as patchTenant } from '@/app/api/v1/superadmin/tenants/[id]/route';
import { DELETE as revokeOverride, GET as getOverride, POST as setOverride } from '@/app/api/v1/superadmin/override/route';

const user = {
  id: '10000000-0000-4000-8000-000000000001', email: 'platform@example.test',
  tenantId: '10000000-0000-4000-8000-000000000002', role: 'platform_admin',
  name: 'Platform', preferredLanguage: 'en', status: 'active' as const,
};
const tenantId = '20000000-0000-4000-8000-000000000001';

describe('superadmin tenant mutation boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getAuthUser.mockResolvedValue(user);
    mutations.updatePlatformTenantWithAudit.mockResolvedValue({ id: tenantId, status: 'suspended' });
  });

  it('PATCH rejects deleted and unknown tenant statuses before the service can mutate', async () => {
    for (const status of ['deleted', 'restored', 'pending']) {
      const response = await patchTenant(new Request(`https://example.test/api/v1/superadmin/tenants/${tenantId}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }),
      }) as never, { params: Promise.resolve({ id: tenantId }) });
      expect(response.status).toBe(400);
    }
    expect(mutations.updatePlatformTenantWithAudit).not.toHaveBeenCalled();
  });

  it('PATCH accepts the explicit non-deleted status enum', async () => {
    const response = await patchTenant(new Request(`https://example.test/api/v1/superadmin/tenants/${tenantId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json', 'x-correlation-id': 'tenant-patch-fixture' }, body: JSON.stringify({ status: 'suspended' }),
    }) as never, { params: Promise.resolve({ id: tenantId }) });
    expect(response.status).toBe(200);
    expect(mutations.updatePlatformTenantWithAudit).toHaveBeenCalledWith(user.id, tenantId, 'tenant-patch-fixture', { status: 'suspended' });
  });

  it('override GET, POST and DELETE reject non-UUID tenant targets without actor-tenant fallback', async () => {
    const getResponse = await getOverride(new NextRequest('https://example.test/api/v1/superadmin/override?tenantId=actor-tenant'));
    const postResponse = await setOverride(new NextRequest('https://example.test/api/v1/superadmin/override', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId: 'actor-tenant', enabled: true, reason: 'fixture' }),
    }));
    const deleteResponse = await revokeOverride(new NextRequest('https://example.test/api/v1/superadmin/override', {
      method: 'DELETE', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId: 'actor-tenant' }),
    }));
    expect(getResponse.status).toBe(400);
    expect(postResponse.status).toBe(400);
    expect(deleteResponse.status).toBe(400);
    expect(mutations.requireRetainedPlatformTenant).not.toHaveBeenCalled();
    expect(mutations.setPlatformOverrideWithAudit).not.toHaveBeenCalled();
    expect(mutations.revokePlatformOverrideWithAudit).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', new AppError('NOT_FOUND', 404, 'Tenant not found'), 404],
    ['deleted', new AppError('TENANT_DELETED_TERMINAL', 409, 'Deleted tenant is terminal'), 409],
  ])('override GET rejects an explicit %s target before data loading', async (_label, error, status) => {
    mutations.requireRetainedPlatformTenant.mockRejectedValueOnce(error);
    const response = await getOverride(new NextRequest(
      `https://example.test/api/v1/superadmin/override?tenantId=${tenantId}`,
    ));
    expect(response.status).toBe(status);
  });
});
