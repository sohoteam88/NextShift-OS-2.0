# Platform Migration Record

Status: Consolidated historical migration record
Last Updated: 2026-07-10

## Purpose

This record consolidates the prior compatibility map, migration manifest, rollback checklist, and validation checklist artifacts for this registry area. The original source files are retained in `archive/governance-history/` for audit history.

## Source Files

- Original: `platform/PLATFORM_PROJECT_COMPATIBILITY_MAP.md` -> Archive: `archive/governance-history/platform/PLATFORM_PROJECT_COMPATIBILITY_MAP.md`
- Original: `platform/PLATFORM_PROJECT_MIGRATION_MANIFEST.md` -> Archive: `archive/governance-history/platform/PLATFORM_PROJECT_MIGRATION_MANIFEST.md`
- Original: `platform/PLATFORM_PROJECT_ROLLBACK_CHECKLIST.md` -> Archive: `archive/governance-history/platform/PLATFORM_PROJECT_ROLLBACK_CHECKLIST.md`
- Original: `platform/PLATFORM_PROJECT_VALIDATION_CHECKLIST.md` -> Archive: `archive/governance-history/platform/PLATFORM_PROJECT_VALIDATION_CHECKLIST.md`
- Original: `platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md` -> Archive: `archive/governance-history/platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md`
- Original: `platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md` -> Archive: `archive/governance-history/platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md`
- Original: `platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md` -> Archive: `archive/governance-history/platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md`
- Original: `platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md` -> Archive: `archive/governance-history/platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md`

---

## Source: PLATFORM_PROJECT_COMPATIBILITY_MAP.md

Original path: `platform/PLATFORM_PROJECT_COMPATIBILITY_MAP.md`
Archived path: `archive/governance-history/platform/PLATFORM_PROJECT_COMPATIBILITY_MAP.md`

# Platform Project Compatibility Map

Project: Repository Architecture Reset v1.0
Migration Unit: MU-005 Platform Project Migration
Status: Review map

## Purpose

This map defines compatibility handling for future migration of platform project documentation into `platform/projects/`.

## Compatibility Principles

1. Current project paths remain active until approved migration executes.
2. Future target paths are planned targets only until implemented and validated.
3. Old-path compatibility stubs are required for moved project roots.
4. Release package discovery remains delegated to [releases/index.md](../releases/index.md).
5. Audit evidence discovery remains delegated to [audit/index.md](../audit/index.md).
6. Runtime paths are not touched by MU-005.

## Compatibility Actions

| Current Path | Future Target Path | Compatibility Action |
| --- | --- | --- |
| `docs/nextshift-os-3/business-os/` | `platform/projects/business-os/` | Retain old-path README or stub after approved movement |
| `docs/nextshift-os-3/ui-kit/` | `platform/projects/ui-kit/` | Retain old-path README or stub after approved movement |
| `docs/nextshift-os-3/workspace-experience-framework/` | `platform/projects/workspace-experience-framework/` | Retain old-path README or stub after approved movement |
| `docs/nextshift-os-3/ai/` | `platform/projects/ai-engineering-foundation/` | Classify AI governance, prompts, knowledge, and release docs before movement |
| `docs/nextshift-os-3/design-system/` | `platform/projects/design-system/` | Retain old-path README or stub after approved movement |

## Old-Path Stub Pattern

```text
# Platform Project Moved

This platform project has moved to:

`platform/projects/{project}/`

The original path is retained for compatibility with historical links,
release records, audit evidence, and AI prompts.
```

## Link Preservation

Future migration must preserve links to:

- Release registry.
- Audit registry.
- Governance registry.
- Project release packages.
- Project audit reports.
- Requirements verification artifacts.
- Slice and lifecycle README files.

## Compatibility Validation

- Current project path resolves.
- Future target path is listed in `PLATFORM_PROJECT_MIGRATION_MANIFEST.md`.
- Lifecycle artifact count is preserved.
- Release package links remain discoverable.
- Audit links remain discoverable.
- `platform/index.md` links the project or compatibility path.

