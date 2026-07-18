export type CompatibilityProfile = {
  id: string;
  tenantId: string;
  tenantStatus: string;
  role: string;
};

export type CompatibilityDecision =
  | { kind: 'none' }
  | { kind: 'deny'; status: 403 | 410; reason: string }
  | { kind: 'redirect'; status: 301; destination: string };

const SOURCE_BOOKMARK = new Set(['bookmark']);
const PLATFORM_PATHS: Record<string, string> = {
  '/platform-admin/ai-profitability': '/superadmin/ai-profitability',
  '/platform-admin/ai-usage': '/superadmin/ai-usage',
  '/platform-admin/audit-logs': '/superadmin/audit-logs',
  '/platform-admin/beta': '/superadmin/beta',
  '/platform-admin/billing': '/superadmin/billing',
  '/platform-admin/founder': '/superadmin/founder',
  '/platform-admin/funnels': '/superadmin/funnels',
  '/platform-admin/growth': '/superadmin/growth',
  '/platform-admin/health': '/superadmin/health',
  '/platform-admin/revenue': '/superadmin/revenue',
  '/platform-admin/tenant-health': '/superadmin/tenant-health',
  '/platform-admin/tenants': '/superadmin/tenants',
  '/platform-admin/users': '/superadmin/users',
  '/admin-command': '/superadmin/command',
  '/admin/launch-readiness': '/superadmin/launch-readiness',
};
const WORKSPACE_SUFFIXES = new Set([
  'approvals', 'beta', 'billing', 'content', 'daily-actions', 'feedback',
  'funnels', 'journey', 'members', 'operations', 'plan', 'settings', 'team',
  'templates', 'training', 'users',
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCompatibilityPath(pathname: string): boolean {
  return pathname === '/platform-admin' || pathname in PLATFORM_PATHS ||
    pathname === '/admin/ai-templates' || pathname === '/team' ||
    pathname === '/team/members' || pathname === '/team/growth' ||
    pathname === '/workspace' || pathname.startsWith('/workspace/');
}

function withAllowedQuery(destination: string, source: URLSearchParams, allowMember: boolean): string {
  const query = new URLSearchParams();
  if (SOURCE_BOOKMARK.has(source.get('source') ?? '')) query.set('source', 'bookmark');
  const member = source.get('member');
  if (allowMember && member && UUID.test(member)) query.set('member', member);
  const serialized = query.toString();
  return serialized ? `${destination}?${serialized}` : destination;
}

export function resolveCompatibilityRequest(options: {
  pathname: string;
  searchParams: URLSearchParams;
  profile: CompatibilityProfile;
  memberQueryAuthorized?: boolean;
}): CompatibilityDecision {
  const { pathname, searchParams, profile } = options;
  if (!isCompatibilityPath(pathname)) return { kind: 'none' };
  if (profile.tenantStatus === 'deleted' && profile.role !== 'platform_admin') {
    return { kind: 'deny', status: 403, reason: 'TENANT_DELETED' };
  }

  if (pathname === '/platform-admin' || pathname in PLATFORM_PATHS) {
    if (profile.role !== 'platform_admin') return { kind: 'deny', status: 403, reason: 'FORBIDDEN' };
    let destination = PLATFORM_PATHS[pathname] ?? '/superadmin';
    if (pathname === '/platform-admin') {
      if (searchParams.get('view') === 'command') destination = '/superadmin/command';
      else if (searchParams.get('tab') === 'tenants') destination = '/superadmin/tenants';
    }
    return { kind: 'redirect', status: 301, destination: withAllowedQuery(destination, searchParams, false) };
  }

  if (pathname === '/team' || pathname === '/team/members') {
    if (!['leader', 'operator'].includes(profile.role)) return { kind: 'deny', status: 403, reason: 'FORBIDDEN' };
    const destination = pathname === '/team' ? '/admin/team' : '/admin/team/members';
    return { kind: 'redirect', status: 301, destination: withAllowedQuery(destination, searchParams, options.memberQueryAuthorized === true) };
  }
  if (pathname === '/team/growth') {
    if (profile.role !== 'operator') return { kind: 'deny', status: 403, reason: 'FORBIDDEN' };
    return { kind: 'redirect', status: 301, destination: withAllowedQuery('/admin/team', searchParams, false) };
  }

  if (pathname === '/admin/ai-templates') {
    if (profile.role !== 'operator') return { kind: 'deny', status: 403, reason: 'FORBIDDEN' };
    return { kind: 'redirect', status: 301, destination: withAllowedQuery('/admin/templates', searchParams, false) };
  }
  if (pathname === '/workspace' || pathname.startsWith('/workspace/')) {
    if (profile.role !== 'operator') return { kind: 'deny', status: 403, reason: 'FORBIDDEN' };
    if (pathname === '/workspace/launch-readiness') {
      return { kind: 'deny', status: 410, reason: 'WORKSPACE_COMPATIBILITY_NOT_APPROVED' };
    }
    const suffix = pathname.slice('/workspace/'.length);
    const destination = pathname === '/workspace'
      ? '/admin'
      : WORKSPACE_SUFFIXES.has(suffix) ? `/admin/${suffix}` : '/admin';
    return { kind: 'redirect', status: 301, destination: withAllowedQuery(destination, searchParams, false) };
  }
  return { kind: 'none' };
}
