# E3B Staging Smoke Results

Date: 2026-06-19
Status: PARTIAL / AUTHENTICATED SMOKE BLOCKED

## Target

Staging target:

```text
http://staging.nextshiftos.com
```

Execution note:

Public DNS is not configured, so HTTP tests used explicit DNS resolution to the VPS IP. HTTPS tests cannot pass until DNS and certificate are configured.

## Infrastructure Smoke

| Check | Result |
| --- | --- |
| staging app container running | PASS |
| staging app health status | PASS, healthy |
| staging Redis running | PASS |
| direct app health on `127.0.0.1:3001` | PASS |
| nginx Host route for `staging.nextshiftos.com` | PASS |
| public DNS | FAIL, no DNS answer |
| HTTPS | FAIL, no staging certificate |

## Route Smoke

Command shape:

```text
curl --resolve staging.nextshiftos.com:80:45.77.171.193 http://staging.nextshiftos.com/<route>
```

| Route | Result |
| --- | --- |
| `/login` | 200 |
| `/signup` | 200 |
| `/dashboard` | 307 -> `/login` |
| `/brand-builder/step/interview` | 307 -> `/login` |
| `/journey` | 307 -> `/login` |
| `/ai` | 307 -> `/login` |
| `/analytics` | 307 -> `/login` |
| `/api/v1/health` | 200 |

Decision: PASS for unauthenticated route and auth-gate behavior.

## Required Smoke Suite

| Required Area | Result | Evidence / Blocker |
| --- | --- | --- |
| Login | BLOCKED | staging operator signup blocked by Supabase `over_email_send_rate_limit` |
| Dashboard | BLOCKED | requires authenticated staging operator |
| Interview | BLOCKED | requires authenticated staging operator |
| Journey | BLOCKED | requires authenticated staging operator |
| AI COO | BLOCKED | requires authenticated staging operator and AI workflow execution |
| Runtime | BLOCKED | requires authenticated staging operator |
| Analytics | BLOCKED | requires authenticated staging operator |

## Staging Operator Attempt

Attempted to create:

```text
e3b-staging-operator+20260619@nextshiftos.test
```

Result:

```text
Supabase Auth returned over_email_send_rate_limit
```

No password or API key is stored in this report.

## Runtime Logs

Staging app startup log:

```text
Next.js 15.5.18
Starting...
Ready
```

No startup crash was observed.

## Decision

PARTIAL / AUTHENTICATED SMOKE BLOCKED.

The staging deployment is running and basic route checks pass. The full E3B smoke suite cannot be marked complete until public DNS/HTTPS and a working staging operator account are available.