---

## Source: PLATFORM_PROJECT_MIGRATION_MANIFEST.md

Original path: `platform/PLATFORM_PROJECT_MIGRATION_MANIFEST.md`
Archived path: `archive/governance-history/platform/PLATFORM_PROJECT_MIGRATION_MANIFEST.md`

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

---

## Source: PLATFORM_PROJECT_ROLLBACK_CHECKLIST.md

Original path: `platform/PLATFORM_PROJECT_ROLLBACK_CHECKLIST.md`
Archived path: `archive/governance-history/platform/PLATFORM_PROJECT_ROLLBACK_CHECKLIST.md`

# Platform Project Rollback Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-005 Platform Project Migration
Status: Review checklist

## Purpose

This checklist defines rollback readiness for future approved platform project migration.

## Package Rollback

- [ ] Restore prior `platform/index.md`.
- [ ] Remove MU-005 package artifacts only if explicitly approved.
- [ ] Confirm current platform project paths still resolve.
- [ ] Confirm companion registries still resolve.
- [ ] Re-run diff checks.

## Future Project Migration Rollback

If future approved project movement occurs:

- [ ] Reverse each approved `git mv` operation.
- [ ] Restore old-path README files or compatibility stubs.
- [ ] Restore previous `platform/index.md` and `platform/status.md`.
- [ ] Confirm lifecycle artifact counts match pre-migration counts.
- [ ] Confirm release package references still resolve.
- [ ] Confirm audit evidence references still resolve.

## Rollback Validation

```text
git status --short
git diff --check
git diff --cached --check
```

Additional checks:

- [ ] Business OS current path resolves.
- [ ] UI Kit current path resolves.
- [ ] Workspace Experience Framework current path resolves.
- [ ] AI current path resolves.
- [ ] Design System current path resolves.
- [ ] No runtime files changed.

## Rollback Boundaries

Do not use destructive rollback commands unless explicitly approved.

Do not roll back unrelated files, including:

- Governance package files.
- Release registry files.
- Audit registry files or audit reports.
- Runtime source files.
- Release package content.

---

## Source: PLATFORM_PROJECT_VALIDATION_CHECKLIST.md

Original path: `platform/PLATFORM_PROJECT_VALIDATION_CHECKLIST.md`
Archived path: `archive/governance-history/platform/PLATFORM_PROJECT_VALIDATION_CHECKLIST.md`

# Platform Project Validation Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-005 Platform Project Migration
Status: Review checklist

## Required Command Validation

```text
git status --short
git diff --check
git diff --cached --check
```

## Link Validation

- [ ] `platform/index.md` local links resolve.
- [ ] MU-005 package artifact links resolve.
- [ ] Current project README links resolve.
- [ ] Companion registry links resolve:
  - [ ] `governance/index.md`
  - [ ] `releases/index.md`
  - [ ] `audit/index.md`

## Project Preservation Checks

- [ ] Business OS lifecycle artifacts remain discoverable.
- [ ] UI Kit lifecycle artifacts remain discoverable.
- [ ] Workspace Experience Framework lifecycle artifacts remain discoverable.
- [ ] AI Engineering Foundation artifacts remain discoverable.
- [ ] Design System lifecycle artifacts remain discoverable.
- [ ] Repository Architecture Reset artifacts are classified before movement.

## Artifact Count Checks

- [ ] Business OS markdown count preserved: 113.
- [ ] UI Kit markdown count preserved: 111.
- [ ] Workspace Experience Framework markdown count preserved: 132.
- [ ] AI markdown count preserved or classification delta documented: 28.
- [ ] Design System markdown count preserved: 50.

## Boundary Validation

- [ ] No runtime files changed.
- [ ] No package imports changed.
- [ ] No release package content rewritten.
- [ ] No governance migration performed.
- [ ] No audit taxonomy migration performed.
- [ ] No production or deployment changes performed.

## Future Migration Readiness

