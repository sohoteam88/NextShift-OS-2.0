# Advisory Registry

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Track carry-forward audit advisories across NextShift platform projects.

---

## Registry Fields

| Field | Description |
| --- | --- |
| Advisory ID | Stable advisory identifier |
| Source | Project, slice, audit, or review where the advisory originated |
| Severity | Blocking, high, medium, low, or informational |
| Status | Open, accepted, deferred, resolved, or superseded |
| Owner | Owning project or area |
| Resolution Target | Planned project, slice, or milestone |
| Carry-Forward Decision | Whether later projects must mention or act on the advisory |

---

## Current Carry-Forward Advisories

| Advisory ID | Source | Severity | Status | Owner | Resolution Target | Carry-Forward Decision |
| --- | --- | --- | --- | --- | --- | --- |
| DP11-A001 | Runtime Platform v1.0 | Low | Open | Runtime Platform | Future runtime hardening | Mention in dependent platform reviews |
| DP11-A002 | Developer Platform Review | Medium | Open | Developer Platform | Developer Platform v1.1 | Implement validation controls before v1.2 promotion |
| DP11-A003 | Runtime Platform Automation Review | Medium | Open | Developer Platform | Developer Platform v1.1 | Add link and navigation validation |
| DP11-A004 | Developer Platform Review | Medium | Open | Engineering Governance | Engineering Playbook v1.2 | Add governed workflow policy after controls pass |

---

## Update Rule

Every project-level audit should state whether existing open advisories are:

- accepted
- resolved
- deferred
- superseded
- carried forward unchanged
