import type { ReferralProjection, ReferralRisk } from '../contracts/ReferralProjection';
import type { ReferralFacts } from './referral-facts';

export function isAdvocacyReady(readiness: ReferralProjection['referralReadiness']) {
  return readiness === 'ready' || readiness === 'advocate' || readiness === 'ambassador' || readiness === 'champion';
}

export function detectReferralRisks(facts: ReferralFacts, readiness: ReferralProjection['referralReadiness']): ReferralRisk[] {
  const risks: ReferralRisk[] = [];

  if (facts.valueProjection.valueRisk !== 'low') {
    risks.push({
      code: 'referral_value_not_proven',
      riskCode: 'NO_SUCCESS_YET',
      title: 'Value not proven enough for referral',
      reason: 'Referral asks should wait until the user has achieved a meaningful business result.',
      route: facts.valueProjection.recommendedValueAction.route,
      priority: 'high',
    });
  }

  if (facts.retentionProjection.retentionRisk !== 'low') {
    risks.push({
      code: 'referral_retention_weak',
      riskCode: 'RETENTION_NOT_ACHIEVED',
      title: 'Retention signal is weak',
      reason: 'The user is not active enough to confidently ask for advocacy or referrals.',
      route: facts.retentionProjection.reEngagement.route,
      priority: facts.retentionProjection.retentionRisk,
    });
  }

  if (!facts.retentionProjection.outcomeRetention.retained && facts.activatedReferrals === 0) {
    risks.push({
      code: 'referral_retention_not_achieved',
      riskCode: 'RETENTION_NOT_ACHIEVED',
      title: 'Retention not achieved',
      reason: 'Never ask unsuccessful or unretained users for referrals.',
      route: facts.retentionProjection.retentionRecovery.route,
      priority: 'high',
    });
  }

  if (isAdvocacyReady(readiness) && facts.referralInvitesCreated === 0) {
    risks.push({
      code: 'referral_path_missing',
      riskCode: 'REFERRAL_PATH_MISSING',
      title: 'Referral path missing',
      reason: 'The user is ready for advocacy but has no invite or referral path configured.',
      route: '/ai-workforce',
      priority: 'medium',
    });
  }

  if (facts.negativeSatisfactionSignals > facts.positiveSatisfactionSignals) {
    risks.push({
      code: 'referral_satisfaction_risk',
      riskCode: 'SATISFACTION_RISK',
      title: 'Customer satisfaction risk',
      reason: 'Negative satisfaction signals are higher than positive signals, so referral asks may feel premature.',
      route: '/customers',
      priority: 'medium',
    });
  }

  if ((facts.ignoredReferralRequests ?? 0) >= 3) {
    risks.push({
      code: 'referral_requests_ignored',
      riskCode: 'REFERRAL_REQUESTS_IGNORED',
      title: 'Referral requests ignored',
      reason: 'Recent referral requests were ignored. Reduce ask frequency and switch to helpful proof-sharing.',
      route: '/customers',
      priority: 'medium',
    });
  }

  return risks.slice(0, 3);
}
