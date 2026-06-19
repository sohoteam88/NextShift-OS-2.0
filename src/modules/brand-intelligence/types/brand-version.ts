import type { BrandDNA as BrandProfile } from '@/modules/brand-dna/types';

export interface BrandVersionSnapshot {
  id: string;
  version: number;
  createdAt: string;
  label: string;
  summary: string;
  changes: string[];
  data: BrandProfile;
}

export interface BrandVersionHistorySnapshot {
  versions: BrandVersionSnapshot[];
  currentVersionId: string | null;
  totalVersions: number;
  retentionLimit: number;
}
