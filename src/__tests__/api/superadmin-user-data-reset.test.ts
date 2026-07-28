import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getAuthUser: vi.fn() }));
const reset = vi.hoisted(() => ({ resetUserBusinessDataWithAudit: vi.fn() }));

vi.mock('@/modules/auth/services/auth-service', () => ({ getAuthUser: auth.getAuthUser }));
vi.mock('@/modules/admin/services/user-data-reset-service', () => reset);

import { POST } from '@/app/api/v1/superadmin/users/[id]/reset/route';

const platformAdmin = {
  id: '10000000-0000-4000-8000-000000000001', email: 'platform@example.test',
  tenantId: '10000000-0000-4000-8000-000000000002', role: 'platform_admin', name: 'Platform',
  preferredLanguage: 'zh', status: 'active' as const,
};
const targetId = '10000000-0000-4000-8000-000000000003';

describe('superadmin user business data reset API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getAuthUser.mockResolvedValue(platformAdmin);
    reset.resetUserBusinessDataWithAudit.mockResolvedValue({ perTableCounts: { lead: 2 }, metadataKeysCleared: ['brand_profile'] });
  });

  it('allows platform_admin and returns the deletion receipt', async () => {
    const response = await POST(new Request(`https://example.test/api/v1/superadmin/users/${targetId}/reset`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-correlation-id': 'reset-api-test' },
      body: JSON.stringify({ confirmEmail: 'target@example.test' }),
    }) as never, { params: Promise.resolve({ id: targetId }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { perTableCounts: { lead: 2 }, metadataKeysCleared: ['brand_profile'] } });
    expect(reset.resetUserBusinessDataWithAudit).toHaveBeenCalledWith(
      platformAdmin.id, targetId, 'target@example.test', 'reset-api-test',
    );
  });

  it('rejects non-platform roles before calling the reset service', async () => {
    auth.getAuthUser.mockResolvedValue({ ...platformAdmin, role: 'operator' });
    const response = await POST(new Request(`https://example.test/api/v1/superadmin/users/${targetId}/reset`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmEmail: 'target@example.test' }),
    }) as never, { params: Promise.resolve({ id: targetId }) });

    expect(response.status).toBe(403);
    expect(reset.resetUserBusinessDataWithAudit).not.toHaveBeenCalled();
  });
});
