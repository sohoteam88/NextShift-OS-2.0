# E2E CI Setup

NextShift OS E2E tests sign in through Supabase Auth. GitHub Actions must have the Supabase project credentials and test account credentials before the `E2E Tests` job can run as a release gate.

When any required secret is missing, CI skips only the E2E job and writes this summary:

```text
E2E skipped: missing secrets
```

The `quality` and `test` jobs still run as required gates.

## Required GitHub Secrets

Configure these in GitHub repository settings under `Settings -> Secrets and variables -> Actions -> Repository secrets`.

| Secret | Purpose | Source |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by the app and by `scripts/ensure-e2e-user.ts`. | Supabase project settings, API section. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key used by the app browser client during E2E login. | Supabase project settings, API section. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by `scripts/ensure-e2e-user.ts` to create or update the E2E auth users. | Supabase project settings, API section. Keep server-only. |
| `E2E_TEST_USER_EMAIL` | Normal E2E user email used by `tests/e2e/helpers/auth.ts`. | Dedicated test email chosen for CI. |
| `E2E_TEST_USER_PASSWORD` | Normal E2E user password used by `tests/e2e/helpers/auth.ts`. | Dedicated test password chosen for CI. |
| `E2E_ADMIN_EMAIL` | Platform admin E2E user email used by admin Playwright tests. | Dedicated test email chosen for CI. |
| `E2E_ADMIN_PASSWORD` | Platform admin E2E user password used by admin Playwright tests. | Dedicated strong test password chosen for CI. |

## Test User Provisioning

CI runs:

```bash
pnpm tsx scripts/ensure-e2e-user.ts
```

The script uses:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_TEST_USER_EMAIL`
- `E2E_TEST_USER_PASSWORD`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `DATABASE_URL`

In CI, `DATABASE_URL` points to the temporary Postgres service created by the workflow. The script creates or updates both E2E Supabase Auth users, then upserts the matching local app users and tenant records needed by the Playwright tests. The normal account is provisioned as `member` and must land on `/dashboard`. The admin account is provisioned as `platform_admin` and must land on `/platform-admin`. Both accounts are email-confirmed, active, and have completed onboarding state.

## Admin User Requirement

`tests/e2e/helpers/auth.ts` uses `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` for platform-admin coverage. `scripts/ensure-e2e-user.ts` provisions this account on every E2E run so Supabase Auth and the temporary CI app database stay aligned.

## Enabling E2E as a CI Gate

1. Add all required repository secrets.
2. Confirm both E2E users can be created with `scripts/ensure-e2e-user.ts`.
3. Confirm the member lands on `/dashboard` and the platform admin can access admin routes.
4. Open or update a pull request into a configured CI branch.
5. Verify that `E2E Secret Check` reports the secrets are present and `E2E Tests` runs instead of being skipped.

Do not store real secret values in the repository, issue comments, pull request descriptions, or CI logs.
