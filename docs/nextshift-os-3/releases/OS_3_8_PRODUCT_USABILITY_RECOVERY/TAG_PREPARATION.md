# OS 3.8 — Product Usability Recovery Tag Preparation

Proposal version: `v3.8.0`

Status: `TAG_STATUS=NOT_CREATED`
Last updated: 2026-07-19

---

## Proposed Tag

```text
v3.8.0
```

This is a proposal only. No tag or GitHub Release has been created.

## Required Preconditions

Before any tag may be created:

1. This Release Preparation governance PR is reviewed and merged into `planning/os-3.8-product-usability`.
2. A separate planning-to-main Release PR is created, reviewed, and merged.
3. Steven separately approves the production migration plan.
4. Steven separately approves deployment.
5. Steven separately approves tag creation and production release.
6. The exact `main` Release PR merge result is revalidated as the tag target.

The future tag must bind the exact `main` release merge result at that time. It must not be bound now to planning SHA `c579ef41ca204bedb0e141473579bea938edf333` or audited product SHA `0e77a4182ee4a12582084ed504cf1c939b46ccd5`.

## Current Boundary

- `TAG_STATUS=NOT_CREATED`
- No `git tag` command was run.
- No tag was pushed.
- No GitHub Release was created.
- No deployment or production migration was performed.
- Production remains `v3.7.0` at `28c077f115a4e43c5e11e1097ae06b8744043643`.
