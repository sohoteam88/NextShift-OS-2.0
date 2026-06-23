# AI COO Documentation

This folder stores the governing PRDs and contracts for the AI COO dashboard foundation.

## Documents

- [DASH-001 AI COO First Dashboard Philosophy](DASH-001_AI_COO_FIRST_DASHBOARD_PHILOSOPHY.md)
- [DASH-003 AI COO Route Contract](DASH-003_ROUTE_CONTRACT.md)
- [COO-001A State Requirements Matrix](COO-001A_STATE_REQUIREMENTS_MATRIX.md)
- [COO-001B State Validation Engine PRD](COO-001B_STATE_VALIDATION_ENGINE_PRD.md)
- [COO-002 Bottleneck Engine PRD](COO-002_BOTTLENECK_ENGINE_PRD.md)
- [COO-002A Bottleneck Signal Matrix](COO-002A_BOTTLENECK_SIGNAL_MATRIX.md)
- [COO-002B Bottleneck Hardening Sprint](COO-002B_BOTTLENECK_HARDENING_SPRINT.md)
- [HOTFIX-001 Healthy Business State](HOTFIX-001_HEALTHY_BUSINESS_STATE.md)
- [COO-003 Priority Engine PRD](COO-003_PRIORITY_ENGINE_PRD.md)
- [HOTFIX-003 Priority History Dedup](HOTFIX-003_PRIORITY_HISTORY_DEDUP.md)
- [HOTFIX-004 Single CTA Authority](HOTFIX-004_SINGLE_CTA_AUTHORITY.md)
- [COO-004 Explainability Engine PRD](COO-004_EXPLAINABILITY_ENGINE_PRD.md)
- [HOTFIX-005 Explainability Localization](HOTFIX-005_EXPLAINABILITY_LOCALIZATION.md)
- [HOTFIX-006 Single Explainability Authority](HOTFIX-006_SINGLE_EXPLAINABILITY_AUTHORITY.md)
- [COO-005 Mission Generator V2 PRD](COO-005_MISSION_GENERATOR_V2_PRD.md)
- [HOTFIX-007 Real Completion Verification](HOTFIX-007_REAL_COMPLETION_VERIFICATION.md)
- [EXEC-001 Mission Execution Workspace PRD](EXEC-001_MISSION_EXECUTION_WORKSPACE_PRD.md)
- [HOTFIX-010 Completion Check Whitelist](HOTFIX-010_COMPLETION_CHECK_WHITELIST.md)
- [HOTFIX-011 Signal-Only Verification](HOTFIX-011_SIGNAL_ONLY_VERIFICATION.md)
- [EXEC-002 Agent Assisted Execution PRD](EXEC-002_AGENT_ASSISTED_EXECUTION_PRD.md)
- [EXEC-003 Autonomous Execution Guardrails PRD](EXEC-003_AUTONOMOUS_EXECUTION_GUARDRAILS_PRD.md)
- [EXEC-002A Real Agent Outputs PRD](EXEC-002A_REAL_AGENT_OUTPUTS_PRD.md)
- [EXEC-004 Autonomous Execution PRD](EXEC-004_AUTONOMOUS_EXECUTION_PRD.md)
- [HOTFIX-013 Execution State Machine](HOTFIX-013_EXECUTION_STATE_MACHINE.md)
- [EXEC-005 Agent Workforce Orchestration PRD](EXEC-005_AGENT_WORKFORCE_ORCHESTRATION_PRD.md)
- [EXEC-006 Multi-Mission Orchestration PRD](EXEC-006_MULTI_MISSION_ORCHESTRATION_PRD.md)
- [PRODUCT-001 First User Experience PRD](PRODUCT-001_FIRST_USER_EXPERIENCE_PRD.md)
- [PRODUCT-002 Personalization Engine PRD](PRODUCT-002_PERSONALIZATION_ENGINE_PRD.md)
- [PRODUCT-003 Localization System PRD](PRODUCT-003_LOCALIZATION_SYSTEM_PRD.md)
- [PRODUCT-004 Activation Engine PRD](PRODUCT-004_ACTIVATION_ENGINE_PRD.md)
- [HOTFIX-015 Activation Drop-Off Engine](HOTFIX-015_ACTIVATION_DROP_OFF_ENGINE.md)
- [HOTFIX-016 Activation Localization](HOTFIX-016_ACTIVATION_LOCALIZATION.md)
- [PRODUCT-005 User Success Engine PRD](PRODUCT-005_USER_SUCCESS_ENGINE_PRD.md)
- [PRODUCT-006 Retention Engine PRD](PRODUCT-006_RETENTION_ENGINE_PRD.md)
- [PRODUCT-007 Expansion Engine PRD](PRODUCT-007_EXPANSION_ENGINE_PRD.md)
- [PRODUCT-008 Referral Engine PRD](PRODUCT-008_REFERRAL_ENGINE_PRD.md)
- [PRODUCT-009 Customer Health Engine PRD](PRODUCT-009_CUSTOMER_HEALTH_ENGINE_PRD.md)

