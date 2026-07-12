import { describe, expect, it } from 'vitest';
import { getRequestIp } from './request-ip';

describe('getRequestIp', () => {
  it('uses the nginx-provided real IP instead of a forged forwarded IP', () => {
    const headers = new Headers({
      'x-real-ip': '198.51.100.10',
      'x-forwarded-for': '203.0.113.99, 198.51.100.10',
    });

    expect(getRequestIp(headers, { NODE_ENV: 'production' })).toBe('198.51.100.10');
  });

  it('does not trust a forwarded IP in production when the trusted header is absent', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.99' });

    expect(getRequestIp(headers, { NODE_ENV: 'production' })).toBe('unknown');
  });

  it('uses the first forwarded IP only as a local-development fallback', () => {
    const headers = new Headers({ 'x-forwarded-for': '127.0.0.1, 10.0.0.2' });

    expect(getRequestIp(headers, { NODE_ENV: 'test' })).toBe('127.0.0.1');
  });
});
