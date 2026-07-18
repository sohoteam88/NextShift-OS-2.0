import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  isCompatibilityPath,
  resolveCompatibilityRequest,
} from '@/lib/navigation/compatibility-policy';

type UpdateSessionOptions = {
  requestHeaders?: Headers;
};

type CompatibilityAuthUser = {
  id: string;
  tenantId: string;
  tenantStatus: string;
  role: string;
  status: string;
};

async function loadCompatibilityAuthUser(
  request: NextRequest,
  expectedAuthUserId: string,
): Promise<CompatibilityAuthUser | null> {
  const profileUrl = request.nextUrl.clone();
  profileUrl.pathname = '/api/v1/auth/me';
  profileUrl.search = '';
  const cookie = request.cookies
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  try {
    const response = await fetch(profileUrl, {
      method: 'GET',
      headers: { accept: 'application/json', cookie },
      cache: 'no-store',
      redirect: 'manual',
    });
    if (!response.ok) return null;
    const body = await response.json() as { data?: { user?: Partial<CompatibilityAuthUser> } };
    const profile = body.data?.user;
    if (
      profile?.id !== expectedAuthUserId ||
      typeof profile.tenantId !== 'string' ||
      typeof profile.tenantStatus !== 'string' ||
      typeof profile.role !== 'string' ||
      profile.status !== 'active'
    ) return null;
    return profile as CompatibilityAuthUser;
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest, options: UpdateSessionOptions = {}) {
  const requestHeaders = options.requestHeaders ?? new Headers(request.headers);
  const publicPaths = [
    '/login',
    '/register',
    '/signup',
    '/auth/callback',
    '/setup-workspace',
    '/join',
    '/pending',
    '/api/v1/health',
    '/api/v1/tenant/check-slug',
  ];
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isTenantFunnel = request.nextUrl.pathname.match(/^\/[^/]+\/funnel\//);
  const isApiPath = request.nextUrl.pathname.startsWith('/api/');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicPath || isTenantFunnel || isApiPath) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isApiPath) {
    return supabaseResponse;
  }

  if (!user && !isPublicPath && !isTenantFunnel) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isCompatibilityPath(request.nextUrl.pathname)) {
    const profile = await loadCompatibilityAuthUser(request, user.id);
    if (!profile) return new NextResponse('Unauthorized', { status: 401 });

    let memberQueryAuthorized = false;
    const member = request.nextUrl.searchParams.get('member');
    if (member && (request.nextUrl.pathname === '/team' || request.nextUrl.pathname === '/team/members')) {
      // Member selection is not accepted from a compatibility query unless an
      // operator owns the session. Other relationship checks remain on the
      // canonical tenant-scoped page instead of trusting an old bookmark.
      memberQueryAuthorized = profile.role === 'operator';
    }

    const decision = resolveCompatibilityRequest({
      pathname: request.nextUrl.pathname,
      searchParams: request.nextUrl.searchParams,
      profile: {
        id: profile.id,
        tenantId: profile.tenantId,
        tenantStatus: profile.tenantStatus,
        role: profile.role,
      },
      memberQueryAuthorized,
    });
    if (decision.kind === 'deny') {
      if (decision.reason === 'TENANT_DELETED') await supabase.auth.signOut({ scope: 'local' });
      return new NextResponse(decision.reason, { status: decision.status });
    }
    if (decision.kind === 'redirect') {
      const destination = request.nextUrl.clone();
      const [pathname, query = ''] = decision.destination.split('?', 2);
      destination.pathname = pathname;
      destination.search = query;
      const redirectResponse = NextResponse.redirect(destination, decision.status);
      for (const cookie of supabaseResponse.cookies.getAll()) redirectResponse.cookies.set(cookie);
      return redirectResponse;
    }
  }

  return supabaseResponse;
}
