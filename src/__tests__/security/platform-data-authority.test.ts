import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getAuthUser: vi.fn() }));
const query = vi.hoisted(() => vi.fn());
const db = vi.hoisted(() => new Proxy({}, {
  get: () => new Proxy({}, { get: () => query }),
}));

vi.mock('@/modules/auth/services/auth-service', () => ({ getAuthUser: auth.getAuthUser }));
vi.mock('@/lib/prisma', () => ({ default: db, prisma: db }));

import { platformOperatingService } from '@/modules/admin/services/platformOperatingService';
import { getPlatformStats } from '@/modules/admin/services/platform-stats';
import { getAICostBreakdown, getAIModelBreakdown } from '@/modules/admin/services/ai-analytics';
import { listAllUsers, getRecentAuditLogs, getPlatformHealthCounts } from '@/modules/admin/services/platform-health';
import { listTenants, getTenantDetail } from '@/modules/admin/services/tenant-management';
import { adminCommandService } from '@/modules/admin/services/adminCommandService';
import { listUsers } from '@/modules/admin/services/user-management';
import { saasService } from '@/modules/saas/saasService';

const principal = (role: string) => ({
  id: '10000000-0000-4000-8000-000000000001',
  email: `${role}@example.test`,
  tenantId: '20000000-0000-4000-8000-000000000001',
  role,
  name: role,
  preferredLanguage: 'en',
  status: 'active' as const,
});

const loaders: Array<[string, () => Promise<unknown>]> = [
  ['operating dashboard', () => platformOperatingService.getOperatingData()],
  ['platform stats', getPlatformStats],
  ['AI tenant costs', getAICostBreakdown],
  ['AI model costs', getAIModelBreakdown],
  ['platform users', () => listAllUsers()],
  ['platform audit log', () => getRecentAuditLogs()],
  ['platform health counts', getPlatformHealthCounts],
  ['tenant list', () => listTenants()],
  ['tenant detail', () => getTenantDetail('30000000-0000-4000-8000-000000000001')],
  ['founder command overview', () => adminCommandService.getOverview()],
  ['founder feature access', () => adminCommandService.getFeatureAccess('30000000-0000-4000-8000-000000000001')],
  ['cross-tenant API users', () => listUsers('ignored-actor-tenant', {}, { includeAllTenants: true })],
  ['manual override detail', () => saasService.getManualOverride('30000000-0000-4000-8000-000000000001')],
  ['override expiry warnings', () => saasService.getOverrideExpiryWarnings()],
];

describe('shared platform data authority', () => {
  beforeEach(() => {
    auth.getAuthUser.mockReset();
    query.mockReset();
  });

  for (const role of ['member', 'leader', 'operator']) {
    it(`${role}_cannot_execute_any_cross_tenant_loader`, async () => {
      auth.getAuthUser.mockResolvedValue(principal(role));
      for (const [name, load] of loaders) {
        await expect(load(), name).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
      }
      expect(query).not.toHaveBeenCalled();
    });
  }
});
