# Governance Validation Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-002 Governance Migration
Status: Review checklist

## Required Command Validation

```text
git status --short
git diff --check
git diff --cached --check
```

## Link Validation

- [ ] `governance/index.md` local links resolve.
- [ ] MU-002 package artifact links resolve.
- [ ] Current governance source paths resolve.
- [ ] Companion registry links resolve:
  - [ ] `platform/index.md`
  - [ ] `platform/status.md`
  - [ ] `releases/index.md`
  - [ ] `audit/index.md`

## Governance Discoverability

- [ ] Constitution current path is linked.
- [ ] Product governance current path is linked.
- [ ] Engineering standards current path is linked.
- [ ] Documentation standards current path is linked.
- [ ] ADR current path is linked.
- [ ] RFC current path is linked.
- [ ] Standards index current path is linked.

## Required Standards Discoverability

- [ ] STD-004 Release Governance is discoverable.
- [ ] STD-005 GitHub Alignment is discoverable.
- [ ] STD-006 v1.0 Project Execution Orchestration is discoverable.
- [ ] STD-006 v1.1 Project Execution Orchestration is discoverable.
- [ ] STD-007 Repository Canonical Resolution is discoverable.

## Boundary Validation

- [ ] No runtime files changed.
- [ ] No release package files changed.
- [ ] No audit files changed by MU-002.
- [ ] No platform project folders moved.
- [ ] No production or deployment files changed.

## Compatibility Validation

- [ ] Current paths remain active.
- [ ] Future target paths are labeled as planned.
- [ ] Compatibility stubs are defined for future movement.
- [ ] Engineering standards release packages are excluded.
- [ ] Rollback checklist exists.
