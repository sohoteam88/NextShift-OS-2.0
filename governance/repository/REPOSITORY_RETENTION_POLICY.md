# Repository Retention Policy

Project: Repository Architecture Freeze v1.0
Package: RAF-001 Stop A Planning Package
Status: Frozen design baseline

## Purpose

This policy defines retention and archive rules before repository modernization or cleanup.

## Retention Principles

1. Released artifacts are retained indefinitely.
2. Audit evidence is retained indefinitely unless a formal archive policy supersedes it.
3. Governance standards remain retained while referenced by active workflows or release records.
4. Project lifecycle artifacts remain retained through at least one successor lifecycle.
5. Runtime source files are not governed by documentation cleanup policy.
6. Cleanup eligibility requires classification, validation, and approval.

## Retention Classes

| Class | Retention Rule |
| --- | --- |
| Release packages | Retain indefinitely |
| Release notes and manifests | Retain indefinitely |
| Approval and authorization records | Retain indefinitely |
| Audit reports | Retain indefinitely |
| Requirements verification | Retain with associated project or release |
| Governance standards | Retain while active or referenced |
| Superseded standards | Retain with supersession note |
| Project planning artifacts | Retain through release and successor handoff |
| Implementation reports | Retain with project history |
| Compatibility stubs | Retain until old paths are formally retired |
| Migration manifests | Retain indefinitely |
| Temporary scratch artifacts | Eligible after classification |

## Archive Policy

Archive is allowed only when:

- The artifact is not a release record.
- The artifact is not audit evidence.
- The artifact is not required by an active project.
- The artifact has a registry, manifest, or replacement link.
- The archive action is approved in a cleanup package.

## Deletion Policy

Deletion is not authorized by RAF-001.

Future deletion requires:

- Cleanup classification.
- Proof the file is not release, audit, governance, project, runtime, or compatibility evidence.
- Explicit operator approval.
- Rollback or restore plan.

## Compatibility Retention

Compatibility stubs and old-path indexes must remain until:

- New canonical paths are active.
- Registries point to canonical paths.
- Historical links are accounted for.
- Audit and release references remain discoverable.
