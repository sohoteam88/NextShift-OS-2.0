# ADR-018 Business Mode Authority Review

Status: Approved With Conditions

Category: Authority Decision

Architecture Review Board Item: `ARB-001`

Affected layers:

- Interview Authority
- Business State
- Journey
- AI COO
- Growth Loop

Reviewed input:

- `/Users/stevenmacmini/Desktop/ADR-018 Business Mode Authority/ADR-018 Business Mode Authority.md`

Related evidence:

- `audit/interview-authority-migration-readiness-review.md`
- `audit/business-state-migration-readiness-review.md`
- `audit/journey-authority-migration-readiness-review.md`
- `audit/growth-loop-migration-readiness-review.md`
- `audit/PHASE_8B_BUSINESS_MODE_AUTHORITY_RESOLUTION_REVIEW.md`
- `audit/PHASE_8B_1_FINAL_BUSINESS_MODE_MIGRATION_SPEC_REVIEW.md`
- `audit/PHASE_8B_2_BUSINESS_MODE_IMPLEMENTATION_SPEC_REVIEW.md`
- `audit/PHASE_8B_3_BUSINESS_MODE_RUNTIME_BINDING_SPEC_REVIEW.md`
- `audit/PHASE_9C_ARCHITECTURE_REVIEW_BOARD.md`

## Review Verdict

`APPROVE AS AUTHORITY DECISION, WITH IMPLEMENTATION CONDITIONS`

ADR-018 correctly resolves the open Business Mode authority blocker:

```text
Business Mode is owned by Interview Authority.
Canonical source: BusinessContextSnapshot.businessMode.
```

This is the correct authority owner because Business Mode is a strategic business identity fact. It should not be inferred from current funnel, current mission, current opportunity, current stage, dashboard selection, local page state, or growth recommendation state.

## Architecture Review Outcome

Outcome:

`Approve With Conditions`

Meaning:

- migration planning may treat Business Mode as owned by Interview Authority
- Business State, Journey, AI COO, and Growth Loop must consume Business Mode from Interview Authority
- no downstream layer may override Business Mode
- implementation may not start until the conditions below are handled in scoped PRs

## Decision

Approved authority decision:

```text
BusinessContextSnapshot.businessMode
```

is the canonical Business Mode source.

Owner:

```text
Interview Authority
```

Downstream consumers:

- Business State
- Journey
- AI COO
- Growth Loop
- onboarding
- dashboard
- funnel builder
- AI coach
- CEO advisor
- mission planner

## Current Runtime Authority

Current runtime authority is fragmented and consumer-local.

Observed or previously audited legacy sources include:

- onboarding selections
- funnel selections
- localStorage funnel preference
- query param `type`
- dashboard assumptions
- mission paths
- local page logic
- hard-coded defaults
- heuristics

Current runtime state:

```text
NO CANONICAL BUSINESS MODE AUTHORITY
```

This matches the Interview Authority readiness review, which marked business-mode sources as unresolved and blocked.

## Target Authority

Target shape:

```ts
type BusinessMode =
  | "retail"
  | "recruitment"
  | "hybrid"
  | "team_building"
  | "franchise";

interface BusinessContextSnapshot {
  businessMode: BusinessMode;
}
```

Authority rule:

```text
Only Interview Authority may determine Business Mode.
```

Downstream layers may consume, adapt, and display Business Mode. They may not infer or override it independently.

## Approval Conditions

ADR-018 is approved as an authority decision with these implementation conditions:

1. `BusinessContextSnapshot.businessMode` must be added as a contract before consumer cutover.
2. Adapter output must expose:
   - `source`
   - `scope`
   - `confidence`
   - `fallback`
3. Legacy Business Mode sources must be wrapped through compatibility adapters before retirement.
4. Business State may consume Business Mode, but may not own or rewrite it.
5. Journey may consume Business Mode for personalization, but may not derive it from progression.
6. AI COO may consume Business Mode for assignment context, but may not infer it from recommendations.
7. Growth Loop may consume Business Mode as a read-only strategic signal, but may not write it.
8. Dashboard and `useDashboardMission` must remain consumers only.
9. Any explicit user change to Business Mode requires a scoped write-path decision under Interview Authority.
10. Legacy sources may not be retired until runtime references are zero and authority audit passes.

## Open Implementation Questions

ADR-018 intentionally resolves authority ownership. It does not fully resolve runtime implementation.

Open questions for follow-up PRs:

1. Where is Phase 1 Business Mode persisted?
   - prior Phase 8B.3 review approved `user.metadata.business_mode` as a phase-1 binding direction, but not as an execution-ready spec.

2. Which exact Interview Authority write path sets initial Business Mode?
   - candidate: interview completion / profile confirmation path.
   - must be defined in P1-001/P1-002 scope.

3. Which exact path handles explicit user updates?
   - must stay under Interview Authority.

4. How are existing legacy values normalized?
   - previous review accepted `upgrade -> hybrid` as a direction.
   - ADR-018 expands taxonomy to include `team_building` and `franchise`, so compatibility mapping must be explicit.

5. What is the exact missing-value behavior?
   - fallback should be explicit and labelled, not hidden inside downstream consumers.

## Alternatives Review

### Alternative A: Business State Owns Business Mode

Decision:

`Rejected`

Reason:

Business State represents operational state such as stage, readiness, bottlenecks, and opportunities. Business Mode is strategic identity. Business State changes more frequently and should consume Business Mode, not own it.

