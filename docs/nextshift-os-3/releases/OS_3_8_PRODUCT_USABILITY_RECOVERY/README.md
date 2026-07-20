# OS 3.8 — Product Usability Recovery Release Candidate

Proposal version: `v3.8.0`

Status: **Merged to `main`; Production Readiness NOT READY**
Last updated: 2026-07-20

---

## Purpose

This documentation-only package prepares OS 3.8 for Release PR review. The release restores a usable content loop, converges navigation, separates member, tenant-admin, and platform-admin spaces, and closes the proven Video, Lead Magnet, and Webinar gaps.

The immutable R1A preparation baseline is `c579ef41ca204bedb0e141473579bea938edf333`. Release PR [#109](https://github.com/sohoteam88/NextShift-OS-2.0/pull/109) was merged to `main` at `eabbcc3266b3bbddaaa8cf89ecf051592c8a7433`. The independent Final Audit reviewed product SHA `0e77a4182ee4a12582084ed504cf1c939b46ccd5` and returned `PASS`.

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
Release PR #109 is merged at main SHA eabbcc3266b3bbddaaa8cf89ecf051592c8a7433.
Production Readiness remains NOT READY until the separately governed environment, backup/restore, migration, rollback-image, deployment, and release gates are satisfied.
The release gate remains BLOCKED.
```

## Repository Readiness Contract

- Main CI now requires all four jobs, including E2E Secret Check and E2E Tests, on a `main` push.
- Production execution remains manual-only. Deploy requires the requested SHA to equal the canonical approved release; rollback keeps that approval bound to the approved release and separately requires the requested target to equal the exact rollback image frozen in readiness evidence.
- No genuine Final Release Approval or READY evidence artifact exists yet; this is intentional and keeps the current workflow non-deployable.
- OS 3.8 migrations run only inside a release-built migration image whose archive checksum, image digest, OCI revision and pinned toolchain labels are revalidated before database access.
- A future READY artifact must bind a fresh `production` GitHub Environment protection snapshot requiring Steven, plus a successful exact-release migration-image rehearsal. Neither evidence exists yet.
- On a fresh database, U3B creation and the additive audit-table RLS/revocation migration commit atomically with both ledger rows. An existing complete U3B install receives only the additive hardening; partial ledger/catalog state is rejected.
- Before any separately authorized production migration, a repository-external logical backup, checksum and successful isolated restore verification remain mandatory.

## Not Executed

- OS 3.8 has not been deployed to production; production remains `v3.7.0`.
- No production migration was run.
- No deployment or production traffic change was performed.
- No `v3.8.0` tag or GitHub Release was created.
- No production environment was accessed or modified.
