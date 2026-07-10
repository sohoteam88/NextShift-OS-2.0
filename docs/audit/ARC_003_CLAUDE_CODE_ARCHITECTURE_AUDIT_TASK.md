# ARC-003 Claude Code Architecture Audit Task

Version: 1.0  
Status: Ready for Audit

## Purpose

Define the official architecture audit scope for ARC-003 Engine Context Refactor.

The audit must be performed against the actual repository implementation and the results will become the basis for the official `ARC_003_AUDIT_REPORT.md`.

---

# Audit Baseline

Review compliance against:

- ARC-001 Platform Kernel & Member-Centric Identity Foundation
- ARC-002 Workspace Context Architecture
- ARC-003 Engine Context Refactor

Verify continued compliance with:

- AR-001 Member-Centric Identity
- AR-002 No Engine Duplication
- AR-003 Configuration Before Customization

---

# Files to Review

## Architecture

- docs/architecture/ARC-001_PLATFORM_KERNEL_MEMBER_CENTRIC_IDENTITY_FOUNDATION.md
- docs/architecture/ARC-002_WORKSPACE_CONTEXT_ARCHITECTURE.md
- docs/architecture/ARC-003_ENGINE_CONTEXT_REFACTOR.md

## Reports

- docs/audit/ARC_003_IMPLEMENTATION_REPORT.md
- docs/audit/ARC_003_CODEX_IMPLEMENTATION_REPORT.md
- docs/audit/ARC_003_VERIFICATION_CHECKLIST.md

## Source Code

Review:

- src/modules/workspace/
- request-workspace-context.ts
- workspace-engine-context.ts

Review shared engine integrations:

- Content
- CRM
- Analytics
- Funnel
- Landing
- Lead Magnet
- Traffic
- AI Coach
- AI COO

---

# Audit Checklist

## Workspace Context

- Request-level Workspace Context is centralized.
- Workspace Context propagation is consistent.
- No engine resolves workspace independently.

## Engine Layer

- No duplicated engines.
- No Retail/Recruitment engine forks.
- Shared engine strategy preserved.
- Workspace Context injected consistently.

## Legacy Refactor

- Remaining `track` usage correctly classified.
- Remaining `businessMode` usage documented.
- No new Operator references introduced.
- Legacy Operator references inventoried.

## Platform Integrity

- Platform Foundation preserved.
- Design System preserved.
- CAP-001 ~ CAP-008 preserved.
- Backward compatibility maintained.

## Validation

Review:

- Type Check
- Lint
- Tests
- Build

Confirm any failures are pre-existing where applicable.

---

# Required Audit Output

Claude Code should produce:

1. Audit Summary
2. Files Reviewed
3. Architecture Compliance
4. Findings
5. Risks
6. Regression Review
7. Validation Review
8. PASS / FAIL Decision
9. Release Recommendation

---

# Exit Criteria

ARC-003 may proceed to Release only if:

- Architecture PASS
- No critical regressions
- No duplicated engines
- No duplicated modules
- Backward compatibility preserved
- Design System regression: none
- CAP regression: none

If PASS, the next documents shall be:

- ARC_003_AUDIT_REPORT.md
- ARC_003_RELEASE_NOTES.md
