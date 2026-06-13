import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type UpdateSessionOptions = {
  requestHeaders?: Headers;
};

export async function updateSession(request: NextRequest, options: UpdateSessionOptions = {}) {
  const requestHeaders = options.requestHeaders ?? new Headers(request.headers);
  const publicPaths = ['/login', '/register', '/signup', '/join', '/pending', '/api/v1/health', '/api/v1/tenant/check-slug'];
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

  return supabaseResponse;
}
