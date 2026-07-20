export const MEMBER_DESKTOP_BREAKPOINT_PX = 1280;

export type ShellRole = 'member' | 'leader' | 'operator' | 'platform_admin';

export function isMemberFacingRole(role: string): role is 'member' | 'leader' {
  return role === 'member' || role === 'leader';
}

export function memberNavigationProjection(width: number) {
  return width < MEMBER_DESKTOP_BREAKPOINT_PX ? 'mobile' : 'desktop';
}
