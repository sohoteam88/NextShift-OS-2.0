# Cleanup Pilot Plan

Project: Repository Modernization Program v1.0
Wave: RMP-006 Cleanup Pilot Planning
Status: Planning baseline
Execution Mode: Design-only, no cleanup execution

## Purpose

This plan defines a controlled cleanup pilot using the approved RMP-005 legacy classification baseline before any repository-wide cleanup.

## Authority

This pilot follows:

- Repository Architecture Freeze v1.0.
- Repository Retention Policy.
- Cleanup Classification Standard.
- Cleanup Execution Policy.
- Archive Policy Execution.
- RMP Execution Framework.
- RMP-005 Legacy Repository Classification baseline.

## Pilot Objective

Validate the end-to-end cleanup workflow using one low-risk Review candidate while preserving compatibility, evidence, rollback readiness, and archive-before-delete governance.

## Pilot Candidate

| Candidate | Current Path | RMP-005 Classification | Pilot Disposition |
| --- | --- | --- | --- |
| Beta user interview template | `audit/beta-user-interview-template.md` | Review | Archive planning only |

## Why This Candidate

This candidate is selected because:

- It is a template, not an audit report.
- It has no audit result, finding, or release decision text.
- It is not runtime source.
- It is not release evidence.
- It is not governance evidence.
- It can test archive-before-delete workflow without including protected evidence.

## Excluded Candidates

| Candidate | Reason Excluded From Pilot |
| --- | --- |
| `audit/backup-strategy.md` | Operationally significant backup and restore strategy |
| `audit/placeholder-feature-report.md` | Remediation evidence and therefore evidence-bearing |
| `docs/dependency-graph.md` | Architecture dependency evidence |
| `docs/architecture/NS31_MIGRATION_PLAN.md` | Architecture migration planning evidence |
| `docs/system-page-legacy-residual-audit-2026-06-20.md` | Audit-like evidence requiring taxonomy migration |

## Pilot Boundary

This plan does not authorize:

- File movement.
- Archive execution.
- Deletion.
- Runtime changes.
- Release evidence changes.
- Audit evidence changes.
- Governance changes.
- Bulk cleanup.
- Commit.
- Push.

## Proposed Future Pilot Flow

Future implementation review may approve:

1. Reference scan for the candidate.
2. Owner confirmation that the file is a reusable template, not evidence.
3. Archive manifest creation.
4. Compatibility note or registry entry if required.
5. Archive movement only after approval.
6. Post-action validation.
7. Rollback verification.

## Required Future Validation

Any future pilot implementation must run:

```text
git status --short
git diff --check
git diff --cached --check
```

Markdown link validation is required if indexes, registries, manifests, or links change.

## Exit Criteria

The pilot planning package is ready for implementation review when:

- Candidate selection is justified.
- Protected evidence is excluded.
- Execution checklist exists.
- Rollback plan exists.
- Success criteria are measurable.
- No cleanup has been executed.
