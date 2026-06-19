import type { ReferralProjection, ReferralRisk } from '../contracts/ReferralProjection';
import type { ReferralFacts } from './referral-facts';

export function isAdvocacyReady(readiness: ReferralProjection['referralReadiness']) {
  return readiness === 'ready' || readiness === 'advocate' || readiness === 'champion';
}

export function detectReferralRisks(facts: ReferralFacts, readiness: ReferralProjection['referralReadiness']): ReferralRisk[] {
  const risks: ReferralRisk[] = [];

  if (facts.valueProjection.valueRisk !== 'low') {
    risks.push({
      code: 'referral_value_not_proven',
      title: 'Value not proven enough for referral',
      reason: 'Referral asks should wait until the user has achieved a meaningful business result.',
      route: facts.valueProjection.recommendedValueAction.route,
      priority: 'high',
    });
  }

  if (facts.retentionProjection.retentionRisk !== 'low') {
    risks.push({
      code: 'referral_retention_weak',
      title: 'Retention signal is weak',
      reason: 'The user is not active enough to confidently ask for advocacy or referrals.',
      route: facts.retentionProjection.reEngagement.route,
      priority: facts.retentionProjection.retentionRisk,
    });
  }

  if (isAdvocacyReady(readiness) && facts.referralInvitesCreated === 0) {
    risks.push({
      code: 'referral_path_missing',
      title: 'Referral path missing',
      reason: 'The user is ready for advocacy but has no invite or referral path configured.',
      route: '/team/growth',
      priority: 'medium',
    });
  }

  if (facts.negativeSatisfactionSignals > facts.positiveSatisfactionSignals) {
    risks.push({
      code: 'referral_satisfaction_risk',
      title: 'Customer satisfaction risk',
      reason: 'Negative satisfaction signals are higher than positive signals, so referral asks may feel premature.',
      route: '/customers',
      priority: 'medium',
    });
  }

  return risks.slice(0, 3);
}
