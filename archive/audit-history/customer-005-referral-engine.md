# CUSTOMER-005 Referral Engine

## Scope

Implemented the Referral Engine as the customer growth flywheel layer after expansion. The system now identifies who is likely to refer, when to ask, and which referral opportunity has the highest probability.

## Implemented

- Added canonical referral projection contract with `referralScore`, `referralReadiness`, `referralOpportunities`, `referralRisks`, `nextReferralMilestone`, referral signals, and KPIs.
- Added referral readiness stages:
  - Not Ready
  - Potential
  - Ready
  - Advocate
  - Champion
- Added referral scoring based on:
  - Value realization score
  - Expansion score
  - Retention score
  - Recent wins
  - Mission completion consistency
  - Customer satisfaction signals
  - Existing referral results
- Added business-mode referral opportunities:
  - Creator: success story, case study, content collaboration.
  - Service: client referral, testimonial, review request.
  - Retail: customer referral, transformation story, repeat buyer referral.
  - Team Building: recruit referral, team success story, leadership referral.
- Added referral facts from invite codes, referral-sourced leads, sponsored users, feedback, and existing customer success projections.
- Added `/api/v1/referral/projection` behind authenticated API access.
- Wired AI COO to receive referral signals and prioritize `activate_advocacy` when referral readiness is strong enough.
- Wired Dashboard projection and Dashboard UI to show referral readiness, advocacy opportunity, referral progress, and next referral milestone.

## Files

- `src/modules/referral/contracts/ReferralProjection.ts`
- `src/modules/referral/services/referral-facts.ts`
- `src/modules/referral/services/referral-score-engine.ts`
- `src/modules/referral/services/advocacy-detector.ts`
- `src/modules/referral/services/referral-opportunity-engine.ts`
- `src/modules/referral/services/referral-projection.ts`
- `src/modules/referral/services/referral-engine.ts`
- `src/app/api/v1/referral/projection/route.ts`
- `src/modules/ai-coo/contracts/AICOODecision.ts`
- `src/modules/ai-coo/services/ai-coo-decision-engine.ts`
- `src/modules/ai-coo/services/focus-prioritizer.ts`
- `src/modules/ai-coo/services/opportunity-detector.ts`
- `src/modules/ai-coo/services/risk-detector.ts`
- `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts`
- `src/modules/dashboard/components/DashboardV4.tsx`
- `src/__tests__/services/referral-engine.test.ts`

## Verification

- `pnpm exec vitest run src/__tests__/services/referral-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts src/__tests__/services/autonomous-execution-engine.test.ts`
- `pnpm type-check`

## Result

CUSTOMER-005 is implemented locally. The platform can now identify who should be asked for referrals, when to ask, and which referral opportunity is most likely to work.