- [ ] Source-to-target manifest exists.
- [ ] Compatibility map exists.
- [ ] Rollback checklist exists.
- [ ] `git mv` operations are listed only as future approved operations.

---

## Source: PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md

Original path: `platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md`
Archived path: `archive/governance-history/platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md`

# Platform Structure Compatibility Map

Project: Repository Modernization Program v1.0
Wave: RMP-002 Platform Structure Migration
Status: Implementation package for review

## Purpose

This compatibility map preserves current platform and documentation paths while defining future platform structure handling.

## Compatibility Principle

Current paths remain active until new target paths exist, registries link to them, markdown links validate, and old-path retirement is separately approved.

## Compatibility Map

| Current Path | Future Target | Artifact Class | RMP-002 Action | Retirement Status |
| --- | --- | --- | --- | --- |
| [platform/index.md](index.md) | `platform/index.md` | Platform registry | Retain | Not eligible |
| [platform/status.md](status.md) | `platform/status.md` | Platform status | Retain | Not eligible |
| [docs/nextshift-os-3/README.md](../docs/nextshift-os-3/README.md) | `platform/projects/nextshift-os/README.md` | Documentation root | Map only | Not eligible |
| [docs/nextshift-os-3/MASTER_INDEX.md](../docs/nextshift-os-3/MASTER_INDEX.md) | `platform/projects/nextshift-os/MASTER_INDEX.md` | Master index | Map only | Not eligible |
| [docs/nextshift-os-3/PROJECT_STATUS.md](../docs/nextshift-os-3/PROJECT_STATUS.md) | `platform/projects/nextshift-os/PROJECT_STATUS.md` | Project status | Map only | Not eligible |
| [docs/nextshift-os-3/PROJECT_ROADMAP.md](../docs/nextshift-os-3/PROJECT_ROADMAP.md) | `platform/projects/nextshift-os/PROJECT_ROADMAP.md` | Project roadmap | Map only | Not eligible |
| [docs/nextshift-os-3/CAPABILITY_STATUS.md](../docs/nextshift-os-3/CAPABILITY_STATUS.md) | `platform/projects/nextshift-os/CAPABILITY_STATUS.md` | Capability status | Map only | Not eligible |
| [docs/nextshift-os-3/RUNTIME_STATUS.md](../docs/nextshift-os-3/RUNTIME_STATUS.md) | None in RMP-002 | Runtime status | Retain | Excluded |

## Stub Rules

Compatibility stubs are required before any future source path is retired.

Stub content must include:

- Current artifact identity.
- New canonical path.
- Historical path note.
- Link to the active registry.
- Retirement approval reference.

## Registry Rules

Future registry updates must:

- Preserve [Platform Index](index.md).
- Preserve [Platform Status](status.md).
- Link package artifacts only after review approval.
- Link future paths as future targets until implementation.
- Keep release discovery delegated to [Release Index](../releases/index.md).
- Keep audit discovery delegated to [Audit Index](../audit/index.md).
- Keep governance discovery delegated to [Governance Index](../governance/index.md).

## Protected Reference Classes

RMP-002 compatibility must preserve:

- Release references.
- Audit references.
- Requirements verification references.
- Governance standard references.
- Master index references.
- Project roadmap references.
- Platform registry references.

## Stop Conditions

Stop if:

- A current path is removed.
- A release or audit link becomes undiscoverable.
- Runtime migration is introduced.
- A future target is treated as active before implementation.
- Old-path retirement is attempted without approval.

## Compatibility Decision

RMP-002 maps platform structure compatibility but does not retire or delete any existing path.

---

## Source: PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md

Original path: `platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md`
Archived path: `archive/governance-history/platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md`

# Platform Structure Migration Manifest

Project: Repository Modernization Program v1.0
Wave: RMP-002 Platform Structure Migration
Status: Implementation package for review

## Purpose

This manifest defines the approved Platform Structure Migration package inventory and future migration boundaries.

## Manifest Scope

