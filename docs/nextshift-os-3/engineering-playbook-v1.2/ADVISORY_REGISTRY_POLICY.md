# Advisory Registry Policy

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Govern carry-forward audit advisories across platform projects, workflow reviews, and release closures.

---

## Required Fields

Every advisory registry entry must include:

- advisory ID
- source project, slice, audit, or review
- severity
- status
- owner or owning area
- resolution target
- carry-forward decision

---

## Status Values

Use these advisory status values:

- Open
- Accepted
- Deferred
- Resolved
- Superseded

---

## Required Project Behavior

Every project-level audit or closure must state whether open advisories are:

- accepted
- resolved
- deferred
- superseded
- carried forward unchanged

---

## Carry-Forward Rules

Open advisories must be mentioned in dependent project reviews until resolved or superseded.

Medium or higher advisories must identify a resolution target before project closure.

Low advisories may remain deferred if the carry-forward decision is explicit.
