# CUSTOMER-002 User Retention Engine

## Scope

Implemented the user retention projection after CUSTOMER-001 Activation System.

## Added

- `RetentionProjection` contract.
- `retention-engine.ts` for reading canonical retention facts.
- `retention-score-engine.ts` for retention score, mission completion rate, execution consistency, and inactivity days.
- `engagement-detector.ts` for retention state and 3/7/14/30 day inactivity flags.
- `momentum-engine.ts` for momentum score, current momentum, and streak.
- `retention-projection.ts` for the single retention projection.
- `GET /api/v1/retention/projection`.

## Integrated

- AI COO now receives retention score, retention state, retention risk, and momentum score.
- AI COO prioritizes `re_engage_user` when retention risk increases.
- Dashboard projection now includes retention data.
- Dashboard UI shows retention status, current momentum, current streak, days inactive, and recent wins.

## Data Sources

- User activity timestamps.
- Analytics events.
- Completed missions.
- Generated content.
- Published funnels.
- Lead magnet metadata.
- Autonomous execution audit logs.
- AI COO business memory audit logs.
- Achievements.

## Verification

- `pnpm exec vitest run src/__tests__/services/retention-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts`
- `pnpm type-check`
