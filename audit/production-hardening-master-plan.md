# NextShift OS Production Hardening Master Plan

Status: master plan
Program: Production Hardening
Entry gate: V7 Migration Program complete
Runtime changes: none

## Objective

Move NextShift OS from architecture-complete to production-hardened.

V7 reduced architecture risk by consolidating authority ownership across:

- Interview Authority
- Business State
- Journey
- AI COO
- Agent Runtime
- Growth Loop

Production hardening now focuses on:

- UX
- QA
- Observability
- Operations
- Security
- Infrastructure readiness
- Legacy retirement

## Execution Rules

- Do not deploy during planning or audit tasks.
- Do not delete legacy code until a retirement report marks it safe.
- Do not simplify Dashboard until the dashboard inventory and usage analysis are complete.
- Do not modify production infrastructure until the infrastructure audit and deployment checklist are complete.
- Do not introduce new observability vendors or secrets in repo files.
- Preserve existing V7 authority boundaries during all hardening tasks.

## Phase A: Legacy Retirement Audit

Goal:

- Identify code that can be retired after V7 authority migration.

Tasks:

- A1: Dead Code Audit
- A2: Unused Service Audit
- A3: Duplicate Logic Audit
- A4: Legacy Runtime Audit

Required output:

- `audit/legacy-retirement-report.md`

Acceptance criteria:

- Dead code candidates are listed with exact file paths.
- Service retirement candidates include current import evidence.
- Duplicate logic findings distinguish display duplication from authority duplication.
- No deletion is performed in Phase A.
- Each deletion candidate has a risk level and rollback note.

Exit gate:

- Eligible for bounded cleanup tasks only after `legacy-retirement-report.md` marks candidates safe.

## Phase B: Dashboard Simplification

Goal:

- Define the next dashboard architecture after V7 authority consolidation.

Tasks:

- B1: Dashboard Component Inventory
- B2: Dashboard Usage Analysis
- B3: Dashboard V3 Architecture
- B4: Dashboard V3 Implementation Plan

Required output:

- `audit/dashboard-v3-prd.md`

Acceptance criteria:

- Dashboard components are inventoried by route, data source, and action ownership.
- Growth Roadmap, AI Coach, CEO Advisor, CRM, Journey, and Growth Loop responsibilities remain separated.
- Dashboard V3 is specified as a consumer shell, not a new authority.
- Implementation plan includes migration order and rollback plan.

Exit gate:

- Eligible for Dashboard V3 build only after the PRD separates display, recommendation, and command surfaces.

## Phase C: End-To-End QA

Goal:

- Verify the complete user journey against authority boundaries and production behavior.

Tasks:

- C1: User Journey Audit
- C2: Authority Chain Validation
- C3: Regression Test Matrix
- C4: Acceptance Test Suite

Required output:

- `audit/system-acceptance-test.md`

Acceptance criteria:

- Core authenticated journeys are mapped from login to first visible business result.
- Authority chain validation covers V7 domains and Growth Loop.
- Regression matrix covers dashboard, brand, content, CRM, journey, analytics, agent runtime, and team/referral surfaces.
- Acceptance tests are written as executable or clearly manual test cases.

Exit gate:

- Eligible for production release candidate only after critical journeys pass.

## Phase D: Observability

Goal:

- Make production failures visible, diagnosable, and auditable.

Tasks:

- D1: Logging Architecture
- D2: Agent Runtime Telemetry
- D3: Error Tracking
- D4: Audit Trail

Required output:

- `audit/observability-plan.md`

Acceptance criteria:

- Logging policy avoids secrets and PII leakage.
- Agent Runtime telemetry captures request, assignment, execution, result, and failure states without exposing prompts or secrets.
- Error tracking plan defines client, server, API, and background job coverage.
- Audit trail plan covers admin/security/business-critical events.
- Deployment path for any external tool is documented without committing secrets.

Exit gate:

- Eligible for instrumentation implementation only after event names, payload redaction, retention, and ownership are defined.

## Phase E: Production Readiness

Goal:

- Confirm infrastructure, security, backup, and deployment readiness for production traffic.

Tasks:

- E1: Infrastructure Audit
- E2: Security Audit
- E3: Backup Strategy
- E4: Deployment Checklist

Required output:

- `audit/production-readiness-report.md`

Acceptance criteria:

- Infrastructure audit covers Docker, Docker Compose, Nginx, SSL, health checks, resource limits, and restart behavior.
- Security audit covers auth, RBAC, tenant isolation, rate limiting, input validation, headers, secrets, audit logging, and PDPA-relevant data handling.
- Backup strategy covers Supabase/Postgres backups, restore testing, file/config backup, retention, and ownership.
- Deployment checklist includes pre-deploy checks, migration checks, deploy commands, health checks, rollback, and post-deploy verification.

Exit gate:

- Eligible for production hardening release only after all critical findings have owner, severity, and fix plan.

## Current Baseline

Architecture:

- V7 Migration Program complete.
- Authority consolidation pattern validated across six waves.

Known production hardening concerns from previous readiness reports:

- Rate limiting should move from in-memory to Redis or an external store.
- Error tracking must be activated through environment-managed DSN.
- Audit logging should be expanded for admin and security-sensitive actions.
- End-to-end test coverage remains weaker than architecture coverage.
- Production readiness requires updated infrastructure, security, backup, and deployment verification.

## Phase Order

Recommended execution order:

1. Phase A: Legacy Retirement Audit
2. Phase C: End-To-End QA
3. Phase D: Observability
4. Phase E: Production Readiness
5. Phase B: Dashboard Simplification

Reason:

- Cleanup candidates should be known before QA.
- QA exposes production-critical gaps before instrumentation and release checks.
- Observability should be defined before production readiness scoring.
- Dashboard simplification should be driven by tested usage evidence, not assumptions.

## Required Program Outputs

| Phase | Output |
| --- | --- |
| A | `audit/legacy-retirement-report.md` |
| B | `audit/dashboard-v3-prd.md` |
| C | `audit/system-acceptance-test.md` |
| D | `audit/observability-plan.md` |
| E | `audit/production-readiness-report.md` |

## Final Hardening Gate

Production hardening is complete only when:

- all five required outputs exist
- all critical findings are fixed or explicitly accepted
- type-check passes
- acceptance tests pass or manual test evidence is documented
- production health endpoint passes after deploy
- rollback path is documented and tested
- no secrets are committed

## Next Task

Recommended next file:

- `A1_DEAD_CODE_AUDIT.md`

Recommended output:

- start `audit/legacy-retirement-report.md`
