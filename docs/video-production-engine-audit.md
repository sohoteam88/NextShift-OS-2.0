# Video Production Engine Audit

Date: 2026-06-12

## Existing Assets

| File | What | Reuse |
|------|------|-------|
| `VideoProject` Prisma model | Full video project: strategy, masterScript, shotList, brollList, veoPrompt, minimaxPrompt, capcutScript, subtitleSrt, platformAdaptations, status | ✅ Reuse as-is |
| `modules/video/services/video-strategy-service.ts` | AI-powered video strategy generation | ✅ Reuse/Extend |
| `modules/video/services/video-finalize-service.ts` | Finalize + publish video | ✅ Reuse |
| `modules/video/types.ts` | Video types | Reference |
| `modules/brand-builder/services/video-script-service.ts` | Video script generator | Extend |
| `app/api/v1/video/projects/` | CRUD for VideoProject | ✅ Reuse |
| `app/(auth)/video/` | Video pages | Extend |

## Plan

- Extend VideoProject model usage (model already has all needed fields)
- Build deterministic generators for hook, strategy, shot list, b-roll, AI prompts, CapCut, subtitles, platform adaptation
- Create unified VideoProductionDashboard
- Add /api/v1/video-production endpoints
