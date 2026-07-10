# Repository Cleanup Framework v1.1

## Document Information
- Document Type: Repository Artifact
- Repository: YES
- Primary Executor: Codex
- Secondary Executor: Claude
- Next Step: Repository Integration and Governance Consistency Audit

## Status
Proposed

## Purpose
This framework upgrades the Repository Cleanup Program execution model using lessons validated by RCP-001 Cleanup Pilot.

## Baseline Evidence
- Engineering OS v1.0 released
- RCP-000 initialized and released
- RCP-001 cleanup pilot released
- RCP-001 pilot retrospective completed
- RCP-001 wave closure completed

## Framework Objective
Standardize cleanup execution for RCP-002 through RCP-004 and prepare evidence for RCP-005 Repository v4 Release.

## Cleanup Strategy Models

| Model | Use Case | Required Action |
| --- | --- | --- |
| Copy-only archive | Active references remain | Retain source, create archive copy, record manifest |
| Move with compatibility stub | References can be safely redirected | Move source, leave compatibility stub |
| Full archive retirement | No active references and explicit approval exists | Archive, verify rollback, remove only after approval |

## Compatibility Decision Tree

1. Does the candidate have active references?
   - Yes: use copy-only archive or compatibility stub.
   - No: continue.

2. Is the candidate protected evidence?
   - Yes: stop cleanup.
   - No: continue.

3. Is the candidate runtime, deployment, migration, package, or database related?
   - Yes: stop cleanup unless separately authorized.
   - No: continue.

4. Is rollback documented?
   - No: stop cleanup.
   - Yes: proceed to audit.

## Required Candidate Checks

Every cleanup candidate must complete:

- Source existence check
- Reference scan
- Runtime dependency scan
- Protected evidence check
- Release evidence check
- Audit evidence check
- Compatibility decision
- Archive target confirmation
- Rollback path confirmation
- Validation plan

## Archive Manifest Standard

Every archived candidate must include or reference an archive manifest containing:

- Source path
- Archive path
- Classification
- Archive action
- Source retained status
- Compatibility handling
- Reference scan result
- Rollback plan
- Deletion authorization status
- Validation requirements

## Rollback Standard

Rollback must be possible without history rewrite.

Minimum rollback evidence:

- Restore source path
- Restore compatibility path if used
- Re-run git diff --check
- Re-run git diff --cached --check
- Re-run Markdown link validation when documentation links changed

## Wave Metrics Standard

Every cleanup wave must track:

- Candidates reviewed
- Candidates archived
- Sources retained
- Compatibility stubs created
- References updated
- Runtime dependencies found
- Protected evidence blocked
- Rollback paths created
- Audit findings
- Validation pass rate

## Wave Lifecycle

Every RCP cleanup wave follows:

```text
Stop A: Planning
Stop B: Implementation
Audit: Repository Audit
Stop C: Release
Retrospective
Wave Closure
Frozen
```

## Stop Conditions

Stop cleanup if:

- Protected evidence is in scope
- Release evidence would be altered
- Audit evidence would be rewritten
- Runtime files are included
- Rollback is missing
- Compatibility is unclear
- Validation fails
- Explicit approval is missing for destructive action

## RCP-002 Readiness

RCP-002 may begin after this framework is integrated and accepted.

RCP-002 should validate batch cleanup using a small, reversible candidate set.

## Non-Authorization

This framework does not authorize cleanup, archive movement, deletion, migration, runtime changes, commit, or push.

It defines the standard that future cleanup waves must follow.
