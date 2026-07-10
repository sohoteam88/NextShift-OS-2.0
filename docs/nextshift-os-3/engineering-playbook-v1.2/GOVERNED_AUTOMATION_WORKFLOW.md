# Governed Automation Workflow

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Promotion Decision

The Developer Platform automation workflow is promoted from experimental workflow to:

```text
Governed Engineering Automation Workflow
```

---

## Promotion Basis

Promotion is based on validated evidence from:

- AG-001 Artifact Generator
- AG-002 Chat Bootstrap Generator
- AG-003 Engineering Automation
- Runtime Platform v1.0
- Developer Platform v1.1 Workflow Hardening

---

## Governed Workflow

The governed workflow is:

```text
Planning
  -> Stop A package when handoff is needed
  -> Implementation
  -> Verification
  -> Audit
  -> Stop C release package when release handoff is needed
  -> Scoped Git release checkpoint
  -> Branch synchronization report
  -> Project closure package when project closure is required
```

Stop labels are handoff conveniences.

The lifecycle remains:

```text
Planning
  -> Implementation
  -> Verification
  -> Audit
  -> Release
```

---

## Required Controls

The governed workflow requires:

- scoped task execution
- canonical context loading
- explicit stop conditions
- documentation link validation
- navigation consistency validation
- scoped Git checkpoint evidence
- carry-forward advisory handling
- project closure evidence
- branch synchronization reporting

---

## Boundaries

The governed workflow must not:

- treat generated artifacts as approval
- treat AI bootstrap packages as verification
- bypass audit
- bypass release governance
- stage unrelated dirty files
- commit generated ZIP artifacts
- modify context package files without explicit scope
