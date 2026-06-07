export const RESERVED_SLUGS = [
  'app',
  'api',
  'admin',
  'www',
  'mail',
  'ftp',
  'support',
  'help',
  'docs',
  'blog',
  'status',
  'billing',
  'login',
  'register',
  'signup',
  'join',
  'dashboard',
  'settings',
  'nextshift',
  'health',
  'test',
] as const;

export function generateSlug(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number]);
}

export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

export function suggestSlug(slug: string, attempt = 2): string {
  const base = normalizeSlug(slug).replace(/-\d+$/, '') || 'team';
  const maxLength = 30;
  const suffix = `-${attempt}`;
  const trimmedBase = base.slice(0, Math.max(1, maxLength - suffix.length));
  return `${trimmedBase}${suffix}`;
}
