# OS 3.8 — Product Usability Recovery Release Candidate

Proposal version: `v3.8.0`

Status: **RC package prepared / Release Preparation approved**
Last updated: 2026-07-19

---

## Purpose

This documentation-only package prepares OS 3.8 for Release PR review. The release restores a usable content loop, converges navigation, separates member, tenant-admin, and platform-admin spaces, and closes the proven Video, Lead Magnet, and Webinar gaps.

The Release Candidate source is `planning/os-3.8-product-usability` at `c579ef41ca204bedb0e141473579bea938edf333`. `main` remains the pre-OS-3.8 merge baseline at `76b573cdbf2f1bec31fe5770c080941469479d25`. The independent Final Audit reviewed product SHA `0e77a4182ee4a12582084ed504cf1c939b46ccd5` and returned `PASS`.

This package is not a release, deployment, tag, production migration, or statement that OS 3.8 is production current. Production remains **v3.7.0** at `28c077f115a4e43c5e11e1097ae06b8744043643`, and the production release gate remains **BLOCKED**.

## Package Index

- [Release Manifest](RELEASE_MANIFEST.md)
- [Final Verification](FINAL_VERIFICATION.md)
- [Release Notes](RELEASE_NOTES.md)
- [Tag Preparation](TAG_PREPARATION.md)
- [Release Preparation Approval](../../os-3-8/approvals/STEVEN_RELEASE_PREPARATION_APPROVAL.md)
- [OS 3.8 Blueprint](../../OS_3_8_BLUEPRINT.md)
- [Final Audit Request](../../../../audit/OS38_FINAL_CODE_REVIEW_REQUEST.md)
- [Final Audit Report](../../../../audit/OS38_FINAL_CODE_REVIEW_REPORT.md)

## Current Decision

```text
RC package prepared / Release Preparation approved.
Awaiting governance PR review and merge before a separate planning-to-main Release PR may be created.
```

## Not Executed

- No planning-to-main Release PR was created.
- No merge to `main` was performed.
- No production migration was run.
- No deployment or production traffic change was performed.
- No `v3.8.0` tag or GitHub Release was created.
- No production environment was accessed or modified.
