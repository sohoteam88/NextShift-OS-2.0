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
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by `scripts/ensure-e2e-user.ts` to create or update the E2E auth user. | Supabase project settings, API section. Keep server-only. |
| `E2E_TEST_USER_EMAIL` | Normal E2E user email used by `tests/e2e/helpers/auth.ts`. | Dedicated test email chosen for CI. |
| `E2E_TEST_USER_PASSWORD` | Normal E2E user password used by `tests/e2e/helpers/auth.ts`. | Dedicated test password chosen for CI. |
| `E2E_ADMIN_EMAIL` | Admin E2E user email used by admin Playwright tests. | Dedicated admin test email already provisioned in Supabase and the app database. |
| `E2E_ADMIN_PASSWORD` | Admin E2E user password used by admin Playwright tests. | Dedicated admin test password already provisioned in Supabase and the app database. |

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
- `DATABASE_URL`

In CI, `DATABASE_URL` points to the temporary Postgres service created by the workflow. The script creates or updates the normal E2E Supabase Auth user, then upserts the matching local app user and tenant records needed by the Playwright tests.

## Admin User Requirement

`tests/e2e/helpers/auth.ts` also uses `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` for admin coverage. The current `scripts/ensure-e2e-user.ts` provisions the normal test user only, so the admin account must already exist with the expected admin access before E2E is enabled as a gate.

## Enabling E2E as a CI Gate

1. Add all required repository secrets.
2. Confirm the normal E2E user can be created with `scripts/ensure-e2e-user.ts`.
3. Confirm the admin E2E user can sign in and access admin routes.
4. Open or update a pull request into a configured CI branch.
5. Verify that `E2E Secret Check` reports the secrets are present and `E2E Tests` runs instead of being skipped.

Do not store real secret values in the repository, issue comments, pull request descriptions, or CI logs.
