# Compatibility Execution Standard

Project: Repository Modernization Program v1.0
Package: RMP-001A Execution Framework Planning
Status: Planning baseline

## Purpose

This standard defines compatibility rules for files, indexes, registries, and historical references affected by RMP waves.

## Compatibility Principle

Current paths remain active until replacement paths are implemented, indexed, validated, and approved for old-path retirement.

## Compatibility Requirements

Each migration wave must document:

- Existing path.
- New target path.
- Historical references.
- Registry updates.
- Compatibility stub or redirect behavior.
- Retirement criteria.
- Rollback action.

## Compatibility Actions

| Action | Use When |
| --- | --- |
| Retain old path | Historical or active references still depend on it |
| Stub old path | Content moved but old path must remain discoverable |
| Registry bridge | Index links old and new paths |
| Compatibility map | Multiple files or domains move together |
| Review hold | References cannot be fully resolved |

## Required Compatibility Map Fields

Every compatibility map must include:

- Source path.
- Target path.
- Artifact class.
- Action.
- Link status.
- Retirement status.
- Rollback path.

## Protected References

Compatibility must preserve references from:

- Release packages.
- Audit reports.
- Requirements verification.
- Governance standards.
- Master indexes.
- Project roadmaps.
- Platform registries.
- External links documented in release records.

## Retirement Criteria

Old paths can be retired only when:

- New path exists.
- Registry points to new path.
- Historical references are accounted for.
- Audit and release links remain discoverable.
- Rollback is available.
- Retirement is separately approved.

## Compatibility Validation

Compatibility validation must verify:

- New links resolve.
- Old-path handling is documented.
- Registry entries are present.
- Compatibility maps are complete.
- No protected reference is broken.

## Stop Conditions

Stop if:

- A release or audit reference breaks.
- A registry loses discoverability.
- Old-path retirement is attempted without approval.
- Target path is missing.
- Rollback path is missing.