## Current Hardening Rules

- Dashboard components are presentation-only.
- Mission reasoning is generated in the projection layer.
- Production routes are the source of truth.
- Bottleneck Engine emits exactly one constraint with severity, confidence, evidence, and explainability.
- Empty Bottleneck Engine candidate sets emit `BUSINESS_HEALTHY` when signals are available.
- Priority Engine emits exactly one highest leverage action for the resolved bottleneck.
- Priority history dedup is applied only after completed actions resolve the previous bottleneck.
- Dashboard CTA labels are passed through from Mission Authority with only a static `Start Mission` fallback.
- Explainability Engine emits why-this, why-now, why-not-others, expected outcome, expected risk, and next milestone.
- Explainability Engine owns localized explanation copy for `zh`, `en`, and `ms`; Dashboard only displays the resolved result.
- Explainability Engine is the only source of user-facing explanation copy and centralized fallback copy.
- Mission Generator V2 converts Priority Results into executable Mission Plans with steps and completion checks.
- Mission completion is verified by MissionCompletionVerifier from real checks, not journey status.
- Dashboard launches Mission Workspace; Workspace owns execution, step progress, assets, agent support, and verification display.
- Mission workspace step completion accepts only active MissionCheckRegistry workspace keys; capability completion checks remain verifier-owned.
- MissionCompletionVerifier is signal-only and does not trust completedChecks, workspace step history, manual progress, or user declarations.
- Mission agents assist execution from the Workspace only; agent output never completes missions or writes verification state.
- Autonomous execution must pass guardrail checks for execution level, risk class, approval status, kill switch, and forbidden action policy.
- Agent invocations must create draft assets with content, preview, type, status, audit trail, and independent approval state.
- Level 4 autonomous execution is scheduler-controlled, low-risk only, audited, and never counts as mission completion.
- Autonomous execution state transitions must pass ExecutionStateMachine validation before persistence.
- Workforce Orchestrator plans mission-level multi-agent assignments, dependencies, and asset handoffs without owning mission completion.
- Outcome Orchestrator plans multi-mission business outcomes; outcome completion requires all mission completions plus an outcome signal.
- First user experience must show business-language next steps, visible progress, and a tangible first asset/value moment within 10 minutes.
- Personalization Engine creates a unified Brand DNA, Business State, audience, offer, mission history, outcome history, and asset history profile for generated assets only.
- Personalization may influence generated content, lead magnets, funnels, traffic assets, CRM follow-up, and offers, but never Business State, verification, mission completion, guardrails, priority, or bottleneck authority.
- Localization Engine is the source of truth for locale resolution, user-facing registry labels, generated asset localization, fallback handling, and localization audit metadata.
- Personalization must happen before localization; generated asset language must match the resolved locale and missing keys must never render raw key names.
- Activation Engine tracks the canonical signup-to-value funnel from `SIGNUP` through `ACTIVATED`, detects drop-offs, and exposes intervention triggers without showing internal activation score to users.
- First value should be visible within 10 minutes; first asset generation target is under 1 minute.
- Activation Drop-Off Engine must apply grace periods before declaring drop-off; `ON_TRACK` produces no intervention, `AT_RISK` produces soft reminders, and `DROPPED_OFF` produces recovery action.
- Activation intervention notifications are throttled to at most one per activation stage per 24 hours.
- Activation copy must originate from Localization Engine, respect user locale, record fallback metadata, and never render raw localization keys.
- User Success Engine tracks outcome realization after activation; mission completion contributes to progress but never equals success without the required business signal.
- Retention Engine is outcome-progression based; login frequency, session count, and time in app cannot mark a user retained.
- Expansion Engine helps retained users reach larger outcomes; expansion is outcome, revenue, team, and authority growth, not activity volume alone.
- Referral Engine counts a successful referral only when the referred user activates; invite sent, clicked, lead captured, or registered is not enough.
- Customer Health Engine predicts future success or failure from activation, success, retention, expansion, and referral projections, not login/session activity.
- Confidence is internal and is not exposed to the Dashboard projection.
- Mission decisions are traceable through audit metadata.
