# PRODUCT-008 Referral Engine PRD

Version: V8

Status: Implemented

Owner: Product Growth Team

Depends on:

- PRODUCT-004 Activation Engine
- PRODUCT-005 User Success Engine
- PRODUCT-006 Retention Engine
- PRODUCT-007 Expansion Engine
- PRODUCT-002 Personalization Engine
- PRODUCT-003 Localization System

## Mission

Turn successful users into advocates. The Referral Engine answers: how does user success create new users?

## Core Rule

Referral is not an invite sent, link click, lead, or registration. A successful referral requires the referred user to activate.

## Referral State Contract

`ReferralProjection.referralState` contains:

- `referralReady`
- `referralLevel`
- `referralLevelLabel`
- `referralCount`
- `successfulReferrals`
- `pendingReferrals`
- `nextReferralOpportunity`
- `nextReferralOpportunityLabel`

Supported referral levels:

- `NOT_READY`
- `READY`
- `ADVOCATE`
- `AMBASSADOR`
- `CHAMPION`

## Implementation

- Existing `ReferralProjection` remains backward compatible with legacy `referralReadiness`, `referralScore`, `referralOpportunities`, `referralRisks`, and KPI fields.
- PRODUCT-008 state is added through `referralState`, `referralRecommendation`, `referralAttribution`, `referralRewards`, localization metadata, and personalization metadata.
- Referral readiness requires verified success, retained outcome progression, and positive momentum.
- Invite, referral lead, and referred member signals are participation or pending signals only.
- Activated referred users are counted from `activation.completed` audit logs for users sponsored by the current user.

## Referral Opportunities

Supported opportunity types include:

- `invite_friend`
- `share_success_story`
- `client_referral`
- `customer_referral`
- `transformation_story`
- `repeat_buyer_referral`
- `recruit_referral`
- `team_success_story`
- `leadership_referral`

Opportunity selection uses business mode, success state, retention state, expansion state, and personalization context.

## Referral Risks

Risk detection includes:

- No success yet: block referral requests.
- Retention not achieved: block referral requests.
- Referral requests ignored: reduce frequency.
- Satisfaction risk: resolve confidence before asking.
- Referral path missing: create a trackable invite path.

## Attribution

Referral attribution tracks:

- referral user
- source
- activation result
- successful referral status
- activation timestamp

## Rewards

Version 1 uses recognition only:

- Advocate Badge
- Ambassador Badge
- Champion Badge
- Leaderboard

No financial rewards are implemented in Version 1.

## Dashboard

Dashboard Momentum Card displays:

- referral level
- successful referrals
- pending referrals
- next referral opportunity

## Localization

All referral messaging uses Localization Engine through `referral.*` keys in `en`, `zh`, and `ms`. Dashboard labels use `src/messages` keys.

## Audit Logging

Referral audit actions:

- `referral.ready`
- `referral.invited`
- `referral.activated`
- `referral.successful`
- `referral.level.changed`

Audit metadata stores referral level, readiness, referral count, successful referrals, pending referrals, opportunity, locale, translation source, fallback flag, message keys, and timestamp.

## Metrics

- Referral Ready Rate
- Referral Participation Rate
- Successful Referral Rate
- Activated Referral Rate

## Verification

- `pnpm type-check`
- `pnpm vitest run src/__tests__/services/referral-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts src/__tests__/services/expansion-engine.test.ts`
- `pnpm build`

## Acceptance Criteria

- Referral state exists: done.
- Referral readiness exists: done.
- Referral levels tracked: done.
- Referral attribution exists: done.
- Referral opportunities generated: done.
- Localization supported: done.
- Personalization supported: done.
- Audit logging exists: done.
- Type-check passes: done.
- Build passes: done.
