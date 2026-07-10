# ALPHA-001 — First VPS Deployment Audit Report

| Field           | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Sprint          | ALPHA-001 First VPS Deployment                                               |
| Audit Date      | 2026-07-06                                                                   |
| Auditor         | Claude Code (Audit Engineer)                                                 |
| Contract        | ALPHA_001_DEPLOYMENT_AUDIT_CONTRACT.md                                      |
| Requirements    | ALPHA_001_REQUIREMENTS_VERIFICATION.md (ChatGPT — PASS)                     |
| Verdict         | **PASS**                                                                     |

---

## 1. Environment Safety

**Result: PASS**

| Check | Status | Evidence |
| --- | --- | --- |
| Alpha isolated from existing containers | ✓ | Separate checkout `/home/deploy/nextshift-alpha`, compose file `/home/deploy/nextshift-alpha.compose.yml`, image `nextshift-app-alpha:latest` |
| Existing production/staging containers untouched | ✓ | Requirements verification explicitly states containers left untouched |
| Alpha bound to localhost only | ✓ | `127.0.0.1:3002` — not publicly exposed |
| Secrets not printed or committed | ✓ | No secrets reported; local repo clean |
| No destructive DB action | ✓ | No migrations executed |
| Local repo status after deployment | ✓ | Clean |
| VPS alpha checkout status | ✓ | Clean |

The alpha environment is correctly isolated. Separate image name, separate container names, separate port, separate directory, separate compose file — no cross-contamination vector with any existing deployment. ✓

---

## 2. Deployment Correctness

**Result: PASS**

| Check | Status |
| --- | --- |
| Branch recorded | ✓ `planning/os-3.1-mvp-governance` |
| Commit recorded | ✓ `84fc595831503de5bb4ac65242a523166818342c` |
| Docker Compose config validation | ✓ PASS |
| Docker build | ✓ PASS (with non-fatal warnings) |
| Prisma generate during build | ✓ PASS |
| Next.js production build | ✓ PASS (with non-fatal warnings) |
| `nextshift-app-alpha` container | ✓ Running, healthy |
| `nextshift-redis-alpha` container | ✓ Running |
| Application starts successfully | ✓ Confirmed by health check responses |

---

## 3. Runtime Validation

**Result: PASS**

| Endpoint | Expected | Result |
| --- | --- | --- |
| `/api/v1/health` | HTTP 200, `database: ok` | ✓ PASS |
| `/api/health` | HTTP 200 | ✓ PASS |
| `/` | HTTP 307 redirect | ✓ PASS (expected for authenticated app root) |
| `/api/v1/version` | HTTP 200 | ✓ PASS |
| `/api/mission/current` | HTTP 401 unauthenticated | ✓ PASS |
| Fatal runtime logs | None | ✓ PASS |

`/api/v1/health` returning `database: ok` confirms the application is connected to and communicating with the Supabase database at runtime. This is the most significant runtime signal — the full stack is operational. ✓

The `/api/mission/current` HTTP 401 response is the correct unauthenticated behaviour for a protected endpoint. ✓

---

## 4. Warnings Classification

### W-001 — Missing optional `posthog-js` import

**Classification: ADVISORY**

`posthog-js` is used in `src/lib/telemetry/tracker.ts` as an optional analytics dependency. The type declaration exists (`posthog.d.ts`) but the package is not installed in the alpha environment. The application builds and runs successfully without it. PostHog analytics is a non-critical observability integration. No runtime user-facing impact.

Condition for production: Decide whether PostHog analytics should be enabled in production. If yes, install the package and configure `NEXT_PUBLIC_POSTHOG_KEY`. If no, remove the conditional import or guard it explicitly.

### W-002 — Supabase Edge Runtime compatibility warning

**Classification: ADVISORY**

