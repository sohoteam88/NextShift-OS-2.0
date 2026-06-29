# Sprint 000 Task 003 - Canonical Naming Alignment

Version: 1.0

Status: Active

Sprint: Sprint-000 Blueprint Cleanup

Priority: Medium

Owner: Codex

Reviewer: Claude Code

Approver: Chief Architect

## Purpose

This task aligns all architectural terminology with the official Naming Conventions.

The objective is to eliminate inconsistent terminology across the repository.

This task improves repository consistency.

It does not modify architectural behavior.

## Background

The Architecture Freeze Review identified inconsistent naming for core architectural concepts.

Example:

```text
Learning Layer
  -> Learning System
```

Both refer to the same architectural component.

The repository should expose only one canonical name.

## Objective

Standardize architectural terminology throughout the repository.

Every architectural concept should have exactly one official name.

## Scope

Included:

- Repository-wide terminology review
- Replace deprecated names
- Update internal references
- Align diagrams where applicable

Excluded:

- Architecture redesign
- New concepts
- Document restructuring
- Contract changes

## Canonical Terminology

The following names are mandatory.

### Core Systems

- Business Brain
- Decision Brain
- Execution Layer
- Learning System

### Core Knowledge

- Business Twin
- Business Memory
- Story Vault
- Knowledge Graph

### Core Intelligence

- Business Intelligence
- Decision Intelligence

### Core Components

- Recommendation Engine
- Strategy Engine
- Opportunity Engine
- Risk Engine
- Prioritization Engine
- Conversation Engine

## Required Cleanup

Repository search:

Replace:

```text
Learning Layer
  -> Learning System
```

Verify the following remain unchanged:

- Business Brain
- Decision Brain
- Execution Layer
- Business Twin
- Business Memory
- Story Vault
- Knowledge Graph

## Validation Rules

- Every occurrence should match the canonical terminology.
- No deprecated terminology should remain.
- Architecture diagrams should use canonical names.
- Future documents should reference `NAMING_CONVENTIONS.md`.

## Files to Review

Review every document under:

- Governance
- Foundation
- Constitution
- Reference
- Architecture
- Contracts
- MASTER_INDEX
- SYSTEM_CONTEXT
- START_HERE

## Acceptance Criteria

The task is complete when:

- No occurrence of "Learning Layer" remains.
- All architecture documents use "Learning System".
- Reference Architecture uses canonical terminology.
- MASTER_INDEX remains accurate.
- Claude Code reports zero naming inconsistencies for this issue.

## Expected Audit Result

This task should resolve:

Architecture Freeze Report

Medium Issue #3

Learning Layer vs Learning System

After Claude Code re-audit:

```text
Medium Issues
  1 -> 0
```

## Deliverables

- Updated repository terminology.
- Updated architecture references.
- Repository-wide naming consistency.

## Completion Checklist

- Repository search completed
- Deprecated names replaced
- Diagrams updated
- References verified
- Claude Code re-audit completed

## Guiding Principle

Architecture becomes easier to understand when every concept has one official name.

Consistent language creates consistent architecture.
