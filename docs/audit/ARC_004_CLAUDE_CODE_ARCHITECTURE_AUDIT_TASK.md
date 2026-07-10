# ARC-004 Claude Code Architecture Audit Task

Version: 1.0  
Status: Ready for Audit

## Purpose

Perform the official architecture audit for ARC-004 Retail Business OS Configuration against the actual repository implementation.

The audit result will become the basis of the official `ARC_004_AUDIT_REPORT.md`.

---

# Audit Baseline

Review compliance with:

- ARC-001 Platform Kernel & Member-Centric Identity Foundation
- ARC-002 Workspace Context Architecture
- ARC-003 Engine Context Refactor
- ARC-004 Retail Business OS Configuration

Verify continued compliance with:

- AR-001 Member-Centric Identity
- AR-002 No Engine Duplication
- AR-003 Configuration Before Customization

---

# Files to Review

## Architecture

- docs/architecture/ARC-004_RETAIL_BUSINESS_OS_CONFIGURATION.md

## Reports

- docs/audit/ARC_004_IMPLEMENTATION_REPORT.md
- docs/audit/ARC_004_CODEX_IMPLEMENTATION_REPORT.md
- docs/audit/ARC_004_VERIFICATION_CHECKLIST.md

## Source Code

Review:

- src/modules/workspace/types.ts
- src/modules/workspace/workspace-config.ts
- src/modules/workspace/workspace-registry.ts

Review Retail manifest metadata:

- Navigation
- Dashboard widgets
- Capabilities
- CRM profile
- Content profile
- Funnel profile
- Landing templates
- Lead Magnet templates
- Analytics profile
- AI Coach profile
- AI COO profile

---

# Audit Checklist

## Retail Configuration

- Retail Workspace Manifest complete.
- Retail configuration is manifest-driven.
- No hardcoded Retail business logic in engines.

## Shared Platform

- Shared engines reused.
- No Retail engine forks.
- No cloned pages.
- No duplicated modules.
- Design System reused.

## Architecture

- Member-centric identity preserved.
- Workspace Context preserved.
- Workspace Registry remains authoritative.
- AI COO uses shared implementation.

## Validation

Review:

- Type Check
- Lint
- Tests
- Build

Confirm any failures are pre-existing.

---

# Required Audit Output

Claude Code should provide:

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

ARC-004 may proceed to Release only if:

- Architecture PASS
- No critical regressions
- No duplicated engines
- No duplicated modules
- No duplicated pages
- Design System regression: none
- CAP regression: none
- Backward compatibility maintained

If PASS, the next documents shall be:

- ARC_004_AUDIT_REPORT.md
- ARC_004_RELEASE_NOTES.md
