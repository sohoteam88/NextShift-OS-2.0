# E3B Staging Validation Report

Date: 2026-06-19
Exit Gate: NOT READY_FOR_LAUNCH_REVIEW

## Objective

Create a real staging environment and execute full smoke testing for NextShift OS.

## Staging Environment Created

E3B created a staging deployment on the existing VPS.

| Item | Value |
| --- | --- |
| VPS | existing `nextshiftos.com` VPS |
| Staging app container | `nextshift-app-staging` |
| Staging Redis container | `nextshift-redis-staging` |
| App bind | `127.0.0.1:3001 -> 3000` |
| Nginx vhost | `staging.nextshiftos.com` |
| Staging env file | `/home/deploy/nextshift/.env.staging` |
| Staging compose file | `/home/deploy/nextshift/docker-compose.staging.yml` |

Production app was not redeployed and remained on `127.0.0.1:3000`.

## Staging Health

Container status:

```text
nextshift-app-staging: Up, healthy
nextshift-redis-staging: Up
```

Health endpoint:

```json
{"status":"ok","version":"0.1.0","services":{"database":"ok"}}
```

Nginx Host route:

```text
Host: staging.nextshiftos.com -> 127.0.0.1:3001
```

Result: PASS.

## URL Status

Required URL:

```text
staging.nextshiftos.com
```

Current status:

- HTTP vhost exists on the VPS.
- `curl --resolve staging.nextshiftos.com:80:45.77.171.193 http://staging.nextshiftos.com/api/v1/health` returns 200.
- Public DNS for `staging.nextshiftos.com` does not resolve.
- HTTPS certificate for `staging.nextshiftos.com` is not installed.

Decision: PARTIAL. The staging service exists, but the public required URL is not externally usable until DNS and SSL are configured.

## Staging Operator

Required account:

```text
staging operator
```

Attempted account:

```text
e3b-staging-operator+20260619@nextshiftos.test
```

Result:

- Supabase Auth signup failed with `over_email_send_rate_limit`.
- No service-role key exists in the VPS env, so admin user creation could not be performed safely.
- Manual writes to Supabase `auth.users` were not attempted because that would bypass Auth authority.

Decision: BLOCKED.

## Data Isolation Warning

The staging app currently uses a copied staging env derived from production env. This means the staging container is operational, but database/Auth isolation is not launch-grade.

Before launch review, staging should use one of:

- dedicated Supabase staging project, or
- dedicated staging database/Auth environment, or
- explicitly approved staging tenant in release DB with safe test-data policy.

## Smoke Test Summary

See `audit/staging-smoke-results.md`.

Summary:

- Public route checks: PASS.
- Auth gate checks: PASS.
- Health check: PASS.
- Full authenticated workflow smoke: BLOCKED due staging operator creation/login blocker.

## Remaining Launch Review Blockers

1. Add DNS A record for `staging.nextshiftos.com` -> `45.77.171.193`.
2. Issue SSL certificate for `staging.nextshiftos.com`.
3. Provide/create confirmed staging operator account.
4. Decide and document staging data isolation policy.
5. Execute full authenticated smoke suite:
   - Login
   - Dashboard
   - Interview
   - Journey
   - AI COO
   - Runtime
   - Analytics

## Final Decision

NOT READY_FOR_LAUNCH_REVIEW.

E3B successfully created a staging deployment on the existing VPS, but public staging URL, SSL, staging operator login, and full authenticated smoke testing remain incomplete.
