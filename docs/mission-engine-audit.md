# Mission Engine Audit

Date: 2026-06-12

## Existing Files Found

### Database Schema (`prisma/schema.prisma`)

| Model | Status | Notes |
|-------|--------|-------|
| `UserProgress` | ✅ Complete | Tracks `currentStageId`, `completedChecks`, `totalXp`, `mode`, `stageStartedAt`, `milestonesSeen` |
| `Mission` | ⚠️ Underused | Schema exists but the service layer does not write to this table — all logic goes through `UserProgress` |
| `Achievement` | ✅ Complete | Tracks unlocked achievements with `key`, `title`, `xpAwarded` |

### Module: `src/modules/mission/`

| File | Status | Notes |
|------|--------|-------|
| `constants/journey-map.ts` | ✅ Complete | 20 journey stages with trilingual names, categories, prerequisites, XP rewards. Core utility functions: `getNextStage`, `getProgressPercent`, `getTotalXP`, `getStagesByCategory` |
| `services/mission-service.ts` | ✅ Complete | `getProgress`, `getState`, `completeCheck`, `setMode`, `skipStage`, `getJourneyMap` |
| `services/achievement-service.ts` | ✅ Complete | 9 achievements with unlock conditions, `checkAndUnlockAchievements`, `getUserAchievements` |
| `hooks/use-mission.ts` | ✅ Complete | React Query hooks: `useMissionState`, `useJourneyMap`, `useCompleteCheck`, `useSetMode`, `useAchievements` |
| `utils/complete-mission.ts` | ✅ Complete | `notifyMissionProgress` helper for cross-module mission tracking |
| `constants/sidebar-config.ts` | ✅ Complete | Sidebar configuration |

### Mission Components

| Component | Status | Notes |
|-----------|--------|-------|
| `MissionStatusCard.tsx` | ✅ Complete | Shows current stage, progress bar, XP, category badge |
| `NextMissionCard.tsx` | ✅ Complete | Shows next task, why it matters, estimated time, Start/Skip buttons |
| `ModeToggle.tsx` | ✅ Complete | Toggle between guided (beginner) and advanced mode |
| `TimeEstimateCard.tsx` | ✅ Complete | Shows estimated time to first lead and first sale |
| `GrowthModeDashboard.tsx` | ✅ Complete | Post-completion dashboard with content tasks, CRM stats, quick links |
| `JourneyMapView.tsx` | ✅ Complete | Full journey map visualization |
| `MilestoneCelebration.tsx` | ✅ Complete | Celebration toast for milestone unlocks |
| `MissionListener.tsx` | ✅ Complete | Client-side listener for mission events |

### API Routes

| Route | Method | Status | Notes |
|-------|--------|--------|-------|
| `/api/v1/mission/state` | GET | ✅ Complete | Returns full mission state |
| `/api/v1/mission/complete-check` | POST | ✅ Complete | Marks a check as complete |
| `/api/v1/mission/mode` | POST | ✅ Complete | Sets guided/advanced mode |
| `/api/v1/mission/achievements` | GET | ✅ Complete | Returns unlocked + all achievements |
| `/api/v1/mission/journey` | GET | ✅ Complete | Returns journey map with statuses |

### Dashboard Integration

| File | Status | Notes |
|------|--------|-------|
| `src/app/(auth)/dashboard/page.tsx` | ✅ Complete | Routes to role-specific dashboards |
| `src/modules/dashboard/components/MemberDashboard.tsx` | ✅ Complete | Full mission-driven dashboard using all mission components |

### Stores

| File | Status | Notes |
|------|--------|-------|
| `src/stores/mission-celebration-store.ts` | ✅ Complete | Zustand store for celebration toast triggers |

---

## What Can Be Reused

1. **Prisma models** — `UserProgress`, `Mission`, `Achievement` are all correctly defined
2. **Journey map + utility functions** — `getNextStage`, `getProgressPercent`, `getTotalXP` are production-ready
3. **Mission service** — `getProgress`, `getState`, `completeCheck`, `setMode` work with the existing Prisma models
4. **Achievement service** — Fully functional achievement unlock system
5. **React hooks** — All React Query hooks are ready
6. **All existing components** — `MissionStatusCard`, `NextMissionCard`, `ModeToggle`, etc.
7. **MemberDashboard** — Already integrates mission engine as primary section
8. **Auth middleware** — `requireAuthApi` handles tenantId + userId isolation
9. **API handler** — Error handling, validation, i18n errors

