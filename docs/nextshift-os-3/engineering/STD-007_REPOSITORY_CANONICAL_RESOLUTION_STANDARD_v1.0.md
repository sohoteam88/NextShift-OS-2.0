# STD-007 Repository Canonical Resolution Standard v1.0

Version: v1.0
Status: Approved
Last Updated: 2026-07-03

## Purpose

Define the canonical source resolution rules for all AI assistants working on NextShift OS.

## Canonical Source Hierarchy

Priority, highest to lowest:

1. Repository artifacts
2. Approved Planning documents
3. MASTER_INDEX.md
4. PROJECT_ROADMAP.md
5. PROJECT_STATUS.md
6. AI Bootstrap context
7. Conversation context

Conversation history must never override repository evidence.

## Repository-First Rules

Always:

- Detect lifecycle state from repository artifacts.
- Continue from the next required lifecycle phase.
- Verify files exist before advancing.
- Treat repository structure as the source of truth.

Never:

- Assume implementation exists from conversation alone.
- Regenerate completed lifecycle artifacts.
- Skip lifecycle gates.

## Capability Resolution

If conversation and repository disagree:

- Read Planning.
- Read MASTER_INDEX.
- Read PROJECT_ROADMAP.
- Follow the repository definition.

Example:

Conversation:

- BOS-004 Business Automation

Repository:

- BOS-004 Workspace Experience

Result:

- Repository wins.

## Lifecycle Resolution

```text
Planning
  -> Documentation
  -> Implementation
  -> Verification
  -> Audit
  -> Release Preparation
  -> Production
  -> Maintenance
```

## Required Repository Checks

Before implementation, verification, audit, or release:

```bash
pwd
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status
```

Before release:

```bash
git diff --check
git diff --cached --check
```

## Success Criteria

- Repository artifacts are canonical.
- All AI assistants reach the same conclusion from the same repository.
- Conversation never overrides repository evidence.
- Continuation follows STD-006.
