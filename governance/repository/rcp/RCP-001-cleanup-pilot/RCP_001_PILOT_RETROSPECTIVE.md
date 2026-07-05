# RCP-001 Pilot Retrospective

## Document Information
- Document Type: Repository Artifact
- Repository: YES
- Primary Executor: Codex
- Secondary Executor: Claude
- Next Step: Repository Integration and Governance Consistency Review

## Program
Repository Cleanup Program (RCP) v1.0

## Phase
RCP-001 Cleanup Pilot

## Status
Proposed

## Purpose
Capture lessons learned from the first governed cleanup operation and define reusable standards for RCP-002 through RCP-004.

## Release Baseline
- Commit: 759cfe7 docs(rcp-001): release cleanup pilot
- Tag: rcp-v1.0-pilot

## Pilot Candidate
```text
audit/beta-user-interview-template.md
```

## Pilot Result
RCP-001 successfully validated the cleanup governance workflow using archive-copy-only preservation.

## Objectives vs Results

| Objective | Result |
| --- | --- |
| Validate archive-before-delete workflow | PASS |
| Validate compatibility handling | PASS |
| Validate rollback readiness | PASS |
| Validate reference scanning | PASS |
| Validate cleanup governance | PASS |
| Avoid runtime impact | PASS |
| Avoid destructive cleanup | PASS |

## What Worked Well

1. Copy-only archive proved safer than immediate movement.
2. Source retention preserved active audit compatibility.
3. Archive manifest provided a clear rollback path.
4. Claude audit confirmed the implementation before commit.
5. Stop A / Stop B / Stop C lifecycle created a clean execution rhythm.

## Key Decision

The pilot established that archive does not always require source movement.

When active references remain, the preferred model is:

```text
Source retained
Archive copy created
Manifest records compatibility and rollback
Deletion prohibited
```

## Standardization Recommendations

For RCP-002 through RCP-004, every cleanup candidate should classify into one of three implementation models:

| Model | Use Case | Action |
| --- | --- | --- |
| Copy-only archive | Active references remain | Retain source, create archive copy |
| Move with compatibility stub | References can be redirected safely | Move source, leave stub |
| Full archive retirement | No active references and explicit approval exists | Archive and remove only after approval |

## Required Candidate Checks

Every future cleanup candidate must complete:

- Source existence check
- Reference scan
- Runtime dependency scan
- Protected evidence check
- Compatibility decision
- Archive target confirmation
- Rollback path confirmation
- Validation plan

## Metrics to Track

Future waves should record:

- Candidates reviewed
- Candidates archived
- Sources retained
- Compatibility stubs created
- References updated
- Runtime dependencies found
- Rollback paths created
- Audit findings
- Validation pass rate

## RCP-002 Readiness Assessment

RCP-002 may begin after this retrospective is integrated and accepted.

Recommended RCP-002 entry conditions:

- Candidate list selected from approved cleanup registers
- Each candidate classified before action
- Wave scope limited and reversible
- No runtime files included
- No protected release or audit evidence altered
- Claude audit required after implementation

## Non-Authorization

This retrospective does not authorize cleanup, archive movement, deletion, migration, runtime changes, commit, or push.

It only records RCP-001 learnings and prepares RCP-002 planning.