### Alternative B: Journey Owns Business Mode

Decision:

`Rejected`

Reason:

Journey is progression. Business Mode is intent. Journey can personalize progression from Business Mode, but must not infer identity from progression.

### Alternative C: Dashboard Selection Owns Business Mode

Decision:

`Rejected`

Reason:

UI selection is not authority. Dashboard is a high-risk mixed consumer and is explicitly last-wave under Phase 9A/9B governance.

### Alternative D: Funnel Mode Owns Business Mode

Decision:

`Rejected`

Reason:

Current funnel can be a tactical operating choice. It is not the same as primary strategic growth model.

## Migration Impact Assessment

Impact:

`Cross-Layer`

Affected waves:

- Phase 1 Interview Authority
- Phase 2 Business State
- Phase 3 Journey
- Phase 4 AI COO
- Phase 6 Growth Loop

Affected PR types:

- Contract PR
- Adapter PR
- Consumer Cutover PR
- Authority Audit PR
- later Retirement PR

Command-boundary impact:

`Potential`

Reason:

ADR-018 says target state has a single write path through Interview Authority. The exact write path is not approved here and requires scoped follow-up.

Retirement impact:

`Yes`

Retirement candidates:

- local business mode flags
- funnel mode assumptions
- dashboard business mode selectors
- localStorage authority
- query-param authority
- default/heuristic authority

Retirement is not approved by this ADR. It requires zero runtime references and authority audit.

## Consumer Impact

Consumers that must eventually read Interview-owned Business Mode:

- onboarding
- dashboard
- funnel builder
- AI coach
- CEO advisor
- mission planner
- Business State adapters
- Journey adapters
- AI COO assignment context
- Growth Loop read projection

Consumer cutover rule:

```text
No consumer cutover before adapter exists.
```

High-risk consumers:

- DashboardV4
- `useDashboardMission`
- AI recommendation surfaces
- funnel/growth recommendation surfaces

These must remain later-wave consumers.

## Write / Command Impact

Approved principle:

```text
Only Interview Authority may set Business Mode.
```

Not approved yet:

- exact persistence mechanism
- exact API/service writer
- explicit override path
- legacy source retirement

Blocked:

- Business State writing Business Mode
- Journey writing Business Mode
- AI COO writing Business Mode
- Growth Loop writing Business Mode
- Dashboard writing canonical Business Mode outside Interview Authority

## Required Follow-Up PRs

### P1-001: Interview Authority Contract

Add:

```text
BusinessContextSnapshot.businessMode
```

Required:

- taxonomy definition
- source/scope/confidence/fallback fields
- missing-value policy
- compatibility notes

### P1-002: Interview Adapter Layer

Add adapter mapping:

- Interview Authority source -> `BusinessContextSnapshot.businessMode`
- legacy sources -> compatibility adapter
- legacy `upgrade` normalization if still present

Required:

- no consumer cutover
- no legacy retirement
- no downstream override

### P1-003: Business Mode Source Audit

Run reference audit for:

- localStorage business/funnel mode
- query param `type`
- funnel defaults
- dashboard assumptions
- mission path assumptions
- local feature flags

### P2-001: Business State Adapter

Consume:

```text
BusinessContextSnapshot.businessMode
```

Blocked:

- Business State deriving or writing Business Mode.

### P3-001: Journey Adapter

Consume:

```text
BusinessContextSnapshot.businessMode
```

Blocked:

- Journey deriving Business Mode from progression, missions, or revenue state.

### P4-001: AI COO Assignment Context Adapter

Consume Business Mode as assignment context.

Blocked:

- AI COO inferring Business Mode from recommendations.

### P6-001: Growth Loop Read Adapter

Consume Business Mode as a strategic read-only signal.

Blocked:

- Growth Loop writing Business Mode.

## Governance Checks

| Rule | Result | Notes |
| --- | --- | --- |
| Rule 1: No layer bypasses upstream authority | PASS | ADR assigns ownership to Interview Authority. |
| Rule 2: No consumer cutover before adapter exists | PASS WITH CONDITION | Follow-up adapters are required before cutover. |
| Rule 4: DashboardV4 last-wave migration | PASS | Dashboard cannot own Business Mode. |
| Rule 5: `useDashboardMission` consumer only | PASS | It may consume, not resolve. |
| Rule 6: Growth Loop read-only | PASS | Growth Loop consumes Business Mode only. |
| Rule 8: Business State/Journey projections only | PASS | They consume, not own. |
| Rule 9: Adapter source/scope/confidence/fallback | PASS WITH CONDITION | Must be enforced in P1-001/P1-002. |
| Rule 10: Retirement requires Authority Audit | PASS | Retirement not approved here. |

## Board Outcome

ARB-001 status:

```text
Approved With Conditions
```

Decision:

```text
Business Mode is owned by Interview Authority.
```

Canonical source:

```text
BusinessContextSnapshot.businessMode
```

Migration impact:

```text
Cross-Layer
```

Implementation readiness:

```text
NOT READY UNTIL FOLLOW-UP CONTRACT AND ADAPTER PRs LAND
```

## Final Architecture Judgment

ADR-018 resolves the Business Mode authority blocker at the architecture level.

It does not authorize direct implementation, consumer cutover, or legacy retirement.

The next valid action is P1-001 Interview Authority Contract, followed by P1-002 Interview Adapter Layer.
