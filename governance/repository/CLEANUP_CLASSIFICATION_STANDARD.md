# Cleanup Classification Standard

Project: Repository Architecture Freeze v1.0
Package: RAF-001 Stop A Planning Package
Status: Frozen design baseline

## Purpose

This standard defines how repository files are classified before any cleanup, archive, deletion, or consolidation work.

## Classification Rule

No file may be cleaned up until it has exactly one primary classification and a documented disposition.

## Cleanup Classes

| Class | Disposition |
| --- | --- |
| Retain | Keep in current or migrated location |
| Migrate | Move later through approved migration unit |
| Archive | Move to archive only after approval |
| Compatibility | Keep as old-path stub or redirect |
| Review | Requires human or architect review |
| Delete Candidate | Requires separate deletion approval |
| Excluded | Out of cleanup scope |

## Protected Classes

The following are protected from cleanup deletion:

- Release packages.
- Release manifests.
- Release notes.
- Approval and authorization records.
- Audit reports.
- Requirements verification artifacts.
- Migration manifests.
- Compatibility maps.
- Governance standards.
- Runtime source files.
- Database migrations.
- Deployment configuration.

## Cleanup Eligibility

A file can be cleanup-eligible only if:

- It is not protected.
- It is not linked by a registry.
- It is not referenced by release or audit evidence.
- It is not required by current lifecycle state.
- A replacement or archive path exists.
- Rollback is possible.

## Required Cleanup Evidence

Future cleanup packages must include:

- File path.
- Classification.
- Reason.
- Current references.
- Proposed disposition.
- Validation plan.
- Rollback plan.

## Explicit Non-Authorization

RAF-001 classifies cleanup rules only. It does not authorize cleanup, archive movement, or deletion.
