# MU-002 Implementation Plan

Project: Repository Architecture Reset v1.0
Migration Unit: MU-002 Governance Migration
Status: Implementation package for architecture review

## Purpose

This plan defines the governance migration package for Chief Repository Architect review. It prepares migration manifests, compatibility handling, validation gates, and rollback readiness without moving current governance assets.

## Scope

Included:

- Governance registry refinement.
- Constitution migration package.
- Standards migration package.
- ADR and RFC governance migration planning.
- Compatibility and rollback documentation.

Excluded:

- Runtime migration.
- Release package migration.
- Audit migration.
- Platform project migration.
- Production, release branch, or tag changes.

## Current Source Areas

- [docs/nextshift-os-3/governance](../docs/nextshift-os-3/governance)
- [docs/nextshift-os-3/engineering](../docs/nextshift-os-3/engineering)
- [docs/nextshift-os-3/constitution](../docs/nextshift-os-3/constitution)
- [docs/nextshift-os-3/standards](../docs/nextshift-os-3/standards)
- [docs/nextshift-os-3/adr](../docs/nextshift-os-3/adr)
- [docs/nextshift-os-3/rfc](../docs/nextshift-os-3/rfc)
- [docs/nextshift-os-3/ai](../docs/nextshift-os-3/ai)

## Target Governance Structure

```text
governance/
  index.md
  constitution/
  engineering/standards/
  product/
  repository/
  documentation/
  release/
  github/
  ai/
  architecture/decisions/
  rfc/
```

## Implementation Sequence

1. Finalize `governance/index.md` as the MU-002 package entry point.
2. Record source-to-target mappings in `GOVERNANCE_MIGRATION_MANIFEST.md`.
3. Record old-path compatibility rules in `GOVERNANCE_COMPATIBILITY_MAP.md`.
4. Validate current registry links and required standard discoverability.
5. Keep release packages and runtime files untouched.
6. Hand off package for architecture review before any future file movement.

## Migration Boundary

No current governance files are moved by this package. Future migration may use `git mv` only after architecture approval and a concrete migration manifest.

## Required Review Questions

- Are target governance domains complete?
- Are current source paths preserved?
- Are engineering standards release packages excluded?
- Are ADR and RFC histories preserved?
- Are rollback and compatibility checks sufficient?
