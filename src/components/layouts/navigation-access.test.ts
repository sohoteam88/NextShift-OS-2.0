import { describe, expect, it } from 'vitest';
import {
  MEMBER_DESKTOP_BREAKPOINT_PX,
  isMemberFacingRole,
  memberNavigationProjection,
  shouldShowMobileTabBar,
} from './navigation-access';

describe('member navigation access and responsive projection', () => {
  it('gives member-facing navigation to members and leaders only', () => {
    expect(isMemberFacingRole('member')).toBe(true);
    expect(isMemberFacingRole('leader')).toBe(true);
    expect(isMemberFacingRole('operator')).toBe(false);
    expect(isMemberFacingRole('platform_admin')).toBe(false);
  });

  it('has no projection vacuum around the 1280px desktop boundary', () => {
    expect(MEMBER_DESKTOP_BREAKPOINT_PX).toBe(1280);
    expect(memberNavigationProjection(1023)).toBe('mobile');
    expect(memberNavigationProjection(1024)).toBe('mobile');
    expect(memberNavigationProjection(1279)).toBe('mobile');
    expect(memberNavigationProjection(1280)).toBe('desktop');
    expect(memberNavigationProjection(1281)).toBe('desktop');
  });

  it('hides mobile navigation on the user-shell placeholder routes', () => {
    for (const pathname of ['/post', '/follow', '/ads']) {
      expect(shouldShowMobileTabBar('member', pathname)).toBe(false);
    }
    expect(shouldShowMobileTabBar('member', '/dashboard')).toBe(true);
  });
});
