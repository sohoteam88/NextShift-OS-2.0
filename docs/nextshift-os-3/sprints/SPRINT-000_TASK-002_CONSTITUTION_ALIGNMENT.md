# Sprint 000 Task 002 - Constitution Alignment

Version: 1.0

Status: Active

Sprint: Sprint-000 Blueprint Cleanup

Priority: High

Owner: Codex

Reviewer: Claude Code

Approver: Chief Architect

## Purpose

This task aligns the repository structure with the official architectural layer definitions.

The objective is to ensure that every document belongs to the correct architectural layer.

This task does not change architectural content.

It changes repository organization only.

## Background

Architecture Freeze Review identified an inconsistency between the repository folder structure and the official architectural layer definitions.

Several documents currently classified as Foundation actually define how NextShift operates.

They therefore belong to the Constitution layer.

This is a repository organization issue rather than an architecture issue.

## Objective

Move Constitution documents into the Constitution layer.

Update all references to preserve repository consistency.

## Scope

Included:

- Move documents
- Update references
- Update repository navigation
- Update architecture documentation

Excluded:

- Architecture redesign
- Content rewriting
- RFC changes
- Contract changes

## Documents to Move

Move the following files.

Current:

```text
01-foundation/
  PRODUCT_PHILOSOPHY.md
  BUSINESS_INTELLIGENCE_MODEL.md
  DECISION_INTELLIGENCE_MODEL.md
  AI_PRINCIPLES.md
```

Target:

```text
02-constitution/
  PRODUCT_PHILOSOPHY.md
  BUSINESS_INTELLIGENCE_MODEL.md
  DECISION_INTELLIGENCE_MODEL.md
  AI_PRINCIPLES.md
```

No content changes are required.

Only repository organization changes.

## Required Reference Updates

Update all references in:

- MASTER_INDEX.md
- SYSTEM_CONTEXT.md
- START_HERE.md
- PROJECT_ROADMAP.md
- NEXTSHIFT_REFERENCE_ARCHITECTURE.md
- COGNITIVE_ARCHITECTURE.md
- ARCHITECTURE_LAYER_DEFINITIONS.md
- ARCHITECTURE_FREEZE_CHECKLIST.md

Replace old paths with Constitution paths.

## Validation Rules

After completion:

- No document references the old Foundation location.
- MASTER_INDEX reflects the new structure.
- Repository reading order remains correct.
- No broken internal links remain.

## Layer Validation

Foundation answers:

How does reality work?

Constitution answers:

How should NextShift operate?

Every moved document should satisfy the Constitution definition.

## Acceptance Criteria

The task is complete when:

- All four documents are moved.
- Repository references are updated.
- MASTER_INDEX is correct.
- SYSTEM_CONTEXT is correct.
- Reference Architecture is correct.
- No broken references remain.

## Out of Scope

Do not:

- Rewrite document content.
- Rename documents.
- Introduce new concepts.
- Modify architecture.
- Create new RFCs.

Sprint-000 focuses on consistency.

## Expected Audit Result

This task should resolve:

Architecture Freeze Report

Medium Issue #2

Constitution vs Foundation Classification

After Claude Code re-audit:

```text
Medium Issues
  3 -> 2
```

## Deliverables

- Updated repository structure.
- Updated documentation references.
- Architecture consistency improved.

## Completion Checklist

- Documents moved
- References updated
- MASTER_INDEX verified
- SYSTEM_CONTEXT verified
- Reference Architecture verified
- Claude Code re-audit completed

## Guiding Principle

Repository structure should reflect architectural responsibility.

A document belongs to the layer that answers its primary architectural question.

Repository organization should strengthen architectural understanding rather than merely organize files.
