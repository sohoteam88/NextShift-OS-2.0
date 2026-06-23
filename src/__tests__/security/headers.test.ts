import { describe, expect, it } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';
import { applySecurityHeaders, getSecurityHeaders, isAllowedOrigin } from '@/lib/security';

describe('Security Headers', () => {
  it('sets Strict-Transport-Security', () => {
    expect(getSecurityHeaders()['Strict-Transport-Security']).toContain('max-age=31536000');
  });

  it('sets X-Content-Type-Options: nosniff', () => {
    expect(getSecurityHeaders()['X-Content-Type-Options']).toBe('nosniff');
  });

  it('sets X-Frame-Options: DENY', () => {
    expect(getSecurityHeaders()['X-Frame-Options']).toBe('DENY');
  });

  it('sets Referrer-Policy', () => {
    expect(getSecurityHeaders()['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('sets Content-Security-Policy', () => {
    expect(getSecurityHeaders()['Content-Security-Policy']).toContain("default-src 'self'");
  });

  it('does not allow eval in non-development CSP', () => {
    expect(getSecurityHeaders()['Content-Security-Policy']).not.toContain("'unsafe-eval'");
  });

  it('CORS only allows known origins', () => {
    expect(isAllowedOrigin('https://app.nextshift.app', 'nextshift.app')).toBe(true);
    expect(isAllowedOrigin('https://tenant.nextshift.app', 'nextshift.app')).toBe(true);
    expect(isAllowedOrigin('https://evil.example.com', 'nextshift.app')).toBe(false);
  });

  it('applies security headers to API responses', () => {
    const request = {
      nextUrl: new URL('https://app.nextshift.app/api/v1/health'),
      headers: new Headers({ origin: 'https://app.nextshift.app' }),
    } as NextRequest;

    const response = applySecurityHeaders(request, NextResponse.next());

    expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.nextshift.app');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });
});
