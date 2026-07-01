# ARC-006 Claude Code Architecture Audit Task

Version: 1.0  
Status: Ready for Audit  
Architecture Track: NextShift OS 3.1

## Purpose

Perform the official architecture audit for ARC-006 Workspace Presentation Layer Rendering against the actual repository implementation.

The resulting findings will become the basis for `ARC_006_AUDIT_REPORT.md`.

---

# Audit Baseline

Review compliance with:

- ARC-001 Platform Kernel & Member-Centric Identity Foundation
- ARC-002 Workspace Context Architecture
- ARC-003 Engine Context Refactor
- ARC-004 Retail Business OS Configuration
- ARC-005 Recruitment Business OS Configuration
- ARC-006 Workspace Presentation Layer Rendering

Verify continued compliance with:

- AR-001 Member-Centric Identity
- AR-002 No Engine Duplication
- AR-003 Configuration Before Customization

---

# Files to Review

## Architecture

- docs/architecture/ARC-006_WORKSPACE_PRESENTATION_LAYER_RENDERING.md

## Reports

- docs/audit/ARC_006_IMPLEMENTATION_REPORT.md
- docs/audit/ARC_006_CODEX_IMPLEMENTATION_REPORT.md
- docs/audit/ARC_006_VERIFICATION_CHECKLIST.md

## Source Code

Review:

- src/components/layouts/TopBar.tsx
- src/modules/workspace/components/WorkspaceTopNavigation.tsx
- src/modules/workspace/components/WorkspaceDashboardMetadata.tsx
- src/modules/workspace/workspace-registry.ts

---

# Audit Checklist

## Presentation Layer

- Shared navigation consumes Workspace Registry metadata.
- Shared dashboard consumes Workspace Registry metadata.
- Shared template metadata rendering is preserved.
- AI profile metadata rendering is configuration-driven.
- Business capability metadata rendering is configuration-driven.

## Architecture

- No duplicated pages.
- No duplicated modules.
- No duplicated renderers.
- No duplicated engines.
- Workspace Registry remains authoritative.
- Workspace Context remains centralized.
- Member-centric identity preserved.
- Design System reused.

## Compatibility

- Existing routes unchanged.
- Existing CAP behaviour unchanged.
- Existing access control unchanged.
- Workspace fallback behaviour preserved.

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

ARC-006 may proceed to Release only if:

- Architecture PASS
- No critical regressions
- No duplicated pages/modules/renderers/engines
- Design System regression: none
- CAP regression: none
- Backward compatibility maintained

If PASS, the next documents shall be:

- ARC_006_AUDIT_REPORT.md
- ARC_006_RELEASE_NOTES.md
