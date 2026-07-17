import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ROUTES,
  getMemberNavigationLabel,
  isMemberNavigationActive,
  MEMBER_MOBILE_PRIMARY_IDS,
  MEMBER_MORE_NAVIGATION,
  MEMBER_PRIMARY_NAVIGATION,
} from './canonical-routes';

describe('OS 3.8 canonical member navigation', () => {
  it('projects the seven desktop destinations in the approved order', () => {
    expect(MEMBER_PRIMARY_NAVIGATION.map(({ id, href }) => ({ id, href }))).toEqual([
      { id: 'today', href: '/dashboard' },
      { id: 'journey', href: '/journey' },
      { id: 'brand', href: '/brand-builder/profile' },
      { id: 'content', href: '/content-engine' },
      { id: 'growth', href: '/revenue-drivers' },
      { id: 'relationships', href: '/crm' },
      { id: 'team', href: '/ai-workforce' },
    ]);
  });

  it('projects the four persistent mobile destinations before More', () => {
    expect(MEMBER_MOBILE_PRIMARY_IDS).toEqual(['today', 'content', 'growth', 'relationships']);
  });

  it('puts Journey, Brand, Team and utilities in More', () => {
    expect(MEMBER_MORE_NAVIGATION.map(({ id, href }) => ({ id, href }))).toEqual([
      { id: 'journey', href: '/journey' },
      { id: 'brand', href: '/brand-builder/profile' },
      { id: 'team', href: '/ai-workforce' },
      { id: 'settings', href: '/settings' },
      { id: 'billing', href: '/billing' },
      { id: 'help', href: '/help' },
    ]);
  });

  it('keeps route identity identical across workspace modes', () => {
    const hrefs = MEMBER_PRIMARY_NAVIGATION.map((item) => item.href);
    expect(hrefs).toEqual(MEMBER_PRIMARY_NAVIGATION.map((item) => item.href));
    const relationships = MEMBER_PRIMARY_NAVIGATION.find((item) => item.id === 'relationships')!;
    expect(getMemberNavigationLabel(relationships, 'en', 'retail')).toBe('Customers');
    expect(getMemberNavigationLabel(relationships, 'en', 'recruitment')).toBe('Prospects');
    expect(relationships.href).toBe('/crm');
  });

  it('marks exact and nested routes active without sibling false positives', () => {
    expect(isMemberNavigationActive('/content-engine', '/content-engine')).toBe(true);
    expect(isMemberNavigationActive('/content-engine/library', '/content-engine')).toBe(true);
    expect(isMemberNavigationActive('/content-engineering', '/content-engine')).toBe(false);
  });

  it('keeps Content Engine and the canonical Content Library under one destination', () => {
    expect(MEMBER_PRIMARY_NAVIGATION.find((item) => item.id === 'content')?.href)
      .toBe(CANONICAL_ROUTES.contentEngine);
  });

  it('uses the member AI workforce route for Team', () => {
    expect(MEMBER_PRIMARY_NAVIGATION.find((item) => item.id === 'team')?.href)
      .toBe('/ai-workforce');
  });

  it('does not expose approved hidden or privileged routes in member navigation', () => {
    const allMemberHrefs = [
      ...MEMBER_PRIMARY_NAVIGATION.map((item) => item.href),
      ...MEMBER_MORE_NAVIGATION.map((item) => item.href),
    ];
    for (const hidden of ['/automation', '/blueprints', '/franchise', '/localization', '/saas']) {
      expect(allMemberHrefs).not.toContain(hidden);
    }
    for (const privileged of ['/team', '/team/members', '/admin/team', '/admin-command', '/platform-admin']) {
      expect(allMemberHrefs).not.toContain(privileged);
    }
  });
});
