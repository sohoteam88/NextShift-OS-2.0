import { brandDnaService } from '@/modules/brand-dna/services/brandDnaService';
import type { BrandVersionHistorySnapshot, BrandVersionSnapshot } from '../types/brand-version';

const RETENTION_LIMIT = 20;

function getVersionId(version: number, createdAt: string): string {
  return `brand-version-${version}-${createdAt}`;
}

function buildVersionSummary(label: string, version: number): string {
  return `${label} snapshot for version ${version}.`;
}

function toVersionSnapshot(snapshot: Awaited<ReturnType<typeof brandDnaService.getVersions>>[number]): BrandVersionSnapshot {
  return {
    id: getVersionId(snapshot.version, snapshot.createdAt),
    version: snapshot.version,
    createdAt: snapshot.createdAt,
    label: snapshot.label ?? 'Auto-saved',
    summary: buildVersionSummary(snapshot.label ?? 'Auto-saved', snapshot.version),
    changes: [],
    data: snapshot.snapshot,
  };
}

export async function getBrandVersionHistorySnapshot(userId: string): Promise<BrandVersionHistorySnapshot> {
  const [versions, current] = await Promise.all([
    brandDnaService.getVersions(userId),
    brandDnaService.getBrandDNA(userId),
  ]);

  const projectedVersions = versions.map(toVersionSnapshot);
  const currentVersion = projectedVersions.find((version) => version.version === current.meta.version) ?? null;

  return {
    versions: projectedVersions,
    currentVersionId: currentVersion?.id ?? null,
    totalVersions: projectedVersions.length,
    retentionLimit: RETENTION_LIMIT,
  };
}
