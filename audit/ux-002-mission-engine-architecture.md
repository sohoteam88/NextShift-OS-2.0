# UX-002 Mission Engine Architecture

## Objective

Create a Mission Engine authority layer that powers Dashboard V5.

Dashboard no longer determines:

- Current mission
- Next mission
- Mission priority
- Completion status
- Progress path
- Mission unlock sequence

## Authority Chain

Implemented chain:

```text
Business State
Journey State
Mission Engine
AI COO
Dashboard Projection
Dashboard UI
```

## New Mission Authority

Files:

- `src/modules/mission-engine/contracts/MissionAuthority.ts`
- `src/modules/mission-engine/services/MissionEngineAuthorityService.ts`

Mission definition includes:

- `id`
- `title`
- `description`
- `expectedOutcome`
- `estimatedMinutes`
- `status`
- `priority`
- `unlockConditions`
- `completionConditions`
- `nextMissionId`
- `route`

Supported mission statuses:

- `locked`
- `available`
- `active`
- `completed`
- `blocked`

## Core Mission Sequence

1. `MISSION_001` - 资料设置
2. `MISSION_002` - 品牌访谈
3. `MISSION_003` - 确认品牌 DNA
4. `MISSION_004` - 第一篇内容
5. `MISSION_005` - 引流磁铁
6. `MISSION_006` - 落地页
7. `MISSION_007` - 流量启动
8. `MISSION_008` - 发布上线

The resolver guarantees one active mission at a time.

## API Contract

Added:

`GET /api/v1/mission/current`

Response shape:

- `currentMission`
- `nextMission`
- `progress`
- `estimatedCompletion`

## Consumer Changes

### Journey State

`JourneyMissionAdapter` now consumes Mission Engine authority instead of legacy `getCurrentMission()`.

### AI COO

`COOPlanAssembler` now consumes `currentMission` from Mission Engine.

AI COO advises on missions. It does not create missions.

### Dashboard Projection

`DashboardProjectionAdapter` now consumes Mission Engine for:

- Mission hero
- Current mission
- Next action route
- Progress path
- Completion percentage
- Next milestone

Dashboard UI remains presentation-only.

## Verification

Commands:

```bash
pnpm exec vitest run src/__tests__/services/mission-engine-authority.test.ts src/__tests__/services/dashboard-projection-adapter.test.ts src/lib/observability/__tests__/event-envelope.test.ts
pnpm type-check
git diff --check
```

Additional grep:

```bash
grep -RIn "getCurrentMission\|getNextJourneyAction" src/modules/dashboard src/modules/journey/adapters/JourneyMissionAdapter.ts src/modules/ai-coo/adapters/COOPlanAssembler.ts
```

Expected result:

- Dashboard has no mission derivation.
- Journey mission adapter consumes Mission Engine authority.
- AI COO consumes Mission Engine authority.
