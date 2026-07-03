# Engineering Standards v1.1 Release Notes

Version: 1.1
Status: Released
Last Updated: 2026-07-03

---

## Summary

Engineering Standards v1.1 promotes STD-007 Repository Canonical Resolution Standard into the active NextShift engineering baseline.

This release extends Engineering Standards v1.0 with explicit rules for resolving conflicts between repository artifacts and conversation context.

---

## Standards Released

| Standard | Purpose | Canonical Document |
| --- | --- | --- |
| STD-001 Engineering Workflow | Defines lifecycle order for documentation-driven engineering work. | [NEWS v1.0](../../NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md) |
| STD-002 AI Role Framework | Defines durable engineering roles and separation of duties. | [STD-002](../../STD-002_AI_ROLE_FRAMEWORK_v1.0.md) |
| STD-003 Documentation Standard | Defines document structure, naming, metadata, and traceability. | [STD-003](../../STD-003_DOCUMENTATION_STANDARD_v1.0.md) |
| STD-004 Release Governance | Defines release levels, gates, release package, and approval rules. | [STD-004](../../STD-004_RELEASE_GOVERNANCE_v1.0.md) |
| STD-005 GitHub Alignment Standard | Defines branch, tag, VPS revision, and production alignment rules. | [STD-005](../../STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md) |
| STD-006 Project Execution Orchestration Standard | Defines state detection, stop points, continuation, and cross-standard orchestration. | [STD-006](../../STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md) |
| STD-007 Repository Canonical Resolution Standard | Defines repository-first conflict resolution for AI assistants. | [STD-007](../../STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md) |

---

## Release Value

- Makes repository artifacts explicitly canonical over conversation history.
- Prevents AI assistants from advancing from stale conversation assumptions.
- Standardizes capability-resolution behavior when conversation and repository disagree.
- Aligns AI Engineering Foundation with the active standards baseline.
- Preserves STD-006 lifecycle continuation while clarifying source-of-truth rules.

---

## Known Limitations

- This release is documentation-only.
- It does not promote changes into `release/os-3.1-rc1`.
- It does not move release tags.
- It does not deploy production.
