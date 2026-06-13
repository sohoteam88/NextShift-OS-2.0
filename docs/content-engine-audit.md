# Content Engine Audit

Date: 2026-06-12

## Existing Assets

| File | What | Reuse |
|------|------|-------|
| `Content` Prisma model | tenantId, ownerId, type, platform, title, body, language, generatedByAi, status | ✅ Store generated posts |
| `ContentCalendar` Prisma model | tenantId, userId, date, pillar, pillarEmoji, title, hook, platform, format, status | ✅ Calendar storage |
| `brand-builder/services/content-calendar-service.ts` | Calendar CRUD, AI generation | ✅ Reuse for calendar ops |
| `brand-builder/components/ContentCalendarView.tsx` | Calendar display UI | Pattern reference |
| `brand-builder/components/ContentStrategyStep.tsx` | Content strategy wizard step | Pattern reference |
| `modules/ai/services/content-service.ts` | AI content generation | ✅ Reuse for AI gen |
| `brand-dna/types.ts` | `ContentPillar` type | ✅ Already canonical |
| `brand-dna/services/BrandContextProvider.ts` | `getBrandContext()` | ✅ Must use |

## Missing

| Need | Plan |
|------|------|
| Pillar generation from BrandContext | New `contentPillarGenerator.ts` |
| Calendar generation (30/90/180) | New `contentCalendarGenerator.ts` |
| Platform-specific post generation | New `contentPostGenerator.ts` |
| Content quality scoring | New `contentValidator.ts` |
| Deterministic advisor | New `contentAdvisor.ts` |
| Unified dashboard UI | New `ContentEngineDashboard.tsx` |

## Implementation

- Store pillars in `user.metadata.content_pillars`
- Reuse `ContentCalendar` model for calendar
- Reuse `Content` model for generated posts
- All generation reads `getBrandContext()`
