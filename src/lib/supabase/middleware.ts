import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  isCompatibilityPath,
  resolveCompatibilityRequest,
} from '@/lib/navigation/compatibility-policy';

type UpdateSessionOptions = {
  requestHeaders?: Headers;
};

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
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, tenant_id, role, status')
      .eq('id', user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!dbUser) return new NextResponse('Unauthorized', { status: 401 });
    const { data: tenant } = await supabase
      .from('tenants')
      .select('status')
      .eq('id', dbUser.tenant_id)
      .maybeSingle();
    if (!tenant) return new NextResponse('Unauthorized', { status: 401 });

    let memberQueryAuthorized = false;
    const member = request.nextUrl.searchParams.get('member');
    if (member && (request.nextUrl.pathname === '/team' || request.nextUrl.pathname === '/team/members')) {
      const { data: target } = await supabase
        .from('users')
        .select('id, tenant_id, sponsor_id')
        .eq('id', member)
        .eq('tenant_id', dbUser.tenant_id)
        .is('deleted_at', null)
        .maybeSingle();
      memberQueryAuthorized = Boolean(target && (
        dbUser.role === 'operator' || target.id === dbUser.id || target.sponsor_id === dbUser.id
      ));
    }

    const decision = resolveCompatibilityRequest({
      pathname: request.nextUrl.pathname,
      searchParams: request.nextUrl.searchParams,
      profile: {
        id: dbUser.id,
        tenantId: dbUser.tenant_id,
        tenantStatus: tenant.status,
        role: dbUser.role,
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
