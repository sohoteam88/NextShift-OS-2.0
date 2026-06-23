import type { ActivationProjection } from '@/modules/activation/contracts/ActivationProjection';
import type { UserSuccessProjection } from '@/modules/user-success/contracts/UserSuccessProjection';
import type { RetentionProjection } from '@/modules/retention/contracts/RetentionProjection';
import type { ExpansionProjection } from '@/modules/expansion/contracts/ExpansionProjection';
import type { ReferralProjection } from '@/modules/referral/contracts/ReferralProjection';

export type CustomerHealthFacts = {
  generatedAt: string;
  activationProjection: ActivationProjection;
  userSuccessProjection: UserSuccessProjection;
  retentionProjection: RetentionProjection;
  expansionProjection: ExpansionProjection;
  referralProjection: ReferralProjection;
  previousHealthScore?: number | null;
  locale?: string | null;
  personalization?: {
    audience?: string | null;
    offer?: string | null;
    businessModel?: string | null;
    stage?: string | null;
  };
};
