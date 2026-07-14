import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

const provisioningMocks = vi.hoisted(() => ({
  provision: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: supabaseMocks.getUser,
    },
  })),
}));

vi.mock('@/modules/tenant/services/tenant-provisioning-service', () => ({
  isVerifiedSupabaseUser: (user: { email?: string; email_confirmed_at?: string | null } | null) =>
    Boolean(user?.email && user.email_confirmed_at),
  tenantProvisioningService: {
    provision: provisioningMocks.provision,
  },
}));

import { POST } from '@/app/api/v1/tenant/register/route';

describe('tenant register API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns EMAIL_VERIFICATION_REQUIRED when there is no verified session', async () => {
    supabaseMocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(request() as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: {
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Please verify your email address before finishing workspace setup.',
      },
    });
    expect(provisioningMocks.provision).not.toHaveBeenCalled();
  });

  it('treats an already provisioned user as a successful idempotent registration', async () => {
    const user = {
      id: 'user_1',
      email: 'user@example.test',
      email_confirmed_at: '2026-07-14T00:00:00.000Z',
    };
    supabaseMocks.getUser.mockResolvedValue({ data: { user } });
    provisioningMocks.provision.mockResolvedValue({
      created: false,
      tenant: { id: 'tenant_1', name: 'Existing Team', slug: 'existing-team', plan: 'starter' },
      user: {
        id: 'user_1',
        email: 'user@example.test',
        name: 'Existing User',
        tenantId: 'tenant_1',
        role: 'operator',
        status: 'active',
      },
    });

    const response = await POST(request() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.created).toBe(false);
    expect(provisioningMocks.provision).toHaveBeenCalledWith(user, {
      name: 'Existing Team',
      slug: 'existing-team',
      plan: 'starter',
      owner_name: 'Existing User',
    });
  });
});

function request() {
  return new Request('https://example.com/api/v1/tenant/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Existing Team',
      slug: 'existing-team',
      plan: 'starter',
      owner_name: 'Existing User',
    }),
  });
}
