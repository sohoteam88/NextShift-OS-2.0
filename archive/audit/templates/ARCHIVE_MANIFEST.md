# Audit Template Archive Manifest

Program: Repository Cleanup Program v1.0
Wave: RCP-001 Cleanup Pilot
Status: Implemented

## Archive Entry

| Field | Value |
| --- | --- |
| Source path | `audit/beta-user-interview-template.md` |
| Archive path | `archive/audit/templates/beta-user-interview-template.md` |
| Classification | Review |
| Reason | Template-like artifact selected for cleanup pilot archive validation |
| Archive action | Copy only |
| Source retained | Yes |
| Deletion authorized | No |
| Runtime impact | None |

## Reference Scan Result

Exact source path references were found in audit and repository governance artifacts. The original source path remains in place, so existing references remain valid and no compatibility stub is required.

## Dependency Verification

The candidate is a Markdown template. No runtime imports, package dependencies, database migrations, deployment configuration, or executable references were identified.

## Compatibility Action

Compatibility is preserved by retaining `audit/beta-user-interview-template.md` at its original path while adding the archive copy.

## Restore Plan

If rollback is required, restore from:

```text
archive/audit/templates/beta-user-interview-template.md
```

to:

```text
audit/beta-user-interview-template.md
```

Then reverse this manifest entry if directed and re-run validation.

## Validation

Required validation:

```text
git diff --check
git diff --cached --check
Markdown link validation
```