Supabase's server client uses Node.js-specific APIs that trigger Next.js Edge Runtime compatibility warnings during build. This is a known, well-documented framework interoperability note. The application builds and runs correctly using the Node.js runtime path, not the Edge Runtime. No runtime impact.

### W-003 — React hook lint warnings

**Classification: ADVISORY**

Build-time React hook lint warnings do not prevent the build from completing and do not cause runtime errors. These are code quality flags. No production runtime impact for alpha. Should be addressed as part of a code quality pass before broader production promotion.

### W-004 — Static generation Prisma reads against dummy DB URL

**Classification: ADVISORY**

During `next build`, Next.js attempts static generation for applicable pages. These pages execute Prisma reads which fail against the Dockerfile's dummy `DATABASE_URL` (`ARG NEXT_PUBLIC_COMMIT_SHA=unknown` pattern), logging database connection errors. This is the expected and documented behaviour for Next.js + Prisma in a multi-stage Docker build. The build completes successfully. At runtime the real `DATABASE_URL` is available and the database health check passes. No action required.

### W-005 — Version endpoint reports commit/build time as `unknown`

**Classification: CONDITIONAL**

`/api/v1/version` returns `commit: unknown` and `buildTime: unknown` because the Docker build was run without passing the build arguments:

```dockerfile
ARG NEXT_PUBLIC_COMMIT_SHA=unknown   # default used
ARG NEXT_PUBLIC_BUILD_TIME=unknown   # default used
```

The endpoint is working correctly — it reads `process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown'`. The `unknown` value is the designed fallback when build args are not supplied (confirmed in `Dockerfile` and `.env.production.example`).

For alpha baseline acceptance: **accepted** — the functionality is operational and the design is correct.
For production: **must be resolved** — pass `--build-arg NEXT_PUBLIC_COMMIT_SHA=$(git rev-parse HEAD) --build-arg NEXT_PUBLIC_BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)` during Docker build to populate deployment traceability metadata.

---

## 5. Limitations Classification

### L-001 — Deployed from planning branch, not a release branch

**Classification: CONDITIONAL — acceptable for alpha; must be addressed before production promotion**

`planning/os-3.1-mvp-governance` is the correct branch at the current project lifecycle stage. A `release/v3.2` branch does not yet exist. For an isolated alpha baseline the planning branch deployment is acceptable — the goal is to confirm the application runs on the VPS, not to deploy a formal release candidate.

Condition before production: Create the `release/v3.2` branch from an approved commit, re-run alpha or staging deployment from that branch, and confirm the release branch deployment produces equivalent health check results.

### L-002 — Host Node.js and pnpm unavailable on VPS

**Classification: ADVISORY**

The Docker build and runtime path is the intended production deployment path. Host Node.js/pnpm are not required. All build steps execute inside the Docker multi-stage build. This is correct architecture and not a limitation for production operations.

### L-003 — No database migrations executed

**Classification: CONDITIONAL — understood and acceptable for alpha**

The alpha deployment connects to an existing Supabase project where the schema is already in place. Running `prisma migrate deploy` was explicitly out of scope (consistent with INT-001 and DEP-001 findings). The `/api/v1/health` returning `database: ok` confirms the runtime database connection is healthy against the existing schema.

Condition before production: Follow the migration sequencing documented in DEP-001 — confirm Supabase migration baseline, then execute `prisma migrate deploy` against the target database, validate health checks, and record the result.

### L-004 — Alpha bound to localhost only (`127.0.0.1:3002`)

**Classification: ADVISORY — correct and intentional isolation**

Binding to `127.0.0.1:3002` is the right posture for an alpha baseline. The application is accessible from the VPS host for smoke testing without being publicly reachable. When external access or a production reverse proxy is desired, the compose file can be reconfigured and the reverse proxy updated to route traffic to `:3002`.

### L-005 — Version endpoint unknown commit/build time

**Classification: CONDITIONAL — see W-005 above**

Same as W-005. Acceptable for alpha baseline; must be resolved for production.

