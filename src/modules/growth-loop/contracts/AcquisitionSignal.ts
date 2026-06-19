import type { GrowthSignal } from './GrowthSignal';

export type AcquisitionChannel =
  | 'content'
  | 'funnel'
  | 'lead_magnet'
  | 'traffic'
  | 'crm'
  | 'referral'
  | 'unknown';

export interface AcquisitionAsset {
  id: string;
  type: 'content' | 'funnel' | 'lead_magnet' | 'landing_page' | 'campaign';
  name: string;
  status: 'draft' | 'published' | 'active' | 'paused' | 'missing';
  route?: string;
}

export interface AcquisitionSignal extends GrowthSignal {
  domain: 'acquisition';
  channels: AcquisitionChannel[];
  assets: AcquisitionAsset[];
  leadCount: number;
  conversionRate?: number;
  primaryBottleneck?: string;
}
