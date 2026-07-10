# Engineering Standards v1.1 Release Manifest

Version: 1.1
Status: Release Manifest
Last Updated: 2026-07-03

---

## Release Name

Engineering Standards v1.1

## Version

1.1

## Release Status

Planning Branch Release Package

## Branch

`planning/os-3.1-mvp-governance`

## Commit

Package source baseline before release-package commit:

```text
737a6be1d1d652d8d07b8f87f99c209f8321a365
```

The final package commit should be recorded in Git history when this release package is committed.

---

## Standards Included

| Standard | Canonical Document |
| --- | --- |
| STD-001 Engineering Workflow | [NEWS v1.0](../../NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md) |
| STD-002 AI Role Framework | [STD-002](../../STD-002_AI_ROLE_FRAMEWORK_v1.0.md) |
| STD-003 Documentation Standard | [STD-003](../../STD-003_DOCUMENTATION_STANDARD_v1.0.md) |
| STD-004 Release Governance | [STD-004](../../STD-004_RELEASE_GOVERNANCE_v1.0.md) |
| STD-005 GitHub Alignment Standard | [STD-005](../../STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md) |
| STD-006 Project Execution Orchestration Standard | [STD-006](../../STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md) |
| STD-007 Repository Canonical Resolution Standard | [STD-007](../../STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md) |

---

## Validation Summary

- Relative link validation required before release approval.
- `git diff --check` required.
- `git diff --cached --check` required.
- No production build required for this documentation-only release package.
- No VPS deployment required.

---

## Known Limitations

- No production release branch promotion is included.
- No release tag is created or moved by this package.
- No production deployment is included.
