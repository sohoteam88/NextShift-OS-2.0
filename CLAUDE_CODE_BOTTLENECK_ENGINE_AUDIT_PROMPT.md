# Claude Code Bottleneck Engine Independent Audit Prompt

You are Claude Code. Independently audit the current Bottleneck Engine implementation. Do not trust Codex's prior implementation notes or claimed verification. Verify against the PRDs, source code, tests, and command output only.

Repo:

`/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0`

## Audit Against These PRDs

Read these files first:

- `docs/ai-coo/COO-002_BOTTLENECK_ENGINE_PRD.md`
- `docs/ai-coo/COO-002A_BOTTLENECK_SIGNAL_MATRIX.md`

Use `COO-002A_BOTTLENECK_SIGNAL_MATRIX.md` as the source of truth for:

- supported bottlenecks
- exact thresholds
- candidate generation rules
- severity levels
- confidence rules
- evidence requirements
- dashboard visibility rules
- failure behavior

## Implementation Files To Inspect

Primary:

- `src/modules/mission-engine/services/BottleneckEngine.ts`
- `src/modules/mission-engine/contracts/MissionAuthority.ts`
- `src/modules/mission-engine/services/MissionEngineAuthorityService.ts`
- `src/modules/mission-engine/services/BottleneckAuthority.ts`
- `src/modules/mission-engine/services/ExplainabilityAuthority.ts`
- `src/modules/mission-engine/services/CanonicalMissionRegistry.ts`
- `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts`

Related call graph:

- `src/modules/business-state/adapters/BusinessStateAssembler.ts`
- `src/modules/ai-coo/adapters/COOPlanAssembler.ts`
- `src/modules/ai-coo/services/COOPlanService.ts`
- `src/modules/ai-coo/services/ai-coo-decision-engine.ts`
- `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts`

Tests:

- `src/__tests__/services/bottleneck-engine.test.ts`
- `src/__tests__/services/mission-engine-authority.test.ts`
- `src/__tests__/services/dashboard-projection-adapter.test.ts`
- `src/__tests__/services/ai-coo-decision-engine.test.ts`

## Audit Questions

Answer all of these:

1. Does `BottleneckEngine` implement every bottleneck in the 002A matrix?
2. Are all thresholds exactly aligned with 002A?
3. Does the engine generate all matching candidates before ranking?
4. Does the engine return only one winning bottleneck?
5. Is confidence internal only?
6. Is Dashboard not showing Bottleneck confidence?
7. Does signal failure return `NO_SYSTEM`?
8. Is Mission Engine consuming `BottleneckResult` for bottleneck decisions?
9. Are there duplicated bottleneck decision trees?
10. Are tests covering every matrix bottleneck?

## Exact Matrix Coverage To Verify

Verify these bottlenecks exist and follow the matrix:

- `NO_BRAND`
- `NO_POSITIONING`
- `NO_CONTENT`
- `NO_AUDIENCE`
- `NO_LEAD_MAGNET`
- `NO_FUNNEL`
- `NO_TRAFFIC`
- `NO_LEADS`
- `NO_CONVERSION`
- `NO_CUSTOMERS`
- `NO_RETENTION`
- `NO_SYSTEM`
- `NO_TEAM`

For each bottleneck, check:

- signal rules
- severity
- evidence fields
- explainability text/source
- recommended mission type or downstream mapping
- test coverage

## Forbidden Patterns

Flag any occurrence of:

- Dashboard calculating bottlenecks.
- Dashboard exposing Bottleneck confidence.
- Mission Engine deriving bottleneck without consuming `BottleneckResult`.
- Multiple final bottlenecks returned from the engine.
- Candidate ranking skipped or short-circuited incorrectly, except explicit `NO_SYSTEM` failure behavior if PRD-compliant.
- Duplicate state-to-bottleneck decision trees outside the Bottleneck Engine.
- Threshold drift from `COO-002A_BOTTLENECK_SIGNAL_MATRIX.md`.
- Tests that only cover happy paths while missing matrix bottlenecks.
- Evidence arrays that do not prove the selected bottleneck.
- Fallbacks returning `null`, `undefined`, or `unknown`.

## Commands To Run

```bash
cd /Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0

git status --short

grep -RIn "route\\.includes\\|bottleneckForBusinessState\\|toCanonicalBottleneck\\|missionReasonFor\\|decisionReasonFor\\|hasInternalReason" src/modules/mission-engine src/modules/dashboard src/modules/business-state

grep -RIn "confidence" src/modules/dashboard src/modules/dashboard/components

grep -RIn "NO_BRAND\\|NO_POSITIONING\\|NO_CONTENT\\|NO_AUDIENCE\\|NO_LEAD_MAGNET\\|NO_FUNNEL\\|NO_TRAFFIC\\|NO_LEADS\\|NO_CONVERSION\\|NO_CUSTOMERS\\|NO_RETENTION\\|NO_SYSTEM\\|NO_TEAM" src/modules/mission-engine src/__tests__/services/bottleneck-engine.test.ts

pnpm test src/__tests__/services/bottleneck-engine.test.ts src/__tests__/services/mission-engine-authority.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts

pnpm type-check
```

Optional broader regression checks:

```bash
pnpm test src/__tests__/services/bottleneck-engine.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/__tests__/services/mission-engine-authority.test.ts src/__tests__/services/ai-coo-decision-engine.test.ts src/__tests__/services/autonomous-execution-engine.test.ts src/__tests__/api/auth-001-funnel-builder-redirect.test.ts

pnpm test
pnpm build
```

## Required Output Format

Produce the audit in this structure:

```md
# Bottleneck Engine Audit

## Compliance Score

Score: __ / 100

Brief basis for the score.

## Missing Bottlenecks

- List missing or partially implemented bottlenecks.
- For each, cite PRD rule and implementation file/line.

## Threshold Drift

- List every rule whose threshold differs from COO-002A.
- Include expected threshold, actual threshold, file, and line.

## Duplicated Logic

- Identify duplicated bottleneck decision trees or route/type/CTA mappings.
- Include file and line references.

## Test Gaps

- Identify matrix bottlenecks not covered by tests.
- Identify weak tests that do not assert severity, confidence, evidence, or explainability.

## Must Fix

- Ordered list of required fixes before this can pass.
- Include severity for each fix: Critical, High, Medium.

## Final Verdict

Choose exactly one:

- Pass
- Pass With Changes
- Fail

Explain why in 2-5 sentences.

## Commands Run

- List commands actually run.
- Include pass/fail result for each.
```

Do not modify files unless explicitly asked. This is an audit only.
