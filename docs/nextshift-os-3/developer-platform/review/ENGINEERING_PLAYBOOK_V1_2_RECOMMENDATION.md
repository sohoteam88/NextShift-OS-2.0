# Engineering Playbook v1.2 Recommendation

Version: 1.0

Status: Recommended

Last Updated: 2026-07-08

---

## Purpose

Recommend Engineering Playbook v1.2 updates based on the Developer Platform review and Runtime Platform v1.0 workflow validation.

---

## Recommendation

Create Engineering Playbook v1.2 and promote the Developer Platform automation workflow as a governed workflow after adding required controls.

Recommended decision:

```text
Promote with conditions.
```

The workflow should not be promoted as-is because several validation and consistency checks remain manual.

---

## Required v1.2 Additions

### 1. Automation Governance

Document AG-001, AG-002, and AG-003 as approved engineering automation utilities.

Clarify:

- package generation is not approval
- chat bootstrap is not lifecycle evidence
- Stop A, Stop B, and Stop C are convenience packaging labels
- Engineering Playbook remains lifecycle authority

### 2. Markdown Link Validation

Add a required repository command:

```bash
pnpm docs:links
```

or equivalent.

Require it in:

- Stop B verification
- Stop C release preparation
- project release closure
- Git release checkpoints when documentation changes

### 3. Navigation Consistency Validation

Add a standard check for:

- MASTER_INDEX links
- project README links
- release package links
- duplicate or stale lifecycle entries

### 4. Advisory Carry-Forward Registry

Add a standard advisory registry with fields:

- advisory ID
- source slice or project
- severity
- status
- owner
- resolution target
- carry-forward decision

### 5. Scoped Git Checkpoint Checklist

Require every release checkpoint to report:

- staged files
- unstaged out-of-scope files
- ignored generated artifacts
- branch name
- HEAD before commit
- final branch sync

### 6. Final Project Closure Package

Require platform projects to close with:

- project release summary
- retrospective
- lessons learned
- automation review
- project audit report

---

## Experimental Workflow Decision

The experimental workflow should remain experimental until the v1.2 controls are implemented.

After implementation, promote it to:

```text
Governed Engineering Automation Workflow
```

---

## Runtime Platform Evidence

Runtime Platform v1.0 validated:

- repeatable Stop A / Stop B / Stop C package usage
- two-commit release/audit checkpoints
- generated artifact exclusion
- scoped staging discipline
- runtime validation command stability
- project retrospective and release closure artifacts

Runtime Platform v1.0 also exposed gaps:

- missing Markdown link validation command
- manual navigation maintenance
- manual advisory carry-forward
- manual project closure package creation

---

## Implementation Priority

Recommended order:

1. Add Markdown link validation.
2. Add navigation consistency validation.
3. Add advisory registry.
4. Add scoped Git checkpoint checklist.
5. Add final project closure package template.
6. Update Engineering Playbook to v1.2.

---

## Final Recommendation

Proceed with Engineering Playbook v1.2 planning.

Do not fully promote the workflow until the required controls are implemented and validated.
