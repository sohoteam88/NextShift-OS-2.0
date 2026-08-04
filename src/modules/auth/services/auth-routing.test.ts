import { describe, expect, it } from 'vitest';
import { homeRouteForRole } from './auth-routing';

describe('homeRouteForRole', () => {
  it('sends members to the user-shell home', () => {
    expect(homeRouteForRole('member')).toBe('/');
  });

  it('keeps admin destinations unchanged', () => {
    expect(homeRouteForRole('operator')).toBe('/admin');
    expect(homeRouteForRole('platform_admin')).toBe('/superadmin');
  });
});