This Stop A manifest records package creation only. It does not authorize project folder movement, runtime migration, governance migration, release movement, audit migration, cleanup, deployment, commit, or push.

## Package Files

| File | Purpose | Action |
| --- | --- | --- |
| [RMP-002 Implementation Plan](RMP-002_IMPLEMENTATION_PLAN.md) | Defines wave scope and execution plan | Create |
| [Platform Structure Migration Manifest](../archive/governance-history/platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md) | Defines package inventory and migration boundaries | Create |
| [Platform Structure Compatibility Map](../archive/governance-history/platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md) | Maps current paths to compatibility handling | Create |
| [Platform Structure Validation Checklist](../archive/governance-history/platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md) | Defines required validation gates | Create |
| [Platform Structure Rollback Checklist](../archive/governance-history/platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md) | Defines rollback readiness | Create |

## Current Source Inventory

| Source Path | Classification | RMP-002 Action |
| --- | --- | --- |
| [platform/index.md](index.md) | Platform registry | Retain |
| [platform/status.md](status.md) | Platform status registry | Retain |
| [docs/nextshift-os-3/README.md](../docs/nextshift-os-3/README.md) | Documentation root | Retain |
| [docs/nextshift-os-3/MASTER_INDEX.md](../docs/nextshift-os-3/MASTER_INDEX.md) | Master index | Retain |
| [docs/nextshift-os-3/PROJECT_STATUS.md](../docs/nextshift-os-3/PROJECT_STATUS.md) | Project status | Retain |
| [docs/nextshift-os-3/PROJECT_ROADMAP.md](../docs/nextshift-os-3/PROJECT_ROADMAP.md) | Project roadmap | Retain |
| [docs/nextshift-os-3/CAPABILITY_STATUS.md](../docs/nextshift-os-3/CAPABILITY_STATUS.md) | Capability status | Retain |
| [docs/nextshift-os-3/RUNTIME_STATUS.md](../docs/nextshift-os-3/RUNTIME_STATUS.md) | Runtime status | Retain, runtime migration excluded |

## Future Target Inventory

Future targets are planning targets only until a later approved execution package authorizes movement.

| Future Target | Intended Purpose | Current Status |
| --- | --- | --- |
| `platform/projects/` | Future platform project registry domain | Not created by this package |
| `platform/architecture/` | Future platform architecture navigation domain | Not created by this package |
| `platform/registry/` | Future registry support domain | Not created by this package |
| `platform/status/` | Future status support domain | Not created by this package |

## Compatibility Actions

| Action | Path | Requirement |
| --- | --- | --- |
| Retain | `docs/nextshift-os-3/*` | Existing links remain active |
| Retain | `platform/index.md` | Remains current platform entry point |
| Retain | `platform/status.md` | Remains current status entry point |
| Map | Future target paths | Must remain labeled future targets until implemented |
| Stub | Old paths after future movement | Required before old-path retirement |

## Protected Artifacts

RMP-002 must not move or rewrite:

- Release packages.
- Audit reports.
- Governance standards.
- Runtime source files.
- Database migrations.
- Deployment configuration.
- Existing lifecycle artifacts outside the approved platform package.

## Validation Evidence Required

RMP-002 review requires:

- Package file presence check.
- `git status --short`.
- `git diff --check`.
- `git diff --cached --check`.
- Local markdown link validation.

## Manifest Decision

RMP-002 is an implementation package for review. The package records the platform structure migration approach but does not execute repository movement.

---

## Source: PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md

Original path: `platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md`
Archived path: `archive/governance-history/platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md`

# Platform Structure Rollback Checklist

Project: Repository Modernization Program v1.0
Wave: RMP-002 Platform Structure Migration
Status: Implementation package for review

## Purpose

This checklist defines rollback readiness for the RMP-002 Platform Structure Migration implementation package.

## Rollback Scope

This Stop A package creates documentation-only implementation package files. It does not move, delete, archive, or rewrite existing platform, governance, release, audit, runtime, or cleanup files.

