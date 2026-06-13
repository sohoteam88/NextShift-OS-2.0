# Metadata Elimination Report

Date: 2026-06-12

## Audit Results — 13 metadata keys carrying business data

| Key | Used In | Has Prisma Model? | Classification | Action |
|-----|---------|-------------------|----------------|--------|
| `brand_profile` | 30+ files | ✅ BrandProfile (Fix 01) | **DONE** | Already migrated |
| `social_setup` | socialSetupService | ❌ | Business data | Create SocialProfile model or move to BrandProfile JSON column |
| `lead_magnet` | leadMagnetService | ❌ | Business data | Create LeadMagnet model |
| `webinar` | webinarService | ❌ | Business data | Create Webinar model or JSON column |
| `funnel_builder` | funnelBuilderService | ✅ Funnel model (duplicate!) | **DUPLICATE** | Remove metadata write; Funnel.config already stores it |
| `traffic_engine` | trafficEngineService | ❌ | Business data | Create TrafficCampaign model or JSON column |
| `whatsapp_ai` | whatsappService | ❌ | Business data | Move to WhatsAppSequence + Lead models |
| `content_pillars` | contentEngineService | ✅ BrandProfile.content_pillars | **DUPLICATE** | Remove; read from BrandProfile table |
| `content_calendar` | contentEngineService | ✅ ContentCalendar model! | **DUPLICATE** | Remove; use ContentCalendar Prisma model |
| `last_generated_post` | contentEngineService | ✅ Content model! | **DUPLICATE** | Remove; read from Content model |
| `last_video_package` | videoProductionService | ✅ VideoProject model! | **DUPLICATE** | Remove; read from VideoProject model |
| `brand_dna_versions` | brandDnaService | N/A (audit trail) | **KEEP** | Version history is appropriate in metadata |
| `brand_builder_state` | wizard-state-service | N/A (transient wizard) | **KEEP** | Wizard progress is transient UI state |
| `onboarding` + `goals` + `brand_positioning` + `first_content_options` | onboarding-service | Partial (Content, Funnel refs) | **REFACTOR** | Use existing Content/Funnel models for references |
| `whatsapp` (phone) | onboarding-service | ✅ User.phone! | **DUPLICATE** | Remove; use User.phone directly |

## Priority Fixes

### HIGH — Duplicate Storage (immediate wins, no new tables)

1. **Remove `funnel_builder` metadata write** — Funnel model already stores via `funnelBuilderService.generate()`
2. **Remove `content_pillars` metadata write** — BrandProfile.content_pillars is canonical
3. **Remove `content_calendar` metadata write** — ContentCalendar Prisma model exists
4. **Remove `last_generated_post` metadata write** — Content model exists
5. **Remove `last_video_package` metadata write** — VideoProject model exists
6. **Remove `whatsapp` phone duplicate** — User.phone field exists

### MEDIUM — New Models Required

7. **Create SocialProfile model** for `social_setup` data
8. **Create LeadMagnet model** for `lead_magnet` data

### LOW — Keep

9. `brand_dna_versions` — audit trail, appropriate for JSON storage
10. `brand_builder_state` — transient wizard state
