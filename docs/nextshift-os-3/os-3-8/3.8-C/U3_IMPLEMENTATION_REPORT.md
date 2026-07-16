# U3 Navigation Convergence — Implementation Report

## Identity

- Task: `U3 — Navigation Convergence`
- Authorized exact baseline: `4bb5419e6761fd0ed1ecc8e721deb596a47c48f2`
- Branch: `feature/os-3.8-u3-navigation-convergence`
- Product implementation commit: `09c30706ee09e884b2504bfeccd6538f280e9486`
- Verification policy: `actual_checks_required`
- Approved IA: `docs/nextshift-os-3/os-3-8/3.8-C/U2_INFORMATION_ARCHITECTURE.md`
- Steven approval: `docs/nextshift-os-3/os-3-8/approvals/STEVEN_IA_APPROVAL.md`
- Recorded at: `2026-07-16T14:04:50Z`

## Canonical navigation model

`src/config/canonical-routes.ts` remains the sole route authority. It now exports a typed member-navigation projection consumed by both `WorkspaceTopNavigation` and `MobileTabBar`; no second route registry was introduced.

Desktop order is exactly:

1. Today — `/dashboard`
2. Journey — `/journey`
3. Brand — `/brand-builder/profile`
4. Content — `/content-engine`
5. Growth — `/revenue-drivers`
6. Relationships — `/crm`
7. Team — `/ai-workforce`

Mobile keeps Today, Content, Growth, and Relationships visible, followed by More. More exposes Journey, Brand, Team, Settings, Billing, and Help. Retail and Recruitment use identical hrefs; only the Relationships label changes (`Customers` / `Prospects`, with localized equivalents). The old execution-roadmap navigation was removed from the member shell so it cannot compete with the approved primary navigation. Journey remains the canonical learning/next-mission destination.

The More surface uses a modal accessibility lifecycle: initial focus moves to its first link, Tab and Shift+Tab remain inside, Escape closes and restores focus to the trigger, outside click closes, and the panel/tab bar respect the mobile safe area. Active state supports exact and nested canonical paths without prefix false positives.

Content Engine and Content Library remain mounted and discoverable together at `/content-engine`. No Content generation semantics, calendars, funnels, Business Score, graduation bridge, workspace data, or mode-specific pipelines changed.

## Merge and compatibility routing

All redirects use one internal-only helper that preserves source query parameters, protects destination-owned parameters, rejects external/protocol-relative destinations, and never accepts a caller-provided destination.

### Nine approved Merge decisions

| Source | Terminal destination |
|---|---|
| `/admin-command` | `/platform-admin?view=command` |
| `/analytics` | `/analytics-center` |
| `/brand-discovery` | `/brand-builder/profile` |
| `/brand-dna` | `/brand-builder/profile` |
| `/crm-center` | `/crm` |
| `/funnel-context` | `/funnel` |
| `/leads` | `/crm` |
| `/sales` | `/crm` |
| `/video-production` | `/video` |

`/admin-command` remains protected by an exact `platform_admin` role check. Capability parity is preserved before redirect: `/platform-admin?view=command` renders the existing `AdminCommandDashboard` and its platform operations/API behavior. The destination does not expose this view through member or Tenant Admin navigation, and unauthorized users still return to `/dashboard`.

### Twenty-two approved compatibility redirects

