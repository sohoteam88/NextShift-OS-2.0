import { describe, expect, it } from 'vitest';
import {
  buildCompatibilityDestination,
  resolveWorkspaceCompatibilityPath,
} from './compatibility-redirect';
import {
  resolveAnalyticsPeriod,
  resolveAnalyticsView,
  resolveBrandView,
  resolveCrmView,
  resolveFunnelView,
  resolveVideoView,
} from './merged-capability-views';

const mergeRoutes = {
  'admin-command': '/platform-admin?view=command',
  analytics: '/analytics-center?view=role',
  'brand-discovery': '/brand-builder/profile?view=discovery',
  'brand-dna': '/brand-builder/profile?view=dna',
  'crm-center': '/crm?view=dashboard',
  'funnel-context': '/funnel?view=context',
  leads: '/crm?view=leads',
  sales: '/crm?view=sales',
  'video-production': '/video?view=production',
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

describe('OS 3.8 compatibility redirects', () => {
  it('preserves scalar and repeated query parameters', () => {
    expect(buildCompatibilityDestination('/crm', { source: 'bookmark', tag: ['a', 'b'] }))
      .toBe('/crm?source=bookmark&tag=a&tag=b');
  });

  it('does not let source query replace destination-owned intent', () => {
    expect(buildCompatibilityDestination('/platform-admin?view=command', { view: 'other', from: 'legacy' }))
      .toBe('/platform-admin?view=command&from=legacy');
    expect(buildCompatibilityDestination('/platform-admin?tab=tenants', { view: 'command', tab: 'other' }))
      .toBe('/platform-admin?tab=tenants');
    expect(buildCompatibilityDestination('/crm?view=leads', { view: 'sales', tab: 'other', source: 'bookmark' }))
      .toBe('/crm?view=leads&source=bookmark');
  });

  it('rejects external and protocol-relative destinations', () => {
    expect(() => buildCompatibilityDestination('https://example.com')).toThrow();
    expect(() => buildCompatibilityDestination('//example.com')).toThrow();
  });

  it('defines nine approved Merge sources with destination-owned terminal views', () => {
    expect(Object.keys(mergeRoutes)).toHaveLength(9);
    expect(new Set(Object.values(mergeRoutes)).size).toBe(9);
    expect(Object.values(mergeRoutes).every((destination) => destination.startsWith('/') && !destination.includes('://'))).toBe(true);
  });

  it('defines the fixed compatibility contract with internal destinations', () => {
    expect(Object.keys(compatibilityRoutes)).toHaveLength(21);
    expect(Object.values(compatibilityRoutes).every((destination) => destination.startsWith('/') && !destination.includes('://'))).toBe(true);
  });

  it('keeps the workspace catch-all on an explicit one-segment allowlist', () => {
    expect(resolveWorkspaceCompatibilityPath(['templates'])).toBe('/admin/templates');
    expect(resolveWorkspaceCompatibilityPath(['members'])).toBe('/admin/members');
    expect(resolveWorkspaceCompatibilityPath(['unknown'])).toBe('/admin');
    expect(resolveWorkspaceCompatibilityPath(['templates', 'nested'])).toBe('/admin');
  });

  it('resolves only explicit destination-owned capability view states', () => {
    expect(resolveAnalyticsView('role')).toBe('role');
    expect(resolveAnalyticsView('forged')).toBe('overview');
    expect(resolveBrandView('discovery')).toBe('discovery');
    expect(resolveBrandView('dna')).toBe('dna');
    expect(resolveBrandView('forged')).toBe('profile');
    expect(resolveCrmView('dashboard')).toBe('dashboard');
    expect(resolveCrmView('leads')).toBe('leads');
    expect(resolveCrmView('sales')).toBe('sales');
    expect(resolveCrmView('forged')).toBe('mission');
    expect(resolveFunnelView('context')).toBe('context');
    expect(resolveFunnelView('forged')).toBe('builder');
    expect(resolveVideoView('production')).toBe('production');
    expect(resolveVideoView('forged')).toBe('projects');
  });

  it('normalizes role analytics periods without accepting arbitrary query values', () => {
    expect(resolveAnalyticsPeriod('7d')).toBe('7d');
    expect(resolveAnalyticsPeriod('90d')).toBe('90d');
    expect(resolveAnalyticsPeriod('all-time')).toBe('30d');
  });
});
