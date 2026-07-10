# Audit Registry

Status: Active audit entrypoint

Last Updated: 2026-07-10

## Purpose

This directory keeps current audit evidence for release, platform, and governance review.

Older audit evidence remains preserved under `archive/audit-history/` when it ages out of the active audit registry.

## Retention Rule

Audit files older than 30 days should be moved to `archive/audit-history/` by `git mv`.

For the OS 3.3 governance slimdown, filename-dated audit files earlier than 2026-06-25 were moved into archive history. Audit files dated 2026-06-25 or later remain active.

## Audit Granularity

Audit granularity is now per-release by default.

Per-feature audit files should be created only when a release gate explicitly requires feature-level evidence. Otherwise, feature evidence should be summarized in the relevant release audit or release verification package.

## Current Exceptions

The OS 3.3 code review reports remain active even though they are release-support evidence:

- [OS33 C1-C2 PR16-PR19 Code Review Report](OS33_C1_C2_PR16_PR19_CODE_REVIEW_REPORT.md)
- [OS33 C3-C6 PR20-PR21 Code Review Report](OS33_C3_C6_PR20_PR21_CODE_REVIEW_REPORT.md)

## Archive Location

- [Audit History](../archive/audit-history/)
