# PHASE 9A Migration Governance Rules

Status: Architecture Governance

Purpose: define non-negotiable migration governance rules before V7 execution begins.

This document exists to prevent architectural drift during migration.

Scope:

- Interview Authority
- Business State
- Journey
- AI COO
- Agent Runtime
- Growth Loop

Source context:

- `audit/V7_GLOBAL_MIGRATION_BLUEPRINT.md`
- `audit/ADR_017_V7_MIGRATION_GOVERNANCE_REVIEW.md`
- completed Phase 8A readiness reviews for all six layers

## Governance Decision

V7 migration may proceed only under the following rule set:

```text
contracts -> adapters -> bounded consumers -> mixed consumers -> command review -> retirement -> final authority audit
```

No PR may bypass this sequence unless a later architecture decision explicitly supersedes this document.

## Canonical Authority Chain

All migration work must preserve this dependency chain:

```text
Interview Authority
  -> Business State
  -> Journey
  -> AI COO
  -> Agent Runtime
  -> Growth Loop
```

The chain is directional.

Downstream layers may consume upstream projections. Upstream layers must not depend on downstream layers.

## Rule 1: No Layer May Bypass Its Upstream Authority

Intent:

Prevent downstream layers from reading private internals or legacy sources when an upstream projection exists.

Required behavior:

- Business State reads Interview projections, not interview internals.
- Journey reads Business State and Journey projections, not scattered dashboard wrappers.
- AI COO reads Journey/Business State projections, not page-local next-action rules.
- Agent Runtime reads AI COO execution plan, not duplicate assignment shortcuts.
- Growth Loop reads upstream projections and domain fact adapters, not local recommendation shortcuts.

Allowed:

- transitional adapters that explicitly label their legacy source
- direct domain reads only inside approved adapters
- temporary bridge code with a retirement condition

Blocked:

- consumers importing legacy services directly after a projection adapter exists
- downstream layers re-deriving upstream truth
- page-level precedence rules that bypass upstream authority

Merge gate:

- PR description must state which upstream authority is being consumed.
- If a direct legacy read remains, the PR must name the adapter and retirement condition.

## Rule 2: No Consumer Cutover Before Adapter Exists

Intent:

Prevent consumers from moving onto unfinished or implicit authority contracts.

Required behavior:

- every migrated consumer must read through an adapter or canonical projection contract
- consumer PRs must identify the adapter they consume
- adapter PRs must land before consumer cutover PRs

Allowed:

- adapter-only PRs with no consumer cutover
- dual-read diagnostic mode if it does not change runtime behavior
- bounded consumer cutover after adapter verification

Blocked:

- dashboard, AI, platform, team, franchise, automation, or CRM cutover before adapter exists
- consumer rewrites that call source services directly and call that "migration"
- replacing local logic with another local wrapper instead of a projection adapter

Merge gate:

- PR must include an adapter reference.
- PR must list changed consumers.
- PR must state whether runtime behavior is unchanged, changed, or intentionally dual-read.

## Rule 3: No Retirement Before Zero Runtime References, Stable Adapter, And Passing Regression Checks

Intent:

Prevent premature deletion while consumers still depend on legacy authority.

Retirement requires all three:

1. consumer references = 0
2. compatibility adapter stable
3. regression checks pass

Runtime references include:

- `src/**` production imports
- route handlers
- server components
- client components
- hooks
- services
- API routes
- active runtime utilities
- command/write paths

Runtime references exclude only:

- audit documents
- architecture documents
- migration notes
- tests explicitly labeled as legacy-retirement coverage
- archived files that are not imported by runtime code

Allowed:

- marking a source as retirement candidate
- isolating legacy source behind adapter
- deleting legacy code only after reference audit passes

Blocked:

- deleting source code while route/hook/component references remain
- deleting compatibility adapters before all consumers move
- retiring writers that still own factual state

Merge gate:

- retirement PR must include a reference audit summary.
- retirement PR must include checks run.
- retirement PR must include final authority audit notes.

## Rule 4: DashboardV4 Is Last-Wave Migration

Intent:

DashboardV4 is the highest-risk mixed consumer and must not be used as the first proof of migration.

Reason:

DashboardV4 and related dashboard wrappers consume or display:

- Interview-derived context
- Business State readiness/opportunity signals
- Journey mission/progression
- activation wrappers
- AI coach recommendations
- revenue progress
- team summary
- Growth Loop next actions

