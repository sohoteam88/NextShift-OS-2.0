# OS 3.7 Command Center + Business Twin Release Candidate

Version: 3.7 RC  
Status: RC package prepared — awaiting review and post-deploy verification  
Last Updated: 2026-07-15

---

## Purpose

This package records the OS 3.7 delivery theme:

```text
Command Center becomes business-aware.
```

OS 3.7 completes the Command Center information architecture, adds a read-only Weekly Review, and makes Business Twin facts available to recommendation discussion without allowing duplicate or unbounded prompt content. It also closes the signup recovery break that could leave a verified Supabase account without an application tenant, and removes the remaining `generateWithFallback` bypasses around the AI router.

This is a documentation-only release-candidate package. It does not create `v3.7.0`, merge to `main`, deploy production, or grant release approval.

## Package

- [Release Manifest](RELEASE_MANIFEST.md)
- [Final Verification](FINAL_VERIFICATION.md)
- [Release Notes](RELEASE_NOTES.md)
- [Tag Preparation](TAG_PREPARATION.md)

## Included Scope

The execution range is PR #63–#74: C0–C2, T1–T2, G1–G3, F1–F2, and the four pipeline cycles that selected, reviewed, verified, merged, and recorded the work.

- C0: Business Score uses the exported domain score policy.
- C1: Command Center information architecture was decided before implementation.
- C2: Weekly Review reads existing memory; it adds no storage.
- T1/T2/F2: Business Twin is read from real sources, safely injected into discussion prompts, deduplicated at repository level, and bounded to 200 characters per field.
- G1/G2/G3: onboarding diagnosis and PostHog evidence are recorded; all four direct `generateWithFallback` call sites now use the AI router.
- F1: verified users can complete provisioning through callback and dangling-account recovery paths.

## Release Decision

```text
OS 3.7 RC package prepared; no ship-blocking source defect found.
```

The one remaining release condition is C-3: after an authorized deployment, verify a real dangling account can recover and that `user_signed_up` appears in PostHog. It is intentionally not claimed as complete by this package.

## Audit Evidence

- [Pipeline Audit 20260715-000338](../../../../audit/PIPELINE_AUDIT_20260715-000338.md): first PASS WITH CONDITION; C-1/C-2/A-2 filed.
- [Pipeline Audit 20260715-081449](../../../../audit/PIPELINE_AUDIT_20260715-081449.md): second PASS WITH CONDITION; C-1/C-2/A-2 closed; C-3 remains post-deploy only.
- [OS 3.7 Blueprint](../../OS_3_7_BLUEPRINT.md)
