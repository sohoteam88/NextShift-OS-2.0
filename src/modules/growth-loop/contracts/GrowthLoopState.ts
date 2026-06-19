import type { AcquisitionSignal } from './AcquisitionSignal';
import type { ActivationSignal } from './ActivationSignal';
import type { ExpansionSignal } from './ExpansionSignal';
import type {
  GrowthLoopScope,
  GrowthSignal,
  GrowthSignalConfidence,
  GrowthSignalRecommendation,
} from './GrowthSignal';
import type { ReferralSignal } from './ReferralSignal';
import type { RetentionSignal } from './RetentionSignal';

export type GrowthLoopHealth =
  | 'empty'
  | 'building'
  | 'active'
  | 'scaling'
  | 'blocked';

export interface GrowthLoopState {
  source: string;
  scope: GrowthLoopScope;
  confidence: GrowthSignalConfidence;
  fallback: string | 'none';

  subjectId: string;
  tenantId?: string;
  generatedAt: string;
  health: GrowthLoopHealth;
  overallScore: number;

  acquisition: AcquisitionSignal;
  activation: ActivationSignal;
  retention: RetentionSignal;
  referral: ReferralSignal;
  expansion: ExpansionSignal;

  signals: GrowthSignal[];
  recommendations: GrowthSignalRecommendation[];
}
