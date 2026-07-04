# Migration Freeze Matrix

Project: Repository Architecture Freeze v1.0
Package: RAF-001 Stop A Planning Package
Status: Frozen design baseline

## Purpose

This matrix freezes migration order, scope, boundaries, compatibility requirements, and validation gates for the Repository Modernization Program v1.0.

## Frozen Matrix

| Unit | Scope | Frozen Target | Boundary | Required Validation |
| --- | --- | --- | --- | --- |
| MU-001 Platform Registry | Platform navigation | `platform/index.md`, `platform/status.md` | No project movement | Link validation, diff checks |
| MU-002 Governance | Governance and standards planning | `governance/*` | No release packages, audit migration, runtime files | Link validation, standards discoverability, diff checks |
| MU-003 Release Registry | Release discovery | `releases/index.md`, future `releases/{domain}/v{semver}/` map | No release content rewrite, no tags, no production | Link validation, immutability checks, diff checks |
| MU-004 Audit Registry | Audit evidence discovery | `audit/index.md`, future audit taxonomy | No audit rewriting, deletion, or reinterpretation | Link validation, evidence preservation, diff checks |
| MU-005 Platform Projects | Platform project migration planning | `platform/projects/*` | No runtime, governance, release, or audit migration | Link validation, artifact counts, diff checks |

## Frozen Execution Order

1. MU-001 Platform Registry.
2. MU-002 Governance.
3. MU-003 Release Registry.
4. MU-004 Audit Registry.
5. MU-005 Platform Projects.

## Frozen Validation Baseline

Every implementation unit must run:

```text
git status --short
git diff --check
git diff --cached --check
```

Every markdown registry/package change must also run local markdown link validation.

## Frozen Rollback Requirement

Every migration unit must include:

- Files created.
- Files changed.
- Future files moved, if applicable.
- Compatibility actions.
- Rollback checklist.
- Validation after rollback.
