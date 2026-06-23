import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BASE_DOMAIN = (process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'nextshift.app').toLowerCase();

export function isAllowedOrigin(origin: string | null, baseDomain = DEFAULT_BASE_DOMAIN): boolean {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return true;
    return host === baseDomain || host.endsWith(`.${baseDomain}`);
  } catch {
    return false;
  }
}

export function getSecurityHeaders(): Record<string, string> {
  const scriptSrc =
    process.env.NODE_ENV === 'development'
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "media-src 'self' blob:",
    ].join('; '),
    'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
  };
}

function appendHeader(response: NextResponse, key: string, value: string) {
  response.headers.set(key, value);
}

export function applySecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    appendHeader(response, key, value);
  }

  const origin = request.headers.get('origin');
  if (request.nextUrl.pathname.startsWith('/api/') && isAllowedOrigin(origin)) {
    appendHeader(response, 'Access-Control-Allow-Origin', origin!);
    appendHeader(response, 'Access-Control-Allow-Credentials', 'true');
    appendHeader(response, 'Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    appendHeader(response, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Tenant-Slug');
    appendHeader(response, 'Vary', 'Origin');
  }

  return response;
}

export function createCorsPreflightResponse(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  if (!request.nextUrl.pathname.startsWith('/api/') || request.method !== 'OPTIONS' || !isAllowedOrigin(origin)) {
    return null;
  }

  const response = new NextResponse(null, { status: 204 });
  return applySecurityHeaders(request, response);
}
