# Platform Project Migration Manifest

Project: Repository Architecture Reset v1.0
Migration Unit: MU-005 Platform Project Migration
Status: Review manifest

## Purpose

This manifest maps current platform project documentation paths to future `platform/projects/` targets. It is a review artifact only and does not move project documentation.

## Project Source-to-Target Map

| Project | Current Path | Markdown Files | Future Target Path | Migration Status |
| --- | --- | ---: | --- | --- |
| Business OS | `docs/nextshift-os-3/business-os/` | 113 | `platform/projects/business-os/` | Planned |
| UI Kit | `docs/nextshift-os-3/ui-kit/` | 111 | `platform/projects/ui-kit/` | Planned |
| Workspace Experience Framework | `docs/nextshift-os-3/workspace-experience-framework/` | 132 | `platform/projects/workspace-experience-framework/` | Planned |
| AI Engineering Foundation | `docs/nextshift-os-3/ai/` | 28 | `platform/projects/ai-engineering-foundation/` | Planned classification required |
| Design System | `docs/nextshift-os-3/design-system/` | 50 | `platform/projects/design-system/` | Planned |
| Repository Architecture Reset | RAR packages and registries | To be classified | `platform/projects/repository-architecture-reset/` | Planned classification required |

## Lifecycle Artifact Families To Preserve

- `README.md`
- `PLANNING.md`
- `DOCUMENTATION_IMPLEMENTATION_CONTRACT.md`
- `EXECUTION_TASK.md`
- `ARCHITECTURE.md`
- `DEPENDENCY_MODEL.md`
- `CAPABILITY_MATRIX.md`
- `IMPLEMENTATION_STATUS.md`
- `IMPLEMENTATION_REPORT.md`
- `REQUIREMENTS_VERIFICATION.md`
- `VERIFICATION.md`
- `AUDIT_REPORT.md`
- `RELEASE_DECISION.md`
- `RELEASE_NOTES.md`
- `NEXT_PHASE_HANDOFF.md`
- release package references
- audit references

## Expected Future Git Operations

Future approved implementation may use:

```text
git mv docs/nextshift-os-3/business-os platform/projects/business-os
git mv docs/nextshift-os-3/ui-kit platform/projects/ui-kit
git mv docs/nextshift-os-3/workspace-experience-framework platform/projects/workspace-experience-framework
git mv docs/nextshift-os-3/design-system platform/projects/design-system
```

AI Engineering Foundation and Repository Architecture Reset require additional classification before movement.

## Excluded From MU-005

| Area | Reason |
| --- | --- |
| `src/` | Runtime migration excluded |
| `packages/` | Runtime package migration excluded |
| `docs/nextshift-os-3/**/releases/` content rewriting | Release package migration excluded |
| `governance/` migration | MU-002 scope |
| `releases/` migration | MU-003 scope |
| `audit/` taxonomy migration | MU-004 scope |
