# Pilot Success Criteria

Project: Repository Modernization Program v1.0
Wave: RMP-006 Cleanup Pilot Planning
Status: Planning baseline

## Purpose

This document defines measurable success criteria for the future cleanup pilot implementation review.

## Planning Success Criteria

RMP-006 Stop A planning succeeds when:

- A low-risk Review candidate is selected.
- Protected evidence is excluded.
- Cleanup execution checklist exists.
- Rollback plan exists.
- Success criteria are defined.
- No cleanup, archive movement, deletion, migration, commit, or push occurs.

## Future Implementation Success Criteria

A future approved pilot implementation succeeds only if:

- Candidate reference scan is complete.
- Owner approval is recorded.
- Release evidence is not changed.
- Audit evidence is not changed.
- Governance files are not changed.
- Runtime files are not changed.
- Archive manifest is complete.
- Compatibility behavior is documented.
- Rollback procedure is verified.
- Git validation passes.
- Markdown link validation passes if links change.

## Candidate-Specific Success Criteria

| Criterion | Expected Result |
| --- | --- |
| Candidate path | `audit/beta-user-interview-template.md` |
| Candidate remains unmodified until approval | Yes |
| Candidate classified as Review | Yes |
| Candidate not treated as delete candidate | Yes |
| Candidate archive target documented | `archive/audit/templates/beta-user-interview-template.md` |
| Candidate restore path documented | `audit/beta-user-interview-template.md` |

## Failure Criteria

The pilot fails if:

- Protected evidence is included.
- Candidate has unresolved active references.
- Archive executes without approval.
- Deletion is attempted.
- Runtime, release, audit evidence, or governance files are changed out of scope.
- Validation fails.
- Rollback cannot restore original state.

## Rollout Gate

Repository-wide cleanup cannot proceed until:

- Pilot implementation is approved.
- Pilot evidence is reviewed.
- Rollback readiness is confirmed.
- Cleanup governance confirms archive-before-delete controls worked.
- No protected evidence was affected.

## Final Planning Decision

RMP-006 Stop A produces a pilot package ready for implementation review. It does not authorize cleanup execution.
