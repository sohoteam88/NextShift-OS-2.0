export const MEMBER_DESKTOP_BREAKPOINT_PX = 1280;

export type ShellRole = 'member' | 'leader' | 'operator' | 'platform_admin';

export function isMemberFacingRole(role: string): role is 'member' | 'leader' {
  return role === 'member' || role === 'leader';
}

const USER_SHELL_PLACEHOLDER_PATHS = new Set(['/post', '/follow', '/ads']);

export function shouldShowMobileTabBar(role: string, pathname: string) {
  return isMemberFacingRole(role) && !USER_SHELL_PLACEHOLDER_PATHS.has(pathname);
}

export function memberNavigationProjection(width: number) {
  return width < MEMBER_DESKTOP_BREAKPOINT_PX ? 'mobile' : 'desktop';
}
