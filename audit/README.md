# Audit Registry

Status: Active audit entrypoint

Last Updated: 2026-07-14

## Purpose

This directory keeps current audit evidence for release, platform, and governance review.

Older audit evidence remains preserved under `archive/audit-history/` when it ages out of the active audit registry.

## Active Audit Whitelist

`audit/` is now whitelist-only.

Only these files remain active in `audit/`:

- [Audit Registry](README.md)
- [OS33 C1-C2 PR16-PR19 Code Review Report](OS33_C1_C2_PR16_PR19_CODE_REVIEW_REPORT.md)
- [OS33 C3-C6 PR20-PR21 Code Review Report](OS33_C3_C6_PR20_PR21_CODE_REVIEW_REPORT.md)
- [OS34 R3 PR23-PR31 Code Review Report](OS34_R3_PR23_PR31_CODE_REVIEW_REPORT.md)
- [OS34 R4 PR32-PR34 Code Review Report](OS34_R4_PR32_PR34_CODE_REVIEW_REPORT.md)
- [OS35 R5 PR38-PR47 Code Review Report](OS35_R5_PR38_PR47_CODE_REVIEW_REPORT.md)
- [OS36 R6 PR50-PR60 Code Review Report](OS36_R6_PR50_PR60_CODE_REVIEW_REPORT.md)
- [OS 3.7 Pipeline Audit 20260714-143721](PIPELINE_AUDIT_20260714-143721.md)
- [OS 3.7 Pipeline Audit 20260714-160343](PIPELINE_AUDIT_20260714-160343.md)

All other pre-OS 3.3 per-feature audit files are archived under `archive/audit-history/` by `git mv`.

## Audit Granularity

Audit granularity is now per-release by default.

Per-feature audit files should be created only when a release gate explicitly requires feature-level evidence. Otherwise, feature evidence should be summarized in the relevant release audit or release verification package.

## Archive Location

- [Audit History](../archive/audit-history/)