Allowed:

- adding adapter compatibility around dashboard inputs
- diagnostic side-by-side reads that do not change user-visible behavior
- later-wave dashboard cutover after lower-risk consumers pass

Blocked:

- first-wave DashboardV4 cutover
- using DashboardV4 as the primary adapter test surface
- retiring dashboard legacy paths before bounded consumers are migrated

Merge gate:

- any DashboardV4 PR must state why all required upstream adapters are stable.
- DashboardV4 cutover PR must reference completed bounded-consumer cutovers.

## Rule 5: `useDashboardMission` Must Become Consumer Only

Intent:

Prevent `useDashboardMission` from becoming a permanent cross-layer authority.

Required final state:

```text
useDashboardMission = consumer wrapper only
```

Allowed:

- temporary compatibility adapter
- reading canonical Journey, Business State, AI COO, or Growth Loop projections
- formatting dashboard display state from canonical projections

Blocked:

- selecting canonical mission truth inside `useDashboardMission`
- re-deriving Journey progression
- owning next-action precedence
- becoming the permanent resolver for dashboard, mission, AI, and team state

Merge gate:

- PRs touching `useDashboardMission` must classify the change:
  - adapter
  - consumer formatting
  - retirement
  - prohibited authority expansion
- authority expansion is not allowed.

## Rule 6: Growth Loop Is Read-Only

Intent:

Prevent Growth Loop from absorbing factual domain writers.

Growth Loop never owns:

- Lead writes
- Funnel writes
- Followup writes
- Invite writes
- Runtime writes
- Content writes
- Mission writes
- Franchise metadata writes
- Automation side-effect writes

Allowed:

- Growth Loop read projections
- Growth Loop adapters over domain facts
- Growth Loop advisory or reporting views
- Growth Loop signals from AI COO and Agent Runtime outputs

Blocked:

- Growth Loop creating or updating `Lead`
- Growth Loop creating or publishing `Funnel`
- Growth Loop setting `Lead.nextFollowup`
- Growth Loop marking invites used
- Growth Loop triggering Agent Runtime execution
- Growth Loop replacing `member/register` transactional invite consumption

Merge gate:

- any Growth Loop PR must state whether it is read-only.
- if it touches command/write paths, it is out of scope for Growth Loop migration and needs a separate command-boundary decision.

## Rule 7: Agent Runtime Execution Behavior Cannot Change During Adapter Migration

Intent:

Preserve current workforce execution semantics while introducing runtime contracts.

Required behavior:

- direct `agentId` execution remains unchanged
- goal orchestration remains unchanged
- stage fallback remains unchanged
- executor module behavior remains unchanged
- visible report behavior remains unchanged
- metadata memory behavior remains wrapped, not replaced

Allowed:

- wrapping `POST /api/v1/ai-workforce/execute`
- normalizing response shape without changing execution winner
- adding diagnostics
- adding adapter contracts

Blocked:

- changing branch precedence inside execute route
- changing plan-gating behavior
- replacing memory persistence
- changing selected agent behavior
- changing executor output semantics

Merge gate:

- Agent Runtime adapter PR must include before/after behavior notes for all execution branches.
- If behavior changes, the PR is not an adapter PR and must be re-scoped.

## Rule 8: Business State And Journey May Expose Projections, But May Not Absorb Domain Writers

Intent:

Keep Business State and Journey as projection layers, not command layers.

Allowed:

- Business State stage/readiness/bottleneck/opportunity projections
- Journey progression/milestone/mission/next-action projections
- adapters over mission, funnel, social, traffic, CEO, activation, and revenue sources

Blocked:

- Business State writing funnel, lead, content, followup, invite, or runtime data
- Journey writing funnel, lead, content, followup, invite, or runtime data
- Business State replacing domain services as command writer
- Journey absorbing activation, revenue, or dashboard writers without a separate command-boundary decision

Merge gate:

- Business State and Journey PRs must identify every write path touched.
- If write paths are touched, PR must prove they are existing-domain writes preserved through adapter, not new projection-layer ownership.

## Rule 9: Every Adapter Must Expose Source, Scope, Confidence, And Fallback

Intent:

Make adapters auditable and prevent hidden authority drift.

Every adapter output must expose:

- `source`
- `scope`
- `confidence`
- `fallback`

