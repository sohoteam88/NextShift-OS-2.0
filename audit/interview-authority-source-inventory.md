# Interview Authority Source Inventory

Scope: discovery only. This inventory records the current runtime sources that participate in interview capture, extraction, profile confirmation, and downstream profile/audience/context consumption.

## Source Inventory

| File Path | Source Name | Authority Role | Read Path | Write Path | Data Class | Active Status | Migration Risk | Target Projection |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `prisma/schema.prisma` | `BrandInterview.answers` | Live interview session storage for raw answers and `__dialogue` state | Read by `brand-interview-service`, `useBrandDiscovery`, interview APIs | Written by `brandInterviewService.create()`, `saveAnswer()`, `sendDialogueMessage()` | Fact | Active | High | `InterviewProfileSnapshot` |
| `prisma/schema.prisma` | `BrandInterview.extractedProfile` | Extracted interview profile storage after AI parsing | Read by `brand-interview-service`, regeneration flows | Written by `extractBrandProfile()`, `confirmProfile()` | Inference | Active | High | `InterviewProfileSnapshot` |
| `prisma/schema.prisma` | `BrandProfile` table | Canonical structured brand/profile persistence for downstream product surfaces | Read by `brandDnaService`, `BrandContextProvider`, brand intelligence projections | Written by `confirmProfile()`, `saveBrandDNA()` | Fact + Strategy | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `prisma/schema.prisma` | `User.metadata.brand_profile` | Legacy profile mirror and direct-write compatibility store | Read by brand-builder pages, profile API, brand DNA fallbacks | Written by `confirmProfile()`, profile PATCH route, `saveBrandDNA()` | Fact + Strategy | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-builder/services/brand-interview-service.ts` | Interview runtime + extraction service | Primary interview authority: collects dialogue, extracts profile, confirms into storage | Reads `BrandInterview.answers`, `BrandInterview.extractedProfile`, user metadata | Writes `BrandInterview.answers`, `BrandInterview.extractedProfile`, `User.metadata.brand_profile`, `BrandProfile` | Fact + Inference | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/interview/route.ts` | Interview session API | Runtime entrypoint for create/read latest interview session | Reads latest `BrandInterview` | Writes new `BrandInterview` via service | Fact | Active | Medium | `InterviewProfileSnapshot` |
| `src/app/api/v1/brand-builder/interview/[id]/answer/route.ts` | Answer patch API | Raw answer write path | Reads interview id from route params | Writes `BrandInterview.answers[questionId]` via service | Fact | Active | Medium | `InterviewProfileSnapshot` |
| `src/app/api/v1/brand-builder/interview/[id]/message/route.ts` | Dialogue message API | Live conversation write path | Reads current interview state | Writes `answers.__dialogue`, status via service | Fact | Active | Medium | `InterviewProfileSnapshot` |
| `src/app/api/v1/brand-builder/interview/[id]/extract/route.ts` | Extraction API | Explicit extraction trigger | Reads interview record through service | Writes `extractedProfile`, status via service | Inference | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/interview/[id]/finish/route.ts` | Finish interview API | Finalization trigger before extraction | Reads interview via service | Writes status and extraction side effects via service | Fact + Inference | Active | Medium | `InterviewProfileSnapshot` |
| `src/app/api/v1/brand-builder/interview/[id]/confirm/route.ts` | Confirm profile API | Confirmation write path into long-lived profile stores | Reads extracted profile and edited payload | Writes `BrandInterview.extractedProfile`, `User.metadata.brand_profile`, `BrandProfile` | Fact + Strategy | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-builder/components/wizard/InterviewStepClient.tsx` | Brand Builder interview UI | Primary active consumer of interview runtime | Reads `/api/v1/brand-builder/interview`, local dialogue state, extracted profile | Writes via `/message`, `/finish`, `/profile` | Fact | Active | Medium | `InterviewProfileSnapshot` |
| `src/modules/brand-discovery/hooks/useBrandDiscovery.ts` | Brand Discovery interview hook | Secondary consumer that reconstructs slots and confidence from live interview state | Reads `/api/v1/brand-builder/interview`, `answers.__dialogue`, slot extraction/confidence helpers | Writes via `/message`, `/finish` | Fact + Inference | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot` |
| `src/modules/brand-discovery/slotExtractionService.ts` | Slot schema / slot completeness helper | Defines six interview slots and fill semantics | Read by `useBrandDiscovery`, brand-discovery UI helpers | No direct persistence writes | Inference | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot` |
| `src/modules/brand-discovery/coachBrain.ts` | Dynamic question planner | Chooses follow-up questions from slot state | Reads slot state from callers | No direct persistence writes | Inference | Active | Medium | `InterviewProfileSnapshot` |
| `src/modules/brand-discovery/brandConfidenceEngine.ts` | Interview confidence helper | Derives readiness/confidence from slot state | Reads extracted slot values | No direct persistence writes | Inference | Active | Medium | `UNRESOLVED` |
| `src/app/api/v1/brand-builder/profile/route.ts` | Legacy profile API | Direct legacy read/write path to `metadata.brand_profile` | Reads `User.metadata.brand_profile` | Writes merged `User.metadata.brand_profile` only | Fact + Strategy | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-dna/services/brandDnaService.ts` | Brand DNA read/write bridge | Canonical brand/profile accessor with metadata fallback and backward-compat mirror writes | Reads `BrandProfile`, falls back to `metadata.brand_profile`, reads `BrandInterview.extractedProfile` for regeneration | Writes `BrandProfile` and `metadata.brand_profile` | Fact + Strategy | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-dna/services/BrandContextProvider.ts` | Downstream brand context provider | Read-side authority for AI/content modules, with metadata fallback | Reads `BrandProfile` first, then `metadata.brand_profile` | No direct writes | Fact + Strategy | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-intelligence/projections/brand-health-projection.ts` | Brand health projection | Read-side projection consuming brand/profile truth with metadata fallback | Reads `BrandProfile`, fallback `metadata.brand_profile` | No direct writes | Inference | Active | Medium | `BusinessContextSnapshot` |
| `src/app/(auth)/brand-builder/calendar/page.tsx` | Calendar strategy page | Mixed-source consumer merging canonical brand DNA with legacy metadata | Reads `brandDnaService.getBrandDNA()` and `metadata.brand_profile` | No direct writes | Strategy | Active | High | `BusinessContextSnapshot` |
| `src/modules/member/services/onboarding-service.ts` | Member onboarding side-channel | Separate write path for target audience, goals, specialty, positioning | Reads `metadata.goals`, `metadata.brand_positioning` | Writes `metadata.goals.target_audience`, top-level `metadata.target_audience`, `metadata.brand_positioning` | Fact + Strategy | Active | High | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/member/onboarding/goals/route.ts` | Goals API | Entry point for onboarding audience/goals writes | Reads auth user context | Writes onboarding metadata via service | Fact | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-discovery/brandDnaGenerator.ts` | Brand DNA generator | Strategy derivation from extracted interview/profile inputs | Reads extracted profile style inputs from callers | No direct writes; outputs derived DNA payloads to callers | Strategy | Active | Medium | `BusinessContextSnapshot` |
| `src/app/api/v1/funnel-os/route.ts` | Funnel type query source | Business-mode-like source using request `type` query param | Reads `type` query param, default `retail` | No persistence writes | Strategy | Active | High | `BusinessModeSnapshot` |
| `src/components/funnel-operating-system/useFunnelPreference.ts` | Funnel preference local storage | Client-side business-mode-like source | Reads `localStorage['nextshift.currentFunnel']` | Writes same localStorage key | Strategy | Active | High | `BusinessModeSnapshot` |
| `src/modules/funnel/services/funnel-context-provider.ts` | Hard-coded funnel mode defaults | Static business-mode context definitions for `retail`, `recruitment`, `upgrade` | Read by funnel flows | No direct persistence writes | Strategy | Active | High | `BusinessModeSnapshot` |
| `src/modules/content-engine/services/content-pillar-service.ts` | Industry heuristic branch | Indirect business-mode inference via `industry === 'recruitment'` | Reads `brandContext.industry` | No direct writes | Inference | Active | Medium | `BusinessModeSnapshot` |

## Source Notes

### 1. Current active interview authority chain

The current live interview authority is split across three layers:

1. `BrandInterview.answers`
2. `BrandInterview.extractedProfile`
3. confirmed long-lived profile stores:
   - `BrandProfile`
   - `User.metadata.brand_profile`

`brand-interview-service` is the only runtime that touches all three layers end to end.

### 2. Current storage precedence observed in code

Observed runtime precedence is not globally uniform, but these patterns are active:

1. Interview extraction input precedence inside `extractBrandProfile()`:
   - `answers.__dialogue.messages`
   - `voiceProfile.transcript`
   - raw `answers`
2. Downstream brand context precedence:
   - `BrandProfile`
   - `metadata.brand_profile`
3. Some legacy brand-builder routes still bypass canonical reads and directly use:
   - `metadata.brand_profile`

### 3. Business mode remains unresolved

No interview-owned canonical business mode source was found in the current runtime. The active sources are fragmented across:

- URL query param `type`
- localStorage funnel preference
- hard-coded funnel context defaults
- downstream heuristics based on industry

This remains the largest unresolved source cluster in this audit.