- Admin: `/admin/ai-templates` → `/admin/templates`; `/workspace` → `/admin`; `/workspace/[...path]` → an explicit one-segment Admin allowlist, otherwise `/admin`.
- AI: `/ai` → `/content-engine`; `/ai/brand-builder` → `/brand-builder`; `/ai/content-plan` → `/content-engine`; `/ai/funnel-builder` → `/funnel`; `/ai/workforce` → `/ai-workforce`.
- Brand: `/brand-builder/step/calendar` and `/brand-builder/step/strategy` → `/content-engine`; `/brand-builder/video-script` → `/video`; `/social-setup` → guarded `/brand-builder`.
- Growth: `/customers` → `/crm`; `/funnel-builder` → `/funnel`; `/team/growth` → `/team`.
- Onboarding: `/onboarding/brand`, `/onboarding/goals`, and `/onboarding/profile` → guarded `/brand-builder`; `/onboarding/complete` → `/dashboard`; `/onboarding/first-content` → `/content-engine`; `/onboarding/first-funnel` → `/funnel`.
- Founder: `/platform-admin/tenants` → `/platform-admin?tab=tenants`.

The workspace catch-all cannot construct arbitrary Admin paths. `/team/growth` repeats the operator/platform-admin gate before reaching the terminal `/team` Keep route. Member Team remains `/ai-workforce`; privileged human-team administration remains `/team` and `/team/members`; Tenant Admin remains `/admin/team`; Founder operations remain `/platform-admin`.

## Hide and direct-access behavior

Hide decisions affect navigation only. The implementation does not delete, disable, rename, or redirect the approved hidden routes. In particular, `/automation`, `/blueprints`, `/franchise`, `/localization`, and `/saas` remain direct/deep-link accessible but absent from desktop/mobile member navigation. Contextual Brand, CRM/funnel detail, support, video-detail, mission, and unauthorized routes likewise remain reachable through their existing contextual entry points.

## Changed files

- Canonical/navigation: `src/config/canonical-routes.ts`, `WorkspaceTopNavigation.tsx`, `MobileTabBar.tsx`, `AppShell.tsx`, and `TopBar.tsx`.
- Redirect authority: `src/lib/navigation/compatibility-redirect.ts` and 31 approved authenticated route pages (9 Merge sources plus 22 compatibility sources, with the dynamic workspace source counted separately from its root).
- Destination parity: `src/app/(auth)/platform-admin/page.tsx`.
- Tests: `src/config/canonical-routes.test.ts`, `src/lib/navigation/compatibility-redirect.test.ts`, and `tests/e2e/navigation-convergence.spec.ts`.
- Governance: this report only.

No Pipeline, Manifest, Prisma, migration, CI workflow, E3, or AR-W3 file changed.

## Validation evidence

### Local

| Gate | Result |
|---|---|
| Manifest validator | **PASS**, read-only |
| Focused navigation/redirect Vitest | **PASS** — 2 files, 16 tests |
| Full `pnpm test` | **PASS** — 100 files passed, 7 skipped; 552 tests passed, 44 skipped |
| `pnpm type-check` | **PASS** |
| `pnpm lint` | **PASS** — 0 errors, 419 existing warnings |
| `pnpm lint:boundaries:check` | **PASS** |
| `pnpm build` | **PASS** — 255 pages generated; missing local `DATABASE_URL` produced non-fatal static-data diagnostics |
| Playwright discovery | **PASS** — 6 U3 tests discovered |
| Local Playwright execution | **ENVIRONMENT-LIMITED** — stopped at shared login because valid E2E credentials were unavailable; not claimed as PASS |
| `git diff --check` | **PASS** |

### GitHub implementation commit

Exact implementation head `09c30706ee09e884b2504bfeccd6538f280e9486` passed:

- Type Check + Lint + Build — **PASS** (3m57s)
- Tests — **PASS** (1m33s): application 571 passed / 25 skipped, plus all package suites passed
- E2E Secret Check — **PASS** (3s)
- E2E Tests — **PASS** (9m53s): 52 passed / 1 skipped

This report-only commit must rerun the same exact-head required checks before Architecture Review handoff.

## Governance boundary

- U3 is not marked completed and this Draft PR is not merged.
- E3A, E3B, and AR-W3 were not started.
- No deployment, tag, release, production migration, production access, or production modification occurred.
- `release_gate` remains blocked; `auto_release`, `auto_deploy`, and `auto_tag` remain disabled.
