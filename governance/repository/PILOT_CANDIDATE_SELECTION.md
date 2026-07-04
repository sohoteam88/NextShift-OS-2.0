# Pilot Candidate Selection

Project: Repository Modernization Program v1.0
Wave: RMP-006 Cleanup Pilot Planning
Status: Planning baseline

## Purpose

This document records cleanup pilot candidate selection from the RMP-005 Review-class candidates.

## Selection Rule

The pilot may include only a small, low-risk Review candidate set. Protected evidence must not be included.

## Candidate Review Matrix

| Candidate | Current Path | RMP-005 Classification | Evidence Risk | Pilot Decision |
| --- | --- | --- | --- | --- |
| Beta user interview template | `audit/beta-user-interview-template.md` | Review | Low | Include |
| Backup strategy document | `audit/backup-strategy.md` | Review | High | Exclude |
| Placeholder feature report | `audit/placeholder-feature-report.md` | Review | Medium | Exclude |
| Documentation dependency graph | `docs/dependency-graph.md` | Review | High | Exclude |
| Architecture migration plan | `docs/architecture/NS31_MIGRATION_PLAN.md` | Review | High | Exclude |

## Included Candidate

| Field | Value |
| --- | --- |
| Candidate | Beta user interview template |
| Current path | `audit/beta-user-interview-template.md` |
| Current classification | Review |
| Proposed pilot action | Archive planning only |
| Proposed archive path | `archive/audit/templates/beta-user-interview-template.md` |
| Delete candidate | No |
| Requires owner approval | Yes |
| Requires reference scan | Yes |
| Requires restore plan | Yes |

## Inclusion Rationale

The beta user interview template is suitable for pilot planning because:

- It is template-like rather than finding-bearing.
- It contains placeholder values such as `TBD`.
- It does not record an audit result.
- It does not contain a release authorization.
- It does not define runtime behavior.
- It is small enough to test workflow controls.

## Exclusion Rationale

| Candidate | Exclusion Reason |
| --- | --- |
| `audit/backup-strategy.md` | Contains production backup and restore policy; not low risk |
| `audit/placeholder-feature-report.md` | Records remediation status and should be treated as evidence |
| `docs/dependency-graph.md` | Represents system architecture dependency knowledge |
| `docs/architecture/NS31_MIGRATION_PLAN.md` | Represents architecture migration planning history |

## Required Pre-Implementation Checks

Before future pilot execution:

- Confirm candidate has no active references.
- Confirm owner agrees archive disposition is correct.
- Confirm no release package references candidate.
- Confirm no audit report references candidate as evidence.
- Confirm archive manifest path.
- Confirm rollback plan.

## Selection Decision

RMP-006 selects one candidate for pilot implementation review:

```text
audit/beta-user-interview-template.md
```

No cleanup, archive movement, deletion, migration, commit, or push is authorized by this selection.
