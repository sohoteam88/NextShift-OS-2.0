import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getAuthUser: vi.fn() }));

vi.mock('@/modules/auth/services/auth-service', () => ({ getAuthUser: auth.getAuthUser }));

import { PATCH as patchFeedback } from '@/app/api/v1/superadmin/feedback/[id]/route';
import { DELETE as revokeOverride, POST as setOverride } from '@/app/api/v1/superadmin/override/route';
import { DELETE as deleteUser, PATCH as patchUser } from '@/app/api/v1/superadmin/users/[id]/route';
import { POST as createTenant } from '@/app/api/v1/superadmin/tenants/route';
import { DELETE as deleteTenant, PATCH as patchTenant } from '@/app/api/v1/superadmin/tenants/[id]/route';
import { POST as recordUsage } from '@/app/api/v1/superadmin/usage/route';
import { POST as reconcileAuthUid } from '@/app/api/v1/superadmin/auth/uid-reconciliation/route';

const targetId = '20000000-0000-4000-8000-000000000001';

type Invocation = {
  stableId: string;
  run: () => Promise<Response>;
};

function request(path: string, method: string): NextRequest {
  return new NextRequest(`https://example.test${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
}

const invocations: Invocation[] = [
  {
    stableId: 'TARGET-SUPER-001',
    run: () => patchFeedback(request(`/api/v1/superadmin/feedback/${targetId}`, 'PATCH'), {
      params: Promise.resolve({ id: targetId }),
    }),
  },
  {
    stableId: 'TARGET-SUPER-002',
    run: () => setOverride(request('/api/v1/superadmin/override', 'POST')),
  },
  {
    stableId: 'TARGET-SUPER-003',
    run: () => revokeOverride(request('/api/v1/superadmin/override', 'DELETE')),
  },
  {
    stableId: 'TARGET-SUPER-004',
    run: () => patchUser(request(`/api/v1/superadmin/users/${targetId}`, 'PATCH'), {
      params: Promise.resolve({ id: targetId }),
    }),
  },
  {
    stableId: 'TARGET-SUPER-005',
    run: () => deleteUser(request(`/api/v1/superadmin/users/${targetId}`, 'DELETE'), {
      params: Promise.resolve({ id: targetId }),
    }),
  },
  {
    stableId: 'TARGET-SUPER-006',
    run: () => createTenant(request('/api/v1/superadmin/tenants', 'POST')),
  },
  {
    stableId: 'TARGET-SUPER-007',
    run: () => patchTenant(request(`/api/v1/superadmin/tenants/${targetId}`, 'PATCH'), {
      params: Promise.resolve({ id: targetId }),
    }),
  },
  {
    stableId: 'TARGET-SUPER-008',
    run: () => deleteTenant(request(`/api/v1/superadmin/tenants/${targetId}`, 'DELETE'), {
      params: Promise.resolve({ id: targetId }),
    }),
  },
  {
    stableId: 'TARGET-SUPER-009',
    run: () => recordUsage(request('/api/v1/superadmin/usage', 'POST')),
  },
  {
    stableId: 'TARGET-SUPER-010',
    run: () => reconcileAuthUid(request('/api/v1/superadmin/auth/uid-reconciliation', 'POST')),
  },
];

describe('U3B-SUPERADMIN-WRITE-ROLE-GUARD', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['member', 'leader', 'operator'] as const)(
    'denies %s before every privileged write can parse or mutate',
    async (role) => {
      auth.getAuthUser.mockResolvedValue({
        id: '10000000-0000-4000-8000-000000000001',
        email: `${role}@example.test`,
        tenantId: '10000000-0000-4000-8000-000000000002',
        role,
        name: role,
        preferredLanguage: 'en',
        status: 'active',
        tenantStatus: 'active',
      });

      for (const invocation of invocations) {
        const response = await invocation.run();
        expect(response.status, invocation.stableId).toBe(403);
      }
    },
  );
});
