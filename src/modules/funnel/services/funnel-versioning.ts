import { isBrandDnaArtifactStale, resolveBrandDnaVersion } from '@/lib/brand-dna-versioning';

/**
 * Published funnel assets created before version stamping are legacy v1.
 * Drafts do not need a warning because they are not public assets yet.
 */
export function shouldShowPublishedFunnelStaleBanner(
  publicPath: unknown,
  artifactVersion: unknown,
  currentVersion: unknown,
): boolean {
  return Boolean(
    typeof publicPath === 'string' &&
      publicPath.length > 0 &&
      isBrandDnaArtifactStale(artifactVersion, currentVersion),
  );
}

export { resolveBrandDnaVersion };