## Package Files Subject To Rollback

| File | Rollback Action |
| --- | --- |
| `platform/RMP-002_IMPLEMENTATION_PLAN.md` | Remove only if explicitly authorized |
| `platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md` | Remove only if explicitly authorized |
| `platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md` | Remove only if explicitly authorized |
| `platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md` | Remove only if explicitly authorized |
| `platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md` | Remove only if explicitly authorized |

## Files Not Subject To Rollback

RMP-002 rollback must not alter:

- [Platform Index](index.md)
- [Platform Status](status.md)
- [Governance Index](../governance/index.md)
- [Release Index](../releases/index.md)
- [Audit Index](../audit/index.md)
- Current `docs/nextshift-os-3` source documents.
- Runtime source files.
- Release packages.
- Audit reports.

## Rollback Triggers

Rollback may be considered if:

- Required validation fails.
- Package scope is rejected.
- Compatibility mapping is rejected.
- A protected artifact is found to be in scope.
- Runtime migration is detected.

## Rollback Procedure

Because no existing files are modified by this package, rollback is limited to removal of the five package files after explicit approval.

Required rollback validation:

```text
git status --short
git diff --check
git diff --cached --check
```

Markdown link validation is required if registry links are added before rollback in a later task.

## Rollback Evidence

Rollback evidence must include:

- Trigger reason.
- Files removed.
- Files intentionally preserved.
- Validation results.
- Residual risk.

## Rollback Safety Rule

Do not run destructive commands, reset unrelated changes, or remove pre-existing repository artifacts without explicit operator approval.

---

## Source: PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md

Original path: `platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md`
Archived path: `archive/governance-history/platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md`

# Platform Structure Validation Checklist

Project: Repository Modernization Program v1.0
Wave: RMP-002 Platform Structure Migration
Status: Implementation package for review

## Purpose

This checklist defines validation required for the RMP-002 Platform Structure Migration implementation package.

## File Presence

| Check | Expected Result | Status |
| --- | --- | --- |
| `platform/RMP-002_IMPLEMENTATION_PLAN.md` exists | File present | Pending review |
| `platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md` exists | File present | Pending review |
| `platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md` exists | File present | Pending review |
| `platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md` exists | File present | Pending review |
| `platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md` exists | File present | Pending review |

## Required Git Validation

Run:

```text
git status --short
git diff --check
git diff --cached --check
```

Expected results:

- RMP-002 package files appear as untracked or staged additions.
- `git diff --check` reports no whitespace errors.
- `git diff --cached --check` reports no whitespace errors.

## Markdown Link Validation

Validate local links in:

- [RMP-002 Implementation Plan](RMP-002_IMPLEMENTATION_PLAN.md)
- [Platform Structure Migration Manifest](../archive/governance-history/platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md)
- [Platform Structure Compatibility Map](../archive/governance-history/platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md)
- [Platform Structure Validation Checklist](../archive/governance-history/platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md)
- [Platform Structure Rollback Checklist](../archive/governance-history/platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md)

Expected result:

- All local markdown links resolve.
- External link validation is not required because this package does not introduce external links.

## Boundary Validation

| Boundary | Expected Result |
| --- | --- |
| Runtime migration | Not present |
| Governance migration | Not present |
| Release package movement | Not present |
| Audit taxonomy migration | Not present |
| Cleanup | Not present |
| Deployment | Not present |
| Commit or push | Not performed |

## Compatibility Validation

Validate that:

- Current `docs/nextshift-os-3` paths remain active.
- [Platform Index](index.md) remains discoverable.
- [Platform Status](status.md) remains discoverable.
- Future target paths are labeled as future targets.
- Old-path retirement is not requested.

## Review Readiness

The package is ready for review when:

- All five package files exist.
- Git validation passes.
- Local markdown link validation passes.
- No runtime or protected artifact changes are present.
- Rollback checklist is complete.

---