---

## What Must Be Added / Changed

### 1. Mission Stage Definition Layer (NEW)
**File:** `src/modules/mission-engine/missionStages.ts`

The existing `journey-map.ts` uses stage IDs like `fb_page_setup`, `ig_account_setup`, `generate_bio`, `generate_avatar` that are more granular. The task specifies a streamlined 15-stage beginner journey:

- `account_approved` → `brand_discovery` → `brand_dna` → `social_setup` → `first_bio` → `first_content` → `first_video` → `lead_magnet` → `webinar` → `funnel` → `traffic_campaign` → `whatsapp_followup` → `crm_setup` → `first_sale` → `growth_mode`

The new file should:
- Add `mode: 'beginner' | 'advanced' | 'both'` field to each stage
- Add `whyItMatters` field (separate from description)
- Add `unlocksNextStage` boolean
- Be compatible with the existing `JourneyStage` type where possible

### 2. Mission Engine Service (NEW)
**File:** `src/modules/mission-engine/missionEngineService.ts`

The existing `mission-service.ts` already has similar functions. The new service should:
- Wrap/extend the existing service with the exact function signatures requested
- Add `getOrCreateUserProgress` (existing `getProgress` does this)
- Add `getCurrentMission` (existing `getState` does this)
- Add `completeCurrentMission` (existing `completeCheck` does this)
- Add `unlockNextMission` (new — auto-advance currentStageId)
- Add `awardAchievement` (existing `checkAndUnlockAchievements` does this)
- Add `switchMissionMode` (existing `setMode` does this)

### 3. API Routes (NEW / EXTEND)
| Route | Method | Action |
|-------|--------|--------|
| `/api/v1/mission/current` | GET | **NEW** — Alias for `/api/v1/mission/state` with cleaner response |
| `/api/v1/mission/complete` | POST | **NEW** — Takes `stageId`, marks complete, returns next mission |
| `/api/v1/mission/mode` | POST | **EXISTS** — Already implemented at this path |

### 4. MissionCard Component (NEW)
**File:** `src/modules/mission-engine/components/MissionCard.tsx`

A unified card that combines what `MissionStatusCard` + `NextMissionCard` + `ModeToggle` currently do separately. The new component should:
- Be the single primary card on the dashboard
- Show current stage, next task, why it matters, estimated time, progress %, XP
- Include complete button
- Include beginner/advanced toggle
- Show achievement unlock toast/message
- Use warm, coach-like copy

### 5. Dashboard Priority Order (UPDATE)
The existing `MemberDashboard` already places mission first, which is correct. The task asks for:
1. Mission Engine ✅ (already first)
2. Brand progress — needs to be more prominent below mission
3. Content / funnel / CRM shortcuts — exists in GrowthModeDashboard
4. Analytics — currently links to `/analytics`

### 6. Tests (NEW)
**File:** `src/__tests__/mission-engine/mission-engine.test.ts`

No mission engine tests exist yet. Need to add:
- First-time user progress creation
- Completing current mission
- Auto advancing to next stage
- Achievement creation
- Beginner vs advanced mode behavior

---

## Missing Files Summary

| File | Priority | Status |
|------|----------|--------|
| `src/modules/mission-engine/missionStages.ts` | High | Must create |
| `src/modules/mission-engine/missionEngineService.ts` | High | Must create |
| `src/modules/mission-engine/components/MissionCard.tsx` | High | Must create |
| `src/app/api/v1/mission/current/route.ts` | Medium | Must create |
| `src/app/api/v1/mission/complete/route.ts` | Medium | Must create |
| `src/__tests__/mission-engine/mission-engine.test.ts` | Medium | Must create |

## Architecture Decision

The existing `src/modules/mission/` module is production-ready and should not be removed. The new `src/modules/mission-engine/` module will:

1. **Define stages** with the new format (`missionStages.ts`)
2. **Provide a service** that wraps the existing `mission-service.ts` but exposes the exact API surface requested in the task
3. **Provide a unified component** (`MissionCard.tsx`) for the dashboard
4. **Add API routes** that delegate to the new service

This is an **extension pattern**, not a parallel system. The existing module continues to work; the new module adds the specific API surface requested.
