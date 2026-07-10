# Audit Registry

Status: Active audit entrypoint

Last Updated: 2026-07-10

## Purpose

This directory keeps current audit evidence for release, platform, and governance review.

Older audit evidence remains preserved under `archive/audit-history/` when it ages out of the active audit registry.

## Active Audit Whitelist

`audit/` is now whitelist-only.

Only these files remain active in `audit/`:

- [Audit Registry](README.md)
- [OS33 C1-C2 PR16-PR19 Code Review Report](OS33_C1_C2_PR16_PR19_CODE_REVIEW_REPORT.md)
- [OS33 C3-C6 PR20-PR21 Code Review Report](OS33_C3_C6_PR20_PR21_CODE_REVIEW_REPORT.md)

All other pre-OS 3.3 per-feature audit files are archived under `archive/audit-history/` by `git mv`.

## Audit Granularity

Audit granularity is now per-release by default.

Per-feature audit files should be created only when a release gate explicitly requires feature-level evidence. Otherwise, feature evidence should be summarized in the relevant release audit or release verification package.

## Archive Location

- [Audit History](../archive/audit-history/)
