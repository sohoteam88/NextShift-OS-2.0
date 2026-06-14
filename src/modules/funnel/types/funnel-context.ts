import type { BrandContext } from '@/modules/brand-dna/types';

export type BusinessFunnelType = 'retail' | 'recruitment' | 'upgrade';

export interface FunnelContext {
  funnelType: BusinessFunnelType;
  audience: string;
  painPoints: string[];
  goals: string[];
  positioning: string;
  offer: string;
  contentPillars: Array<{ name: string; emoji: string; percentage: number; description: string }>;
  cta: string;
  webinarTheme: string;
  leadMagnetTheme: string;
  videoTheme: string;
  salesApproach: string;
  // Inherited from Brand DNA
  brandDNA: BrandContext | null;
}

export interface FunnelContextMap {
  retail: FunnelContext | null;
  recruitment: FunnelContext | null;
  upgrade: FunnelContext | null;
}
