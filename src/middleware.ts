import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { isReservedSlug } from '@/modules/tenant/utils/slug';
import { applySecurityHeaders, createCorsPreflightResponse } from '@/lib/security';

export async function middleware(request: NextRequest) {
  const preflight = createCorsPreflightResponse(request);
  if (preflight) {
    return preflight;
  }

  const host = (request.headers.get('host') ?? request.nextUrl.host).split(':')[0].toLowerCase();
  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'nextshift.app').toLowerCase();
  const baseDomainSuffix = `.${baseDomain}`;
  const hasBaseDomain = host === baseDomain || host.endsWith(baseDomainSuffix);

  let subdomain: string | null = null;
  if (hasBaseDomain && host !== baseDomain) {
    subdomain = host.slice(0, -baseDomainSuffix.length) || null;
  }

  const isTenantSubdomain = Boolean(subdomain && subdomain !== 'app' && !isReservedSlug(subdomain));
  const requestHeaders = new Headers(request.headers);

  if (isTenantSubdomain && subdomain) {
    requestHeaders.set('x-tenant-slug', subdomain);
  }

  const response = await updateSession(request, { requestHeaders });

  if (isTenantSubdomain && subdomain) {
    response.headers.set('x-tenant-slug', subdomain);
    response.cookies.set('tenant-slug', subdomain, { path: '/' });
  }

  return applySecurityHeaders(request, response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
