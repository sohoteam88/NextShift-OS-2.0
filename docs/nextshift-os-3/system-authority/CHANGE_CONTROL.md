# Authority Change Control

Version: 1.0

Status: Current

Last Updated: 2026-07-08

---

## Before Editing Protected Files

1. Read [Iron Laws](IRON_LAWS.md).
2. Identify the protected tier in [Protected Files](PROTECTED_FILES.md).
3. Read the source document and its parent authority.
4. Check branch state and GitHub alignment.
5. Search for existing versions, duplicates, release records, audit records, and RFCs.
6. Decide whether the change is:
   - correction;
   - clarification;
   - versioned update;
   - new standard;
   - deprecation;
   - historical evidence preservation.

## Required Evidence

Material authority changes should include:

- planning or RFC rationale;
- implementation summary;
- validation output;
- audit result;
- release or approval record when the change updates current authority;
- index/navigation updates;
- branch synchronization note when GitHub state matters.

## Required Validation

Run the narrowest relevant checks. For documentation authority work, run:

```bash
pnpm docs:links
pnpm docs:navigation
pnpm docs:audit-authority
pnpm type-check
git diff --check
```

Warnings are allowed only when they are known and documented. Failures must be fixed or explicitly scoped out before handoff.

## Forbidden Shortcuts

- Do not change version numbers just because a newer number sounds better.
- Do not delete historical evidence because it mentions an old baseline.
- Do not make generated artifacts the current authority.
- Do not create parallel governance systems.
- Do not update a protected file without updating the relevant index or authority map when discoverability changes.
- Do not push authority changes to GitHub without confirming branch intent.

## Safe Pattern

When uncertain, use this wording:

```text
I found a possible authority conflict. I will not rewrite the source yet.
I will identify the current canonical file, branch evidence, release evidence, and audit evidence first.
```
