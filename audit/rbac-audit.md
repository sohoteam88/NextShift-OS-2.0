# RBAC Audit

Date: 2026-06-19
Phase: E2A Security Blocker Remediation
Status: Remediated

## Scope

Reviewed all `requireRoleApi` usage under `src`.

## Findings

Legacy role requirements were present in:

- `src/app/api/v1/admin-command/route.ts`
- `src/app/api/v1/admin/override/route.ts`

The legacy role array created a fail-open ambiguity because unknown role names were scored as `0`.

## Remediation

- `requireRoleApi` now rejects unknown role requirements.
- `/api/v1/admin-command` now requires `platform_admin`.
- `/api/v1/admin/override` GET, POST, and DELETE now require `platform_admin`.
- Removed the remaining legacy `owner/admin` feature flag expression from `adminCommandService`.

## Verification

Command:

```bash
grep -RIn "owner.*admin\|admin.*owner" src
```

Result: no output.

Regression tests:

```bash
pnpm vitest run src/__tests__/security/*.test.ts
```

Result: 7 files passed, 32 tests passed.

## Decision

RBAC blocker is remediated.
