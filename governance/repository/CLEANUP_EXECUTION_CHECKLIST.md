# Cleanup Execution Checklist

Project: Repository Modernization Program v1.0
Wave: RMP-006 Cleanup Pilot Planning
Status: Planning baseline

## Purpose

This checklist defines the required controls for a future cleanup pilot implementation.

## Candidate

| Field | Value |
| --- | --- |
| Candidate path | `audit/beta-user-interview-template.md` |
| Classification | Review |
| Proposed action | Archive planning, then archive only if separately approved |
| Delete candidate | No |

## Preflight Checklist

| Check | Required Result | Status |
| --- | --- | --- |
| Candidate exists | `audit/beta-user-interview-template.md` present | Pending future execution |
| Candidate classification confirmed | Review | Pending future execution |
| Protected evidence check | Not audit evidence, release evidence, governance evidence, or runtime source | Pending future execution |
| Reference scan | No active references or references documented | Pending future execution |
| Owner approval | Owner approves archive disposition | Pending future execution |
| Archive manifest | Archive path documented | Pending future execution |
| Restore plan | Restore path and steps documented | Pending future execution |
| Compatibility plan | Old-path handling defined if archive executes | Pending future execution |

## Required Future Commands

Run before any future pilot action:

```text
git status --short
git diff --check
git diff --cached --check
```

Run after any future pilot action:

```text
git status --short
git diff --check
git diff --cached --check
```

Run markdown link validation if markdown links, registries, indexes, or manifests are changed.

## Future Archive Execution Checklist

Archive execution cannot proceed unless all preflight checks pass and implementation approval exists.

| Step | Action | Required Evidence |
| --- | --- | --- |
| 1 | Create archive manifest entry | Source path, target path, reason |
| 2 | Confirm compatibility handling | Old path behavior or no-reference evidence |
| 3 | Move candidate only if approved | File movement evidence |
| 4 | Validate links | Markdown validation output |
| 5 | Validate git state | Git validation output |
| 6 | Verify rollback | Restore procedure confirmed |

## Stop Conditions

Stop immediately if:

- Candidate is referenced by release evidence.
- Candidate is referenced by audit evidence as finding support.
- Candidate is required by active governance or project workflow.
- Candidate is runtime source or configuration.
- Owner approval is missing.
- Rollback is incomplete.
- Validation fails.

## Non-Authorization

This checklist does not authorize cleanup, archive execution, deletion, migration, commit, or push.
