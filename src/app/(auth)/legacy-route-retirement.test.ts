import { describe, expect, it } from 'vitest';
import { isRetiredUserShellRoute } from '@/middleware';

describe('legacy user-shell route retirement registry', () => {
  it.each([
    '/crm',
    '/crm/e2e-fixture',
    '/crm-center',
    '/customers',
    '/leads',
    '/sales',
    '/mission',
    '/mission/e2e-fixture',
    '/revenue-drivers',
    '/revenue-drivers/e2e-fixture',
    '/traffic-engine',
    '/traffic-engine/e2e-fixture',
  ])('recognizes %s as retired', (pathname) => {
    expect(isRetiredUserShellRoute(pathname)).toBe(true);
  });

  it.each(['/dashboard', '/post', '/follow', '/ads', '/superadmin'])('does not retire %s', (pathname) => {
    expect(isRetiredUserShellRoute(pathname)).toBe(false);
  });
});