---

## 6. Required Fixes

None for alpha baseline acceptance.

---

## 7. Advisory Findings

**A-001 — No ALPHA-001 report filed in the repository**

The deployment evidence is contained in `ALPHA_001_REQUIREMENTS_VERIFICATION.md` (the ZIP delivery document) rather than a filed report in `audit/`. Unlike INT-001 (`INT_001_PLATFORM_INTEGRATION_VALIDATION_REPORT.md`), there is no committed Codex-authored deployment report artifact for ALPHA-001. This audit report serves as the primary audit record. Recommend Codex file a brief `audit/ALPHA_001_FIRST_VPS_DEPLOYMENT_REPORT.md` capturing the VPS setup, containers, endpoints, commit, and warnings alongside this audit report.

**A-002 — React hook lint warnings should be resolved before production promotion**

W-003 React hook lint warnings are advisory for alpha but represent technical debt. A dedicated code quality pass to resolve hook dependency warnings will reduce noise in future build output and improve CI signal clarity.

**A-003 — PostHog analytics integration decision deferred**

W-001 posthog-js warning will recur on every build until a decision is made. Recommend explicitly deciding: enable PostHog with proper package install and key configuration, or remove the conditional import and posthog type declaration entirely.

---

## 8. Environment Safety Assessment

The alpha deployment is fully isolated. Separate image, containers, port, directory, and compose file ensure no interference with any existing production or staging stack. The application is accessible only from localhost. No secrets were printed. No migrations were executed. Local and VPS checkout states are both clean. This is a textbook alpha isolation setup. ✓

---

## 9. Deployment Correctness Assessment

Docker Compose config, Docker build, Prisma generate, and Next.js production build all passed. Both containers are running and healthy. The deployed branch and full commit SHA are recorded. All required evidence is present. ✓

---

## 10. Runtime Validation Assessment

All 5 endpoint checks pass with correct status codes. Most critically: `/api/v1/health` returns HTTP 200 with `database: ok`, confirming the full application stack — Next.js → Prisma → Supabase — is operational on the VPS. No fatal runtime log errors were found. ✓

---

## 11. Alpha Baseline Recommendation

**Accept alpha baseline.**

The ALPHA-001 deployment demonstrates that the NextShift OS application builds, runs, and serves traffic correctly on the target VPS environment. The database connection is healthy. The five health/version/auth endpoints all return expected responses. All warnings are advisory or conditionally accepted. All limitations are understood and do not prevent baseline acceptance.

---

## 12. Recommended Next Action

In priority order:

1. **File `audit/ALPHA_001_FIRST_VPS_DEPLOYMENT_REPORT.md`** (Codex) — commit the deployment evidence as a repository artifact alongside this audit report.

2. **Create `release/v3.2` branch** — branch from the approved OS 3.2 release commit, run a re-deployment from that branch to confirm the release branch produces equivalent results.

3. **Resolve migration strategy** — before any database migration execution, confirm the Supabase migration baseline per DEP-001 and execute `prisma migrate deploy` against the target database in a controlled window.

4. **Resolve W-005 / L-005** — pass `NEXT_PUBLIC_COMMIT_SHA` and `NEXT_PUBLIC_BUILD_TIME` as Docker build args in the deployment workflow to populate version traceability metadata.

5. **External access decision** — if a public or team-facing alpha is desired, configure the reverse proxy to route to `:3002` and document the exposure decision.

---

## Release Recommendation

PASS — First Alpha VPS Deployment Baseline Accepted.

ALPHA-001 achieves a successful isolated first VPS deployment on the target Ubuntu 22.04.5 host. The application builds, starts, and serves traffic. The full stack health check confirms database connectivity. All five endpoint assertions pass. Warnings are advisory or conditionally accepted. Limitations are understood and properly scoped. No fatal errors, no destructive actions, no secret exposure, no interference with existing deployments.
