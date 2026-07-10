# Traffic + Content Discovery Audit

**Goal:** Can a new user find the 8 content/traffic generation capabilities?
**Method:** Capability grep + route mapping + discovery-path tracing (sidebar, dashboard, workspace, outcome, AI COO). Read-only.
**Date:** 2026-06-22

## Capability Exists? (all 8)

| # | Capability | Exists | Where |
|---|---|---|---|
| 1 | Facebook post generation | ✅ | `contentGenerators.generateFacebookPost` → `/content-engine` |
| 2 | Instagram content | ✅ | `generateInstagramPost` → `/content-engine` |
| 3 | TikTok content | ✅ | `generateTikTokCaption` → `/content-engine` |
| 4 | XiaoHongShu (小红书) content | ✅ | `generateXHSPost` (`xhs`) → `/content-engine` |
| 5 | Facebook ad copy | ✅ | `trafficGenerators.generateFacebookCampaign` (adAngles/headlines) → `/traffic-engine` |
| 6 | Instagram ad copy | ✅ | `generateInstagramCampaign` → `/traffic-engine` |
| 7 | Lead generation ad | ✅ | `generateCampaign(goal, platform, budget)` with lead `TrafficGoal` + budget tiers → `/traffic-engine` |
| 8 | Video script | ✅ | `VideoScriptGenerator` + video module → `/video`, `/video-production`, `/brand-builder/video-script` |

**All 8 capabilities exist.** `PLATFORMS = ['facebook','instagram','tiktok','xhs']` and per-platform generators are all implemented.

## Discovery answers (Q1–Q7)

- **Q1 Exist?** Yes — all 8.
- **Q2 Routes?** Content (FB/IG/TikTok/XHS): `/content-engine` (+`/ai/content-plan`). Ad copy (FB/IG/lead): `/traffic-engine`. Video: `/video`, `/video-production`, `/brand-builder/video-script`.
- **Q3 New-user discoverable?** Partially. Sidebar exposes Content Engine + Traffic Engine + Video Studio — but under **"Level 2: Builder"** (progression-gated), so a brand-new pre-activation user may not see them; and the dashboard `QuickLaunchGrid` was removed in UX-001, so there's no quick-launch tile.
- **Q4 Clicks from Dashboard?** ~2 via sidebar when visible (Content Engine → AI Tools / Video Studio); via the guided flow, the AI COO "Start Mission" CTA → workspace → source tool (only when content/traffic is the active mission).
- **Q5 From Mission Workspace?** Content/Traffic: ✅ (agent panel + `sourceRoute` link to `/content-engine` / `/traffic-engine` for CONTENT/TRAFFIC missions). Video: ❌ (no video agent/mission).
- **Q6 From Outcome View?** Content/Traffic: ✅ via mission nodes (AUTHORITY_BUILDING→CONTENT, FIRST_LEAD→TRAFFIC). Video: ❌ (not an outcome/mission type).
- **Q7 From AI COO recommendations?** Content/Traffic: ✅ (`CanonicalMissionRegistry` CONTENT→`/content-engine`, TRAFFIC→`/traffic-engine`). Video: ❌ (no VIDEO `MissionType`).

## Discovery Score: 6 / 10

All capabilities exist and content/traffic are well-routed through the guided AI COO flow and the sidebar — but discoverability for a *new* user is limited by (a) video being entirely outside the AI COO/mission/workspace/outcome system, (b) progression-gated sidebar + removed quick-launch, and (c) per-platform / per-ad-type actions being bundled inside engine dashboards rather than individually surfaced.

## Missing Entry Points
1. **Video script is invisible to the guided experience.** There is no `VIDEO` mission type, no video agent action, and no video node in outcome chains — video is reachable **only** via the sidebar (Content Engine → Video Studio). The AI COO never routes a user to video.
2. **No dashboard quick-access to creation tools.** `QuickLaunchGrid` was removed (UX-001), so a new user has no at-a-glance way to launch content/ad/video generation; they must wait for the AI COO to make content/traffic the active mission.
3. **Content/Traffic Engine are Builder-level gated** in the sidebar — pre-activation users may not see them until they progress.
4. **Per-platform & per-ad-type actions aren't individually discoverable** — FB/IG/TikTok/XHS posts and FB/IG/lead ads are parameters inside `/content-engine` and `/traffic-engine`, not distinct entry points.

## Recommended UX Fixes
1. **Bring video into the AI COO system** — add a `VIDEO` mission type / content-agent video action (or surface "Generate Video Script" within the CONTENT mission workspace) so video is reachable from the guided flow, not just the sidebar.
2. **Add a lightweight "Create" affordance** on the Dashboard or in the Mission Workspace (a replacement for the removed QuickLaunchGrid) listing content/ad/video generation, so capabilities are discoverable without waiting for the matching mission.
3. **Surface Content/Traffic Engine to new users** — keep them visible (gently gated, not hidden) in the sidebar, or add an always-visible "Create / Tools" section.
4. **Expose platform & ad-type tabs** inside the engine pages (FB/IG/TikTok/XHS content tabs; FB ad / IG ad / lead-gen ad entry points) so the specific capabilities are individually findable and deep-linkable.
