import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  tenant: {
    findUnique: vi.fn(),
  },
}));

const tenantServiceMocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

const telemetryMocks = vi.hoisted(() => ({
  trackUserSignedUp: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/tenant/services/tenant-service', () => ({ tenantService: tenantServiceMocks }));
vi.mock('@/lib/telemetry/tracker', () => telemetryMocks);

import { tenantProvisioningService } from '@/modules/tenant/services/tenant-provisioning-service';

describe('tenantProvisioningService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.tenant.findUnique.mockResolvedValue(null);
    telemetryMocks.trackUserSignedUp.mockResolvedValue(undefined);
  });

  it('returns the existing app user on a repeat call without provisioning or tracking twice', async () => {
    const authUser = {
      id: 'supabase-user-1',
      email: 'owner@example.test',
      email_confirmed_at: '2026-07-14T00:00:00.000Z',
      user_metadata: { locale: 'en' },
    };
    const createdResult = {
      tenant: { id: 'tenant_1', name: 'Example Team', slug: 'example-team', plan: 'starter' },
      user: {
        id: 'supabase-user-1',
        email: 'owner@example.test',
        name: 'Owner',
        tenantId: 'tenant_1',
        role: 'operator',
        status: 'active',
      },
    };
    const existingUser = {
      ...createdResult.user,
      tenant: createdResult.tenant,
    };

    prismaMocks.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingUser);
    tenantServiceMocks.create.mockResolvedValue(createdResult);

    const first = await tenantProvisioningService.provision(authUser, {
      name: 'Example Team',
      slug: 'example-team',
      plan: 'starter',
      owner_name: 'Owner',
    });
    const repeat = await tenantProvisioningService.provision(authUser, {
      name: 'Example Team',
      slug: 'example-team',
      plan: 'starter',
      owner_name: 'Owner',
    });

    expect(first.created).toBe(true);
    expect(repeat).toEqual({ created: false, tenant: createdResult.tenant, user: createdResult.user });
    expect(tenantServiceMocks.create).toHaveBeenCalledTimes(1);
    expect(telemetryMocks.trackUserSignedUp).toHaveBeenCalledTimes(1);
    expect(telemetryMocks.trackUserSignedUp).toHaveBeenCalledWith('supabase-user-1', {
      plan: 'starter',
      locale: 'en',
    });
  });
});
