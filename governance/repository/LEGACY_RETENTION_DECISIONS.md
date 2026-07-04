# Legacy Retention Decisions

Project: Repository Modernization Program v1.0
Wave: RMP-005 Legacy Repository Classification
Status: Classification baseline

## Purpose

This document records retention decisions for legacy repository assets before cleanup planning.

## Default Retention Decisions

| Asset Type | Decision | Basis |
| --- | --- | --- |
| Release evidence | Retain indefinitely | Repository Retention Policy |
| Audit evidence | Retain indefinitely | Repository Retention Policy |
| Approval and authorization records | Retain indefinitely | Repository Retention Policy |
| Requirements verification | Retain with project or release | Repository Retention Policy |
| Governance standards | Retain while active or referenced | Repository Retention Policy |
| Migration manifests | Retain indefinitely | Repository Retention Policy |
| Compatibility maps | Retain until old-path retirement approval | Cleanup Classification Standard |
| Runtime files | Excluded from documentation cleanup | Cleanup Classification Standard |
| Database migrations | Excluded and protected | Cleanup Classification Standard |
| Deployment configuration | Excluded and protected | Cleanup Classification Standard |

## Legacy-Specific Decisions

| Family | Decision | Rationale |
| --- | --- | --- |
| Legacy audit files | Retain | Audit evidence remains protected even when it describes retired functionality |
| Legacy bridge files | Retain | Bridge history supports compatibility and rollback context |
| Legacy retirement files | Retain | Retirement and deletion history must remain auditable |
| Migration specs and migration reports | Retain | They preserve project history and migration authority |
| Dependency audits and maps | Retain | They explain historical architecture and risk |
| Current RMP audit and re-audit reports | Retain | Active modernization evidence |
| Current RMP implementation packages | Retain | Active lifecycle state |
| Repository governance framework | Retain | Active authority for RMP execution |
| Business OS dependency models | Retain | Released project evidence |
| Audit-like docs outside `audit/` | Migrate or Review | Evidence should become discoverable through audit taxonomy before any archive decision |
| Template-like or placeholder files | Review | Candidate status cannot be assigned without reference and owner review |

## Compatibility Retention

Compatibility paths and stubs must remain until:

- New canonical paths exist.
- Registries point to canonical paths.
- Historical links are accounted for.
- Release and audit references remain discoverable.
- Retirement is separately approved.

## Archive Decision Boundary

Archive is allowed only when:

- The artifact is not release evidence.
- The artifact is not audit evidence.
- The artifact is not required by an active project.
- The artifact has a registry, manifest, compatibility map, or replacement link.
- The archive action is approved in a cleanup package.

## Deletion Decision Boundary

Deletion is not authorized by RMP-005 Stop A.

Future deletion requires:

- Classification.
- Proof of non-protected status.
- Reference scan.
- Archive or restore plan.
- Explicit operator approval.
- Validation and rollback evidence.

## Retention Decision Summary

RMP-005 establishes a conservative baseline:

- Protected evidence is retained.
- Active modernization artifacts are retained.
- Audit-like docs outside the audit taxonomy are migrated or reviewed, not deleted.
- Ambiguous placeholder or template-like files require review.
- No cleanup, archive execution, or deletion is approved.
