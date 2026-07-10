# AI-003 AI COO Decision Engine

## Scope

Implemented the AI COO Decision Engine as the strategic decision layer after Business Context Memory.

## Authority Chain

Interview Authority -> Business State -> Journey Engine -> Mission Engine -> Business Context Memory -> AI COO Decision Engine -> Dashboard Projection.

## Delivered

- Added `AICOODecision` contract.
- Added Decision Engine services:
  - `ai-coo-decision-engine.ts`
  - `focus-prioritizer.ts`
  - `risk-detector.ts`
  - `opportunity-detector.ts`
  - `decision-projection.ts`
  - `decision-memory-adapter.ts`
- Added `/api/v1/ai-coo/decision`.
- Extended Business Context Memory events with `COO_DECISION_MADE`.
- Updated COO Plan to include the primary AI COO decision and use it as strategic focus.
- Updated Dashboard Projection to expose:
  - `currentFocus`
  - `nextBestAction`
  - `primaryRisk`
  - `primaryOpportunity`
  - `decisionReason`
  - `priority`
  - `confidence`
- Updated Dashboard V4 to display AI COO decision output instead of local recommendation logic.
- Added targeted decision tests.

## Decision Rules

- Only one primary decision is returned.
- Supporting actions are capped at three.
- Critical or high risk wins over opportunities.
- High-priority opportunity wins when there is no critical or high risk.
- Current mission becomes the fallback decision when no stronger risk or opportunity exists.

## Memory Contract

Decision outcomes are recorded through the existing Business Context Memory event store using:

- `targetType = business_memory`
- `action = COO_DECISION_MADE`
- decision metadata including focus area, priority, confidence, mission id, primary risk, and primary opportunity

## Verification

- `pnpm exec vitest run src/__tests__/services/ai-coo-decision-engine.test.ts src/__tests__/services/business-context-tests.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-business-state-first.test.ts src/__tests__/services/interview-authority-engine.test.ts src/__tests__/services/journey-engine-tests.ts src/__tests__/services/mission-engine-authority.test.ts`
- `pnpm type-check`

Both passed.
