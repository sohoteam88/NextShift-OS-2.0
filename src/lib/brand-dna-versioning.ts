/**
 * Version rules shared by generated artifacts and their display surfaces.
 *
 * Older records pre-date version stamping. They are treated as version 1 so
 * that a newer Brand DNA version can surface a clear stale-output warning
 * without requiring a database migration.
 */
export const LEGACY_BRAND_DNA_VERSION = 1;

export function resolveBrandDnaVersion(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : LEGACY_BRAND_DNA_VERSION;
}

export function isBrandDnaArtifactStale(
  artifactVersion: unknown,
  currentVersion: unknown,
): boolean {
  return (
    resolveBrandDnaVersion(artifactVersion) <
    resolveBrandDnaVersion(currentVersion)
  );
}
