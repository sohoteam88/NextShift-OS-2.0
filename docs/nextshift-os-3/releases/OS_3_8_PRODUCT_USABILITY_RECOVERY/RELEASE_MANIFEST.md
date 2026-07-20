# OS 3.8 — Product Usability Recovery Release Manifest

Proposal version: `v3.8.0`

Status: **Merged to `main`; Production Readiness NOT READY**
Last updated: 2026-07-20

---

## Release Identity

| Field | Value |
| --- | --- |
| Candidate name | OS 3.8 — Product Usability Recovery |
| Proposal version | `v3.8.0` |
| Package path | `docs/nextshift-os-3/releases/OS_3_8_PRODUCT_USABILITY_RECOVERY/` |
| Source branch | `planning/os-3.8-product-usability` |
| R1A preparation baseline SHA | `c579ef41ca204bedb0e141473579bea938edf333` |
| Release PR stage | [#109](https://github.com/sohoteam88/NextShift-OS-2.0/pull/109) merged |
| Release PR merge / current main SHA | `eabbcc3266b3bbddaaa8cf89ecf051592c8a7433` |
| Previous main baseline SHA | `76b573cdbf2f1bec31fe5770c080941469479d25` |
| Main state | OS 3.8 source merged; Production Readiness remains `NOT READY` |
| Current production | `v3.7.0` at `28c077f115a4e43c5e11e1097ae06b8744043643` |
| Audited product SHA | `0e77a4182ee4a12582084ed504cf1c939b46ccd5` |
| Final Audit request commit | `746a44acf51c50194826c2b0326fccb1d30c5446` |
| Final Audit result commit | `c579ef41ca204bedb0e141473579bea938edf333` |
| Final Audit verdict | `PASS` |
| Audit report | [`audit/OS38_FINAL_CODE_REVIEW_REPORT.md`](../../../../audit/OS38_FINAL_CODE_REVIEW_REPORT.md) |
| Audit report SHA-256 | `d805e9843976449586cce1e080802f3f67c8cf17e6866be7ed759ff498675c81` |
| Release gate | `BLOCKED` |
| Tag status | `TAG_STATUS=NOT_CREATED` |

## Delivery Evidence

| Task | Status | Product PR | Merge/evidence SHA | Implementation evidence |
| --- | --- | --- | --- | --- |
| E1 | completed | [#81](https://github.com/sohoteam88/NextShift-OS-2.0/pull/81) | `448ddb477fc1287ccc1fa4620477ffa802d49d58` | [E1 report](../../os-3-8/3.8-A/IMPLEMENTATION_REPORT.md) |
| E2 | completed | [#82](https://github.com/sohoteam88/NextShift-OS-2.0/pull/82) | `354452612c1802335ba0a05b7bf7ad5102e9c301` | [E2 report](../../os-3-8/3.8-B/IMPLEMENTATION_REPORT.md) |
| U1A | completed | [#84](https://github.com/sohoteam88/NextShift-OS-2.0/pull/84) | `99e7bb3eaf431b3b2d3e095e09aa9c83bcddaee4` | [U1A report](../../os-3-8/3.8-C/IMPLEMENTATION_REPORT.md) |
| U2 | completed | [#88](https://github.com/sohoteam88/NextShift-OS-2.0/pull/88) | `2e22f478bc092ee729d66e65b490565e3ac1723f` | [U2 report](../../os-3-8/3.8-C/U2_IMPLEMENTATION_REPORT.md) |
| U1B | completed | [#91](https://github.com/sohoteam88/NextShift-OS-2.0/pull/91) | `549830dc11e371c3041a0afc9a7f88be110b2d35` | [U1B report](../../os-3-8/3.8-C/U1B_IMPLEMENTATION_REPORT.md) |
| U3 | completed | [#93](https://github.com/sohoteam88/NextShift-OS-2.0/pull/93) | `0d4eed1b763265339b6958da279df93b5191a6fc` | [U3 report](../../os-3-8/3.8-C/U3_IMPLEMENTATION_REPORT.md) |
| U3A | completed | [#98](https://github.com/sohoteam88/NextShift-OS-2.0/pull/98) | `0678327511f218c78213829d12371817d9b06f63` | [U3A report](../../os-3-8/3.8-C/U3A_IMPLEMENTATION_REPORT.md) |
| U3ADR | completed | [#96](https://github.com/sohoteam88/NextShift-OS-2.0/pull/96) | `76636360d8c1a643c86bb26eb8923c6271241679` | [AuditLog decision](../../os-3-8/3.8-C/U3_AUDITLOG_ADR_DECISION.json) |
| U3B | completed | [#100](https://github.com/sohoteam88/NextShift-OS-2.0/pull/100) | `2444010463c2b75957c5b75125b3d55beb80f4f3` | [U3B report](../../os-3-8/3.8-C/U3B_IMPLEMENTATION_REPORT.md) |
| E3A | completed | [#95](https://github.com/sohoteam88/NextShift-OS-2.0/pull/95) | `2b3016e942839f8141d7fa784a2954d4a4c1d4e8` | [E3A report](../../os-3-8/3.8-D/E3A_IMPLEMENTATION_REPORT.md) |
| E3B | completed | [#103](https://github.com/sohoteam88/NextShift-OS-2.0/pull/103) | `688470906eea6970a0eebf8938472315d867e74c` | [E3B report](../../os-3-8/3.8-D/E3B_IMPLEMENTATION_REPORT.md) |

The [Pipeline Manifest](../../os-3-8/PIPELINE_MANIFEST.json) is the machine authority. It records every task above as `completed`, AR-W1/AR-W2/AR-W3 as `passed`, STEVEN-IA as `approved`, and Final Audit as `pass`.

## Checkpoint Evidence

| Checkpoint | Status | Reviewed SHA | Result |
| --- | --- | --- | --- |
| AR-W1 | passed | `354452612c1802335ba0a05b7bf7ad5102e9c301` | [W1 result](../../os-3-8/reviews/W1_ARCHITECTURE_REVIEW_RESULT.md) |
| AR-W2 | passed | `2e22f478bc092ee729d66e65b490565e3ac1723f` | [W2 result](../../os-3-8/reviews/W2_ARCHITECTURE_REVIEW_RESULT.md) |
| STEVEN-IA | approved | `2e22f478bc092ee729d66e65b490565e3ac1723f` | [Approval](../../os-3-8/approvals/STEVEN_IA_APPROVAL.md) |
| AR-W3 | passed | `688470906eea6970a0eebf8938472315d867e74c` | [W3 result](../../os-3-8/reviews/W3_ARCHITECTURE_REVIEW_RESULT.md) |
| Final Audit | pass | `0e77a4182ee4a12582084ed504cf1c939b46ccd5` | [Report](../../../../audit/OS38_FINAL_CODE_REVIEW_REPORT.md) |

## Database and Migration Inventory

These repository changes are part of the RC source but **have not been executed in production**:

- [`prisma/migrations/20260715220949_add_content_updated_at/migration.sql`](../../../../prisma/migrations/20260715220949_add_content_updated_at/migration.sql)
- [`supabase/migrations/20260717135456_u3b_three_space_audit.sql`](../../../../supabase/migrations/20260717135456_u3b_three_space_audit.sql)
- [`supabase/migrations/20260720134506_harden_audit_internal_tables_rls.sql`](../../../../supabase/migrations/20260720134506_harden_audit_internal_tables_rls.sql)
- [`scripts/u3b-admin-migration/install-audit-idempotency-authority.sql`](../../../../scripts/u3b-admin-migration/install-audit-idempotency-authority.sql)
- [`prisma/schema.prisma`](../../../../prisma/schema.prisma), representing the RC schema authority

Production migration requires separate explicit approval. This package does not grant or execute it.

The repository production entrypoint is [`scripts/deployment/run-os38-production-migrations.sh`](../../../../scripts/deployment/run-os38-production-migrations.sh). It binds the exact release SHA, validates the Prisma and Supabase ledgers, acquires one database advisory lock, applies the Prisma migration before the U3B Supabase migration and the additive audit-table RLS migration, skips the separate partial-index installer when the authoritative U3B migration owns that index, and requires RLS, privilege, policy and other catalog assertions before application deployment may begin. Its disposable PostgreSQL rehearsal is evidence only; no production database has been contacted or changed.

The migration entrypoint runs from the dedicated [`scripts/deployment/Dockerfile.migrations`](../../../../scripts/deployment/Dockerfile.migrations) artifact built from the exact release SHA. The workflow verifies its archive checksum, image digest, OCI revision and pinned Node/pnpm/Prisma/Bash/psql labels after transfer; it performs no production-host network installation. A failed migration prevents application retag/start and does not authorize an automatic database reset or rebuild.

## Authorization Boundary

- The Release Preparation governance PR was reviewed and merged.
- Planning-to-main Release PR #109 is merged at `eabbcc3266b3bbddaaa8cf89ecf051592c8a7433`.
- A Release PR is not production release approval.
- Production Readiness is `NOT READY`; merging source to `main` did not execute a production action.
- The canonical Final Release gate remains `blocked`; the genuine Final Release Approval and `READY` evidence artifacts do not yet exist.
- Production migration, deployment, tagging, GitHub Release creation, and production traffic changes remain unauthorized.
- `auto_tag=false`, `auto_deploy=false`, and `auto_release=false`; the release gate remains `BLOCKED`.

## Known v3.8.1 Follow-up

`PIPELINE_MANIFEST.json` still carries redundant `wave.status=running` values for W1 and W3. Task completion, checkpoint PASS results, human-gate approval, and Final Audit evidence remain the current validator's authoritative completion state, so this metadata mismatch is not a v3.8 release blocker.

For v3.8.1, unify the wave-status transition and make the validator enforce consistency between `wave.status` and task, checkpoint, human-gate, and Final Audit state. This release-lifecycle metadata finalization does not modify the Manifest or Pipeline.
