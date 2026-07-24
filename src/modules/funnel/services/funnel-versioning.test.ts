import { describe, expect, it } from 'vitest';
import { shouldShowPublishedFunnelStaleBanner } from './funnel-versioning';

describe('published funnel Brand DNA versioning', () => {
  it('shows a banner for a published asset generated from an older version', () => {
    expect(shouldShowPublishedFunnelStaleBanner('/f/old-page', 1, 2)).toBe(true);
  });

  it('does not warn for a draft even when its content is old', () => {
    expect(shouldShowPublishedFunnelStaleBanner(undefined, 1, 2)).toBe(false);
  });

  it('does not warn when the published asset matches current Brand DNA', () => {
    expect(shouldShowPublishedFunnelStaleBanner('/f/current-page', 2, 2)).toBe(false);
  });

  it('treats an unstamped published asset as legacy v1', () => {
    expect(shouldShowPublishedFunnelStaleBanner('/f/legacy-page', undefined, 2)).toBe(true);
  });
});
