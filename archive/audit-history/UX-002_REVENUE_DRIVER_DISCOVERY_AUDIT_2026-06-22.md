# UX-002 Revenue Driver Discovery Audit

**Scope:** Independent audit of the UX-002 Revenue Driver Discovery Sprint (V2 PRD).
**Method:** Verified from source, tests, and command output. Implementation claims not trusted.
**Date:** 2026-06-22
**Mode:** Read-only audit (no files modified)

## Verify checklist (1–14)

| # | Check | Result |
|---|---|---|
| 1 | WhatsApp visible from Dashboard | ✅ `DashboardHome` renders `<RevenueDriverDashboardSection />`; WhatsApp is priority-1 driver |
| 2 | WhatsApp visible from Sidebar | ✅ `REVENUE_DRIVER_ITEMS` → `/revenue-drivers?driver=whatsapp` (section `minRole: 'member'`, `defaultOpen`) |
| 3 | WhatsApp visible from Mobile | ✅ `MobileTabBar` has a Revenue tab (`/revenue-drivers`, 收入/Revenue/Hasil) → hub → WhatsApp |
| 4 | Content discoverable ≤2 clicks | ✅ Sidebar `driver=content` (1 click) + Dashboard section |
| 5 | Video discoverable ≤2 clicks | ✅ Sidebar `driver=video` → `/video-production` |
| 6 | Ads discoverable ≤2 clicks | ✅ Sidebar `driver=ads` → `/traffic-engine` |
| 7 | Webinar discoverable ≤2 clicks | ✅ Sidebar `driver=webinar` → `/webinar-center` |
| 8 | Webinar Presentation Slides exists | ✅ `presentation-slides` action (`/webinar-center?intent=presentation-slides`) |
| 9 | Webinar Speaker Script exists | ✅ `speaker-script` action |
| 10 | AI COO routes to WhatsApp/Content/Video/Ads/Webinar | ⚠️ 4/5 — `DRIVER_BY_MISSION_TYPE` maps CONTENT→content, TRAFFIC→ads, CUSTOMERS/RETENTION→whatsapp, OPTIMIZATION→video; **no mission type maps to webinar** |
| 11 | Workspace exposes Revenue Driver Actions | ✅ `MissionExecutionWorkspaceClient` resolves `getRevenueDriverForMissionType` → driver panel + top-4 actions |
| 12 | Localization for all driver labels | ✅ `drivers.*` + `actions.*` namespaces present in `en/zh/ms`; UI via `useTranslations('revenueDrivers')` |
| 13 | No revenue driver behind activation gating | ✅ Hub/section have no `shouldHide`/level/activation gating; sidebar is `minRole: 'member'` (all members), not Builder-level |
| 14 | Type-check + build pass | ✅ type-check exit 0; build exit 0; revenue-drivers test 3/3 |

## Scores

| Output | Score |
|---|---|
| **Revenue Discovery Score** | **92 / 100** |
| WhatsApp Discovery | 10 / 10 |
| Content Discovery | 10 / 10 |
| Video Discovery | 9 / 10 |
| Ads Discovery | 10 / 10 |
| Webinar Discovery | 8 / 10 |

## Missing Entry Points
1. **Webinar is not AI-COO-routable.** No `MissionType` maps to the webinar driver in `DRIVER_BY_MISSION_TYPE`, so the AI COO never recommends/routes to webinar (it's discoverable everywhere *else* — sidebar, mobile, hub).
2. **Video rides on `OPTIMIZATION`.** Video is reachable via the `OPTIMIZATION → video` mapping rather than a dedicated video mission type — works, but indirect (an optimization mission surfaces video).
3. **Intent deep-linking unverified.** Driver actions use `?intent=facebook-post` / `?intent=speaker-script` etc.; this audit confirms the entry points + routes exist, but not that each target page (`/content-engine`, `/traffic-engine`, `/video-production`, `/webinar-center`) actually *consumes* the `intent` param to deep-link the specific tool.

## Must Fix
1. **[Medium] Wire webinar into AI COO routing.** Add a mission-type→webinar mapping (or a webinar mission/opportunity) so Q10's fifth route is satisfied and the AI COO can recommend webinars when appropriate.
2. **[Low] Confirm `?intent=` handling** on the four target pages so driver actions deep-link to the specific tool rather than landing generically; otherwise the granular actions (per-platform posts, per-ad-type, slides/script) won't open their intended sub-tool.

## Final Verdict: PASS WITH CHANGES (one wire from REVENUE READY)

UX-002 delivers its core mandate decisively and closes every gap from the prior Traffic+Content Discovery audit: a real Revenue Driver Hub with 7 drivers, surfaced on the **Dashboard** (section), **Sidebar** (member-level, not Builder-gated), **Mobile** (Revenue tab), and **Mission Workspace** (per-mission driver actions) — all within ≤2 clicks, all localized (`drivers.*`/`actions.*` in en/zh/ms), and **no longer activation-gated**. WhatsApp, Content, Video, and Ads are fully discoverable *and* AI-COO-routable; video is now a first-class driver (fixing the prior orphan); per-platform and per-ad-type actions are individually exposed; webinar Presentation Slides + Speaker Script exist as discoverable actions. Type-check, build, and the revenue-drivers test all pass. It's `PASS WITH CHANGES` rather than `REVENUE READY` for one reason: **the AI COO cannot route to webinar** (Q10 is 4/5) — webinar is discoverable through every manual surface but absent from the mission-type map. Add that mapping (and confirm `?intent=` deep-linking) and this is REVENUE READY.

## Commands Run
- `git status --short`; revenue-drivers constants/hub + Dashboard/Sidebar/MobileTabBar/Workspace reads; localization-namespace + activation-gating greps — ✅ ran
- `vitest run revenue-drivers` — ✅ 3 passed
- `pnpm type-check` — ✅ exit 0, 0 errors
- `pnpm build` — ✅ exit 0, 0 hard errors
