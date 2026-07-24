import { describe, expect, it } from 'vitest';
import {
  isBrandDnaArtifactStale,
  LEGACY_BRAND_DNA_VERSION,
  resolveBrandDnaVersion,
} from './brand-dna-versioning';

describe('Brand DNA artifact versioning', () => {
  it('treats an unstamped legacy artifact as version 1', () => {
    expect(resolveBrandDnaVersion(undefined)).toBe(LEGACY_BRAND_DNA_VERSION);
    expect(resolveBrandDnaVersion(null)).toBe(LEGACY_BRAND_DNA_VERSION);
    expect(resolveBrandDnaVersion('1')).toBe(LEGACY_BRAND_DNA_VERSION);
  });

  it('flags an artifact when its version is older than the current profile', () => {
    expect(isBrandDnaArtifactStale(undefined, 2)).toBe(true);
    expect(isBrandDnaArtifactStale(1, 2)).toBe(true);
    expect(isBrandDnaArtifactStale(2, 2)).toBe(false);
  });

  it('does not flag current or newer artifacts', () => {
    expect(isBrandDnaArtifactStale(3, 2)).toBe(false);
    expect(isBrandDnaArtifactStale(0, 1)).toBe(false);
  });

  it('falls back safely when the current profile version is absent', () => {
    expect(isBrandDnaArtifactStale(undefined, undefined)).toBe(false);
    expect(isBrandDnaArtifactStale(1, undefined)).toBe(false);
  });
});
