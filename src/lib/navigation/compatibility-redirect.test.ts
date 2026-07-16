import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildCompatibilityDestination,
  resolveWorkspaceCompatibilityPath,
} from './compatibility-redirect';

const mergeRoutes = {
  'admin-command': '/platform-admin?view=command',
  analytics: '/analytics-center',
  'brand-discovery': '/brand-builder/profile',
  'brand-dna': '/brand-builder/profile',
  'crm-center': '/crm',
  'funnel-context': '/funnel',
  leads: '/crm',
  sales: '/crm',
  'video-production': '/video',
} as const;

const compatibilityRoutes = {
  'admin/ai-templates': '/admin/templates',
  workspace: '/admin',
  'ai': '/content-engine',
  'ai/brand-builder': '/brand-builder',
  'ai/content-plan': '/content-engine',
  'ai/funnel-builder': '/funnel',
  'ai/workforce': '/ai-workforce',
  'brand-builder/step/calendar': '/content-engine',
  'brand-builder/step/strategy': '/content-engine',
  'brand-builder/video-script': '/video',
  'social-setup': '/brand-builder',
  customers: '/crm',
  'funnel-builder': '/funnel',
  'team/growth': '/team',
  'onboarding/brand': '/brand-builder',
  'onboarding/goals': '/brand-builder',
  'onboarding/profile': '/brand-builder',
  'onboarding/complete': '/dashboard',
  'onboarding/first-content': '/content-engine',
  'onboarding/first-funnel': '/funnel',
  'platform-admin/tenants': '/platform-admin?tab=tenants',
} as const;

function pageSource(route: string) {
  return readFileSync(join(process.cwd(), 'src/app/(auth)', route, 'page.tsx'), 'utf8');
}

describe('OS 3.8 compatibility redirects', () => {
  it('preserves scalar and repeated query parameters', () => {
    expect(buildCompatibilityDestination('/crm', { source: 'bookmark', tag: ['a', 'b'] }))
      .toBe('/crm?source=bookmark&tag=a&tag=b');
  });

  it('does not let source query replace destination-owned intent', () => {
    expect(buildCompatibilityDestination('/platform-admin?view=command', { view: 'other', from: 'legacy' }))
      .toBe('/platform-admin?view=command&from=legacy');
  });

  it('rejects external and protocol-relative destinations', () => {
    expect(() => buildCompatibilityDestination('https://example.com')).toThrow();
    expect(() => buildCompatibilityDestination('//example.com')).toThrow();
  });

  it('maps every approved Merge source to its terminal Keep destination', () => {
    expect(Object.keys(mergeRoutes)).toHaveLength(9);
    for (const [route, destination] of Object.entries(mergeRoutes)) {
      expect(pageSource(route)).toContain(destination);
    }
  });

  it('maps every fixed compatibility source to its terminal Keep destination', () => {
    expect(Object.keys(compatibilityRoutes)).toHaveLength(21);
    for (const [route, destination] of Object.entries(compatibilityRoutes)) {
      expect(pageSource(route)).toContain(destination);
    }
  });

  it('keeps the workspace catch-all on an explicit one-segment allowlist', () => {
    expect(resolveWorkspaceCompatibilityPath(['templates'])).toBe('/admin/templates');
    expect(resolveWorkspaceCompatibilityPath(['members'])).toBe('/admin/members');
    expect(resolveWorkspaceCompatibilityPath(['unknown'])).toBe('/admin');
    expect(resolveWorkspaceCompatibilityPath(['templates', 'nested'])).toBe('/admin');
    expect(pageSource('workspace/[...path]')).toContain('resolveWorkspaceCompatibilityPath');
  });

  it('keeps privileged source role checks before Team and Founder redirects', () => {
    expect(pageSource('team/growth')).toContain("['operator', 'platform_admin'].includes(user.role)");
    expect(pageSource('admin-command')).toContain("user.role !== 'platform_admin'");
  });

  it('preserves Admin Command capability at the platform-admin destination', () => {
    const destination = pageSource('platform-admin');
    expect(destination).toContain("params?.view === 'command'");
    expect(destination).toContain('<AdminCommandDashboard />');
  });
});
