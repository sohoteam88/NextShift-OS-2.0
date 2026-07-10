# CUSTOMER-001 First User Activation System

## Scope

Implemented the first-user activation authority after AI-006.

## Added

- `ActivationProjection` contract.
- `activation-engine.ts` for reading canonical user activation facts.
- `activation-score-engine.ts` for the 0-100 activation score.
- `dropoff-detector.ts` for signup, interview, content, lead magnet, and landing page drop-off.
- `first-win-engine.ts` for Time To First Win.
- `activation-projection.ts` for the single activation projection.
- `GET /api/v1/activation/projection`.

## Integrated

- AI COO now receives activation score, drop-off stage, and activation risk.
- AI COO prioritizes `activate_user` before growth when activation is incomplete.
- Dashboard projection now includes activation data.
- Dashboard quick access uses activation threshold to hide advanced modules.
- Dashboard UI shows activation progress and First Win progress.

## First Win Definition

Signup to first content generated.

Target: 15 minutes.

## Verification

- `pnpm exec vitest run src/__tests__/services/activation-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts`
- `pnpm type-check`
