# OS 3.8 — Product Usability Recovery Release Candidate

Proposal version: `v3.8.0`

Status: **Release PR #109 open / awaiting Architecture Review**
Last updated: 2026-07-20

---

## Purpose

This documentation-only package prepares OS 3.8 for Release PR review. The release restores a usable content loop, converges navigation, separates member, tenant-admin, and platform-admin spaces, and closes the proven Video, Lead Magnet, and Webinar gaps.

The immutable R1A preparation baseline is `c579ef41ca204bedb0e141473579bea938edf333`; it is not the current Release PR exact head. Release PR [#109](https://github.com/sohoteam88/NextShift-OS-2.0/pull/109) is open from `planning/os-3.8-product-usability` to `main` and is awaiting Architecture Review. Its current exact head is recorded by GitHub PR metadata and the corresponding exact-head Architecture Review rather than self-embedded in this package. `main` remains the pre-OS-3.8 merge baseline at `76b573cdbf2f1bec31fe5770c080941469479d25`. The independent Final Audit reviewed product SHA `0e77a4182ee4a12582084ed504cf1c939b46ccd5` and returned `PASS`.

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
Release PR #109 is open and awaiting Architecture Review.
The release gate remains BLOCKED.
```

## Not Executed

- Release PR #109 was created, but it has not been merged.
- No merge to `main` was performed.
- No production migration was run.
- No deployment or production traffic change was performed.
- No `v3.8.0` tag or GitHub Release was created.
- No production environment was accessed or modified.
