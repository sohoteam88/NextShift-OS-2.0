import type { BrandDNA as BrandProfile } from '@/modules/brand-dna/types';

export interface BrandRegenerationSnapshot {
  before: BrandProfile;
  after: BrandProfile;
  changedFields: string[];
  recommendations: string[];
}
