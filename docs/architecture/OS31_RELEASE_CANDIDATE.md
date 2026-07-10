# OS31 Release Candidate (RC1)

Version: 3.1.0-rc1

Status: Release Candidate

Date: 2026-07-01

## Purpose

This document records the formal Release Candidate approval for NextShift OS 3.1 following successful completion of ARC-001 through ARC-006 and the Production Readiness Review.

## Scope

The RC includes:

- ARC-001 Platform Kernel & Member-Centric Identity
- ARC-002 Workspace Context Architecture
- ARC-003 Engine Context Refactor
- ARC-004 Retail Business OS Configuration
- ARC-005 Recruitment Business OS Configuration
- ARC-006 Workspace Presentation Layer Rendering

## Release Candidate Checklist

| Item | Result |
| --- | --- |
| Architecture complete | PASS |
| ARC-001 Released | PASS |
| ARC-002 Released | PASS |
| ARC-003 Released | PASS |
| ARC-004 Released | PASS |
| ARC-005 Released | PASS |
| ARC-006 Released | PASS |
| Claude Code audits | PASS |
| Production Readiness Review | PASS |
| Type Check | PASS |
| Workspace Tests | PASS |
| Build | PASS |
| Backward Compatibility | PASS |

Known non-blocking items:

- Workspace Persistence Migration
- Operator-to-Member RBAC Migration
- `businessMode` consolidation
- Browser / Playwright visual QA
- Existing mission-engine PostgreSQL dependency

## Approval

NextShift OS 3.1 is approved as **Release Candidate 1 (RC1)**.

The platform is ready for:

1. Git Release Checkpoint
2. Local Git Tag
3. VPS Deployment
4. Production Smoke Testing

## Planned Version Tags

Release Candidate:

```text
v3.1.0-rc1
```

Production:

```text
v3.1.0
```

## Next Step

Generate and execute the Git Release Task:

- Create final release checkpoint.
- Create local Git tag.
- Do not push until production validation completes.
