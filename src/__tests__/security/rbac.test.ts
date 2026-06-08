import { describe, expect, it } from 'vitest';
import { requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import type { AuthUser } from '@/modules/auth/services/auth-service';

const member: AuthUser = {
  id: 'member-1',
  email: 'member@example.com',
  tenantId: 'tenant-1',
  role: 'member',
  name: 'Member',
  preferredLanguage: 'zh',
  status: 'active',
};

const leader: AuthUser = {
  ...member,
  id: 'leader-1',
  email: 'leader@example.com',
  role: 'leader',
};

describe('RBAC', () => {
  it('member cannot access admin routes', () => {
    expect(() => requireRoleApi(member, ['operator', 'platform_admin'])).toThrow();
  });

  it('member cannot change roles', () => {
    expect(() => requireRoleApi(member, ['operator', 'platform_admin'])).toThrow();
  });

  it('leader cannot access platform admin', () => {
    expect(() => requireRoleApi(leader, ['platform_admin'])).toThrow();
  });

  it('member cannot approve members', () => {
    expect(() => requireRoleApi(member, ['leader', 'operator', 'platform_admin'])).toThrow();
  });
});