Minimum field meanings:

| Field | Meaning |
| --- | --- |
| `source` | the authority or legacy source used to produce the value |
| `scope` | user, tenant, team, platform, route, module, AI, or domain boundary |
| `confidence` | whether the value is confirmed, derived, inferred, fallback, or synthetic |
| `fallback` | the fallback source used, or `none` |

Allowed:

- additional fields such as `sourceVersion`, `authority`, `warnings`, `generatedAt`, `raw`
- domain-specific confidence enums if mapped back to the global field

Blocked:

- adapters returning unlabelled values
- adapters hiding legacy fallback usage
- adapters mixing user/team/platform scope without explicit scope labels

Merge gate:

- adapter PR must include sample output shape.
- adapter tests or review notes must verify source/scope/confidence/fallback are present.

## Rule 10: Every Retirement PR Requires Authority Audit Before Merge

Intent:

Make retirement a verified architectural event, not a cleanup guess.

Authority Audit must include:

- source being retired
- target authority replacing it
- runtime reference scan result
- consumers migrated
- compatibility adapter status
- checks run
- rollback plan or restore path

Allowed:

- retirement candidate marking before audit
- staged retirement PRs
- adapter removal after consumers reach zero

Blocked:

- retirement PR without reference audit
- deleting legacy source because "it should be unused" without scan evidence
- removing adapter and source in the same PR unless references are already zero

Merge gate:

- PR cannot merge without an Authority Audit section.
- PR cannot merge if runtime references are nonzero.

## Required PR Checklist

Every V7 migration PR must answer:

1. Which layer is this PR migrating?
2. Which upstream authority does it consume?
3. Is this PR contract, adapter, consumer cutover, command-boundary, retirement, or audit?
4. Which consumers changed?
5. Which write paths changed?
6. Which legacy references remain?
7. Is DashboardV4 touched?
8. Is `useDashboardMission` touched?
9. Is Growth Loop write behavior touched?
10. Is Agent Runtime execution behavior changed?
11. Does every adapter expose source/scope/confidence/fallback?
12. What checks passed?

## Required Reference Audit Standard

Reference audits must cover at minimum:

- production source imports
- API routes
- server components
- client components
- hooks
- services
- utilities
- command/write paths
- active runtime constants and config

Reference audit results must classify findings as:

- active runtime reference
- adapter-only reference
- test reference
- documentation reference
- archived/non-runtime reference

Only active runtime references block retirement.

Adapter-only references are allowed only if the adapter has:

- source authority
- target authority
- current consumers
- retirement condition

## Violation Handling

If a PR violates any governance rule:

1. Stop the migration PR.
2. Reclassify the PR as architecture decision, command-boundary decision, or adapter design.
3. Update the migration plan before implementation resumes.
4. Do not merge as an exception without a written authority decision.

Examples:

- Growth Loop starts writing leads: reclassify as command-boundary decision.
- Agent Runtime adapter changes execution branch winner: reclassify as runtime behavior change.
- DashboardV4 is migrated before bounded consumers: reclassify as wave violation.
- `useDashboardMission` gains new precedence logic: reclassify as prohibited authority expansion.

## Wave-Specific Governance

| Wave | Required Gate |
| --- | --- |
| Wave 1 Interview Authority | business mode remains unresolved unless a dedicated authority decision resolves it |
| Wave 2 Business State | projection contracts land before dashboard or activation cutover |
| Wave 3 Journey | legacy mission bridge exists before retirement begins |
| Wave 4 AI COO | tactical/strategic recommendation rule exists before dashboard AI cutover |
| Wave 5 Agent Runtime | execution wrapping preserves branch behavior |
| Wave 6 Growth Loop | read projection separates facts, readiness, recommendations, and scope |

## Success Criteria

Migration team follows identical rules across all waves.

Success means:

- every layer consumes its upstream authority
- every consumer cutover has an adapter first
- every adapter exposes source/scope/confidence/fallback
- no retirement happens before zero runtime references
- DashboardV4 migrates last
- `useDashboardMission` becomes consumer-only
- Growth Loop stays read-only
- Agent Runtime execution behavior is preserved during adapter migration
- Business State and Journey remain projection layers
- every retirement PR includes Authority Audit before merge

## Final Governance Judgment

These rules are mandatory for V7 migration execution.

The migration may proceed only if PRs follow the same governance standard across all six waves.
