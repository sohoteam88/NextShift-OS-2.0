# Developer Platform v1.1 Workflow Hardening Project Planning

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-08

---

## Purpose

Developer Platform v1.1 hardens the validated but still experimental Developer Platform automation workflow before promotion into Engineering Playbook v1.2.

This project implements the governance and automation controls identified by the Developer Platform review and Runtime Platform v1.0 retrospective.

---

## Goal

Create the missing validation, navigation, advisory, Git checkpoint, project closure, and branch synchronization controls required to safely promote the workflow from experimental practice to governed Engineering Playbook v1.2 workflow.

---

## Scope

Developer Platform v1.1 planning covers six workstreams:

1. Markdown Link Validation through `pnpm docs:links`
2. Navigation Consistency Checker
3. Advisory Registry
4. Scoped Git Checkpoint Checklist
5. Project Closure Package Generator
6. Branch Synchronization Report

---

## Non-Goals

Developer Platform v1.1 must not:

- Implement Engineering Playbook v1.2.
- Promote the experimental workflow before hardening controls are complete.
- Modify runtime source.
- Implement new product features.
- Implement deployment platform behavior.
- Replace Engineering Playbook v1.1 authority.
- Convert AG-001 or AG-002 into lifecycle approval systems.

---

## Workstream Plan

| Workstream | Purpose | Expected Output |
| --- | --- | --- |
| Markdown Link Validation | Make docs link validation executable and repeatable | `pnpm docs:links` command and documentation |
| Navigation Consistency Checker | Detect stale, missing, or inconsistent navigation entries | navigation validation command or script |
| Advisory Registry | Track carry-forward audit advisories across projects | advisory registry document and update rules |
| Scoped Git Checkpoint Checklist | Standardize staged/out-of-scope/generated artifact evidence | checkpoint checklist document or command |
| Project Closure Package Generator | Standardize project retrospective and release closure packages | closure package source template or generator |
| Branch Synchronization Report | Standardize post-push branch sync evidence | branch sync reporting checklist or command |

---

## Success Criteria

Developer Platform v1.1 is successful when:

- Documentation link validation can be run from a standard command.
- Runtime Platform and future platform navigation can be checked consistently.
- Carry-forward advisories have a canonical registry.
- Git checkpoint reports include staged files, unstaged out-of-scope files, generated artifact state, branch, HEAD, and sync status.
- Project closure packages have a standard source set.
- Branch synchronization evidence can be produced consistently after push.
- Engineering Playbook v1.2 has enough implementation evidence to promote the workflow safely in a later project.

---

## Dependencies

Developer Platform v1.1 depends on:

- Developer Platform v1.0 freeze
- AG-001 Artifact Generator
- AG-002 Chat Bootstrap Generator
- AG-003 Engineering Playbook Automation Extension
- Runtime Platform v1.0 retrospective
- Developer Platform review and gap analysis

---

## Stop Condition

Stop after Developer Platform v1.1 Stop A planning package generation and validation. Do not implement hardening controls until Stop B is explicitly authorized.
