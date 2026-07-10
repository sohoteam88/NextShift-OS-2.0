# Migration Wave Template

Project: Repository Modernization Program v1.0
Package: RMP-001A Execution Framework Planning
Status: Planning baseline

## Purpose

This reusable template defines the standard structure for every RMP modernization wave.

## Template

```text
# RMP-00X [Wave Name]

## Mission

[Describe the approved wave mission.]

## Authority

- RepoOS v1.0 checkpoint
- RAF v1.0 freeze
- RMP master plan
- RMP execution framework
- Prior wave completion evidence

## Scope

Included:
- [Allowed file/domain action]

Excluded:
- Runtime migration
- Release rewrite
- Audit evidence rewrite
- Cleanup deletion unless separately approved

## Dependencies

- [Required prior wave]
- [Required baseline artifact]
- [Required audit or verification evidence]

## Source Inventory

| Source Path | Classification | Action |
| --- | --- | --- |
| [path] | [retain/migrate/archive/compatibility/review] | [action] |

## Target Inventory

| Target Path | Purpose | Compatibility Requirement |
| --- | --- | --- |
| [path] | [purpose] | [required old path behavior] |

## Compatibility Plan

- [Registry update]
- [Compatibility stub]
- [Old path note]
- [Historical reference handling]

## Execution Steps

1. Run preflight validation.
2. Execute approved file actions.
3. Update registries and compatibility maps.
4. Run post-execution validation.
5. Capture evidence.

## Validation

```text
git status --short
git diff --check
git diff --cached --check
```

Markdown link validation is required when markdown links change.

## Rollback

- [Rollback command or manual reverse step]
- [Files restored]
- [Indexes restored]
- [Validation after rollback]

## Evidence

- Files added:
- Files changed:
- Files moved:
- Files archived:
- Files not touched:
- Validation result:
- Residual risk:

## Stop Conditions

- Validation failure
- Scope drift
- Runtime migration detected
- Protected artifact deletion detected
- Compatibility failure
```

## Template Use Rules

- Preserve headings unless a wave-specific contract requires a stricter format.
- Fill every section before execution begins.
- Do not execute from a partially completed template.
- Treat unknown classifications as `Review`.
- Treat deletion as prohibited unless separately authorized.
