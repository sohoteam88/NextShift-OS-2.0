import { redirect } from 'next/navigation';

export type RedirectSearchParams = Record<string, string | string[] | undefined>;
export type RedirectPageProps = {
  readonly searchParams?: Promise<RedirectSearchParams>;
};

export function buildCompatibilityDestination(
  destination: string,
  searchParams: RedirectSearchParams = {},
) {
  if (!destination.startsWith('/') || destination.startsWith('//')) {
    throw new Error('Compatibility redirect destination must be an internal absolute path');
  }

  const [pathname, existingQuery = ''] = destination.split('?', 2);
  const query = new URLSearchParams(existingQuery);

  for (const [key, rawValue] of Object.entries(searchParams)) {
    if (rawValue === undefined) continue;
    // A destination-owned key (for example `view=command`) is an authority
    // boundary and cannot be replaced by an untrusted source query.
    if (query.has(key)) continue;
    query.delete(key);
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) query.append(key, value);
  }

  const serialized = query.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}

export function createCompatibilityRedirect(destination: string) {
  return async function CompatibilityRedirectPage({ searchParams }: RedirectPageProps = {}) {
    // Keep direct invocation compatible with existing page-level unit tests.
    if (!searchParams) redirect(buildCompatibilityDestination(destination));
    redirect(buildCompatibilityDestination(destination, await searchParams));
  };
}

export const WORKSPACE_ADMIN_SUFFIXES = new Set([
  'approvals',
  'beta',
  'billing',
  'content',
  'daily-actions',
  'feedback',
  'funnels',
  'journey',
  'launch-readiness',
  'members',
  'operations',
  'plan',
  'settings',
  'team',
  'templates',
  'training',
  'users',
]);

export function resolveWorkspaceCompatibilityPath(path: readonly string[]) {
  if (path.length !== 1 || !WORKSPACE_ADMIN_SUFFIXES.has(path[0])) return '/admin';
  return `/admin/${path[0]}`;
}
