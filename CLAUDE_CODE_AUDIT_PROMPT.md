# Claude Code Independent Audit Prompt

You are Claude Code. Independently audit the local NextShift OS implementation. Do not trust Codex's prior claims. Verify from source, tests, and PRDs only.

Repo:

`/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0`

## PRD Files To Read

Read these first:

- `docs/ai-coo/DASH-001_AI_COO_FIRST_DASHBOARD_PHILOSOPHY.md`
- `docs/ai-coo/DASH-003_ROUTE_CONTRACT.md`
- `docs/ai-coo/COO-001A_STATE_REQUIREMENTS_MATRIX.md`
- `docs/ai-coo/COO-001B_STATE_VALIDATION_ENGINE_PRD.md`
- `docs/ai-coo/COO-002_BOTTLENECK_ENGINE_PRD.md`
- `docs/ai-coo/COO-002A_BOTTLENECK_SIGNAL_MATRIX.md`
- `audit/COO-002_READINESS_GATE_CHECKLIST.md`
- `audit/COO-002_READINESS_ARCHITECTURE_AUDIT_2026-06-22.md`

## Files Changed To Inspect

Primary implementation:

- `src/modules/mission-engine/contracts/MissionAuthority.ts`
- `src/modules/mission-engine/services/BottleneckEngine.ts`
- `src/modules/mission-engine/services/BottleneckAuthority.ts`
- `src/modules/mission-engine/services/CanonicalMissionRegistry.ts`
- `src/modules/mission-engine/services/ExplainabilityAuthority.ts`
- `src/modules/mission-engine/services/MissionEngineAuthorityService.ts`
- `src/modules/business-state/adapters/BusinessStateAssembler.ts`
- `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts`
- `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts`
- `src/modules/ai-coo/adapters/COOPlanAssembler.ts`
- `src/modules/ai-coo/services/COOPlanService.ts`
- `src/modules/ai-coo/services/ai-coo-decision-engine.ts`
- `src/modules/ai-coo/contracts/AICOORequestContext.ts`

Tests:

- `src/__tests__/services/bottleneck-engine.test.ts`
- `src/__tests__/services/dashboard-projection-adapter.test.ts`
- `src/__tests__/services/mission-engine-authority.test.ts`
- `src/__tests__/services/ai-coo-decision-engine.test.ts`
- `src/__tests__/services/autonomous-execution-engine.test.ts`
- `src/__tests__/api/auth-001-funnel-builder-redirect.test.ts`

Docs and indexes:

- `docs/README.md`
- `docs/architecture/ai/README.md`
- `docs/ai-coo/README.md`

Also inspect unrelated-looking modified files for accidental coupling or regressions.

## Expected Architecture

- Dashboard must not calculate bottlenecks, mission reasoning, routes, mission type, or CTA labels.
- Business State determines where the user is.
- Bottleneck Engine determines why the user is stuck.
- Bottleneck Engine must generate candidates from deterministic signals, rank them, and return exactly one `BottleneckResult`.
- Mission Engine must consume `BottleneckResult`; it must not determine bottlenecks itself.
- Explainability must be generated in one authority path and passed through to Dashboard.
- Canonical route/type/CTA mapping must live in one registry.
- Dashboard must not expose Bottleneck confidence.
- `getBusinessState` and `getCurrentMission` should be request-scoped/reused in dashboard projection.
- Failure behavior must return `NO_SYSTEM` for signal failure, never null/undefined/unknown.

## Forbidden Patterns

Search for and flag any of these:

- Dashboard-local bottleneck logic.
- Dashboard-local mission reasoning logic.
- `route.includes(...)` in mission-engine/dashboard route/type/CTA decisions.
- Duplicate state-to-bottleneck maps.
- `missionReasonFor`, `decisionReasonFor`, `hasInternalReason`.
- `bottleneckForBusinessState`, `toCanonicalBottleneck`.
- Mission Engine deriving bottleneck without `BottleneckResult`.
- Confidence shown in Dashboard projection or UI.
- Multiple bottlenecks returned as final result.
- Silent fallback that fabricates a mission instead of preserving failure semantics.

## Commands To Run

```bash
cd /Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0

git status --short

grep -RIn "route\\.includes\\|bottleneckForBusinessState\\|toCanonicalBottleneck\\|missionReasonFor\\|decisionReasonFor\\|hasInternalReason" src/modules/mission-engine src/modules/dashboard src/modules/business-state

grep -RIn "confidence" src/modules/dashboard src/modules/dashboard/components

pnpm test src/__tests__/services/bottleneck-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/mission-engine-authority.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts src/__tests__/services/autonomous-execution-engine.test.ts src/__tests__/api/auth-001-funnel-builder-redirect.test.ts

pnpm type-check
```

Optionally run:

```bash
pnpm test
pnpm build
```

## Acceptance Criteria

Audit must answer:

1. Does implementation match COO-002 and COO-002A?
2. Does Bottleneck Engine generate candidates from deterministic signals, rank them, and return only one winner?
3. Are all 002A required test cases covered?
4. Does signal failure return `NO_SYSTEM`, `High`, confidence `80`, and evidence `Business signals unavailable.`?
5. Is confidence internal only, not exposed to Dashboard?
6. Does Dashboard consume bottleneck/severity/explainability without calculating them?
7. Does Mission Engine consume `BottleneckResult` only for bottleneck decisions?
8. Are route/type/CTA mappings centralized?
9. Are duplicated bottleneck/reasoning decision trees removed?
10. Are request-scoped dashboard calls actually deduplicated?
11. Are there regressions in autonomous execution, dashboard projection, route contracts, or mission authority contracts?

## Output Format

- Findings first, ordered by severity.
- Include file and line references.
- Include missing tests or weak assertions.
- Include any architecture drift from PRDs.
- If no issues are found, say that explicitly, but still list residual risks and commands actually run.
