# Repository Architecture Freeze

Project: Repository Architecture Freeze v1.0
Package: RAF-001 Stop A Planning Package
Status: Frozen design baseline
Execution Mode: Design-only, read-only repository

## Purpose

This document freezes the approved RepoOS architecture before any large-scale repository modernization, cleanup, migration, or archive work.

## Freeze Authority

The architecture baseline is frozen from:

- RAR-001 corrected target architecture.
- RAR-003 repository navigation architecture.
- RAR-004 repository constitution.
- RAR-005 governance migration planning.
- RAR-006 migration execution planning.
- RAR-007 through RAR-011 migration-unit implementation packages.

## Frozen Top-Level Architecture

```text
/
  apps/
  packages/
  platform/
  docs/
  releases/
  audit/
  governance/
  operations/
  data/
  tests/
  tools/
  public/
  .github/
```

## Frozen Navigation Entry Points

| Entry Point | Frozen Role |
| --- | --- |
| `platform/index.md` | Platform and project navigation registry |
| `platform/status.md` | Current platform state and lifecycle navigation |
| `governance/index.md` | Governance and standards discovery registry |
| `releases/index.md` | Release package discovery registry |
| `audit/index.md` | Audit evidence discovery registry |

## Frozen Migration Order

```text
MU-001 Platform Registry Migration
  -> MU-002 Governance Migration
  -> MU-003 Release Registry Migration
  -> MU-004 Audit Registry Migration
  -> MU-005 Platform Project Migration
```

No platform project movement may occur before registry, governance, release, and audit migration units pass review.

## Frozen Boundary Rules

- Runtime migration is excluded.
- `src/*` to `apps/web/*` is deferred to a separate runtime migration lifecycle.
- Release packages are immutable evidence.
- Audit reports are preserved evidence and must not be rewritten as normal project docs.
- Current paths remain active until compatibility exists.
- Future target paths must be labeled as future targets until implemented and validated.
- Cleanup cannot delete files solely because a future target architecture exists.

## Frozen Release Path Standard

Future canonical release package paths use:

```text
releases/{domain}/v{semver}/
```

Original release identifiers remain preserved inside release metadata, manifests, compatibility maps, or package records.

## Freeze Non-Authorization

This freeze does not authorize:

- File deletion.
- Folder movement.
- Runtime refactoring.
- Release package migration.
- Audit evidence rewriting.
- Production deployment.
- Git tag or release branch creation.
