import { describe, expect, it } from 'vitest';
import { resolveCompatibilityRequest, type CompatibilityProfile } from './compatibility-policy';

const profile = (role: string, tenantStatus = 'active'): CompatibilityProfile => ({
  id: '10000000-0000-4000-8000-000000000001', tenantId: 'tenant', role, tenantStatus,
});
const decide = (pathname: string, query: string, role: string, memberQueryAuthorized = false) =>
  resolveCompatibilityRequest({ pathname, searchParams: new URLSearchParams(query), profile: profile(role), memberQueryAuthorized });

describe('authorization-first terminal compatibility redirects', () => {
  it('maps all platform legacy selectors directly to terminal superadmin routes', () => {
    expect(decide('/platform-admin', 'view=command&evil=/admin', 'platform_admin'))
      .toEqual({ kind: 'redirect', status: 301, destination: '/superadmin/command' });
    expect(decide('/platform-admin', 'tab=tenants&source=bookmark', 'platform_admin'))
      .toEqual({ kind: 'redirect', status: 301, destination: '/superadmin/tenants?source=bookmark' });
  });

  it('denies cross-space roles before disclosing a redirect', () => {
    expect(decide('/platform-admin/users', '', 'operator')).toMatchObject({ kind: 'deny', status: 403 });
    expect(decide('/team', '', 'platform_admin')).toMatchObject({ kind: 'deny', status: 403 });
    expect(decide('/workspace', '', 'leader')).toMatchObject({ kind: 'deny', status: 403 });
  });

  it('preserves only validated team-detail member UUID and bookmark source', () => {
    const member = '20000000-0000-4000-8000-000000000001';
    expect(decide('/team/members', `member=${member}&source=bookmark&next=https://evil.test`, 'leader', true))
      .toEqual({ kind: 'redirect', status: 301, destination: `/admin/team/members?source=bookmark&member=${member}` });
    expect(decide('/team/members', `member=${member}`, 'leader', false))
      .toEqual({ kind: 'redirect', status: 301, destination: '/admin/team/members' });
  });

  it('fails closed for unapproved workspace suffix and launch-readiness', () => {
    expect(decide('/workspace/launch-readiness', '', 'operator'))
      .toEqual({ kind: 'deny', status: 410, reason: 'WORKSPACE_COMPATIBILITY_NOT_APPROVED' });
    expect(decide('/workspace/unknown', '', 'operator'))
      .toEqual({ kind: 'redirect', status: 301, destination: '/admin' });
  });

  it('rejects deleted tenant roles while preserving platform forensic authority', () => {
    expect(resolveCompatibilityRequest({ pathname: '/team', searchParams: new URLSearchParams(), profile: profile('operator', 'deleted') }))
      .toMatchObject({ kind: 'deny', reason: 'TENANT_DELETED' });
    expect(resolveCompatibilityRequest({ pathname: '/platform-admin/tenants', searchParams: new URLSearchParams(), profile: profile('platform_admin', 'deleted') }))
      .toMatchObject({ kind: 'redirect', destination: '/superadmin/tenants' });
  });
});
