# Governance Compatibility Map

Project: Repository Architecture Reset v1.0
Migration Unit: MU-002 Governance Migration
Status: Review map

## Purpose

This map defines compatibility handling for future governance migration. It preserves current paths while introducing future target governance locations.

## Compatibility Principles

1. Current paths remain active until approved migration executes.
2. Future target paths are not authoritative until implemented and validated.
3. Old-path compatibility stubs are required for moved documents.
4. Release packages are not moved by MU-002.
5. Runtime paths are not touched by MU-002.

## Compatibility Actions

| Current Path Family | Future Target Family | Compatibility Action |
| --- | --- | --- |
| `docs/nextshift-os-3/constitution/` | `governance/constitution/` | Old-path README and per-file stubs after future movement |
| `docs/nextshift-os-3/engineering/STD-*` | `governance/*/` by standard domain | Old-path stubs preserving standard names and versions |
| `docs/nextshift-os-3/governance/` | `governance/product/`, `governance/repository/`, `governance/documentation/` | Old-path retained index and per-file stubs |
| `docs/nextshift-os-3/adr/` | `governance/architecture/decisions/` | Retain ADR history index with target link |
| `docs/nextshift-os-3/rfc/` | `governance/rfc/` | Retain RFC history index with target link |
| `docs/nextshift-os-3/standards/` | `governance/standards/` | Retain standards index with target link |
| `docs/nextshift-os-3/ai/` | `governance/ai/` for governance-only AI docs | Classify before movement |

## Stub Template

```text
# Moved

This governance artifact has moved to:

`governance/{domain}/{artifact}`

The original path is retained for compatibility with historical links,
AI prompts, release references, and audit evidence.
```

## Compatibility Validation

- Current source path resolves.
- Future target path is listed in manifest.
- Old-path compatibility action is defined.
- `governance/index.md` links the current path.
- Companion registries remain reachable.

## Release Compatibility

Engineering standards release packages remain at current paths until a separate release migration is approved.

Current release package paths remain discoverable through:

- [releases/index.md](../releases/index.md)
- [docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.0/README.md](../docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.0/README.md)
- [docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.1/README.md](../docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.1/README.md)

## Runtime Compatibility

Runtime paths are unaffected:

- `src/`
- `packages/`
- `prisma/`
- `supabase/`
