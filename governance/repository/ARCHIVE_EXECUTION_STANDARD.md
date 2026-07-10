# Archive Execution Standard

Project: Repository Modernization Program v1.0
Package: RMP-001A Execution Framework Planning
Status: Planning baseline

## Purpose

This standard defines how archive actions must be planned and executed inside RMP waves.

## Archive Principle

Archive is preservation. Archive is not deletion. Archive must happen before any future deletion request.

## Archive Eligibility

An artifact can be archive-eligible only when:

- It is not release evidence.
- It is not audit evidence.
- It is not active governance.
- It is not runtime source.
- It is not deployment configuration.
- It is not a database migration.
- It has a classification and disposition.
- It has an archive target and restore plan.

## Archive Manifest Fields

Every archive action must include:

- Source path.
- Archive path.
- Classification.
- Reason.
- Reference scan result.
- Compatibility action.
- Restore plan.
- Validation result.

## Archive Execution Steps

1. Confirm classification.
2. Confirm source path exists.
3. Confirm archive path is approved.
4. Confirm protected artifact exclusions.
5. Move or copy only approved files.
6. Update registry or archive manifest.
7. Validate links and status.
8. Capture rollback evidence.

## Archive Validation

Required checks:

```text
git status --short
git diff --check
git diff --cached --check
```

If markdown links change, run markdown link validation.

## Prohibited Archive Behavior

Archive execution must not:

- Delete the source after archive unless separately authorized.
- Rewrite audit reports.
- Rewrite release packages.
- Remove compatibility stubs.
- Hide archived artifacts from registries.
- Collapse evidence into summaries only.

## Completion Criteria

Archive action is complete only when:

- Archive manifest is present.
- Registry or index discovers the archive.
- Restore path is documented.
- Validation passes.
- Audit evidence can reference the archive action.
