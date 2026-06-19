# Interview Authority Duplicate Authorities

Scope: discovery only. This document records the current duplicated and competing sources that overlap with the future interview authority domain.

## 1. Profile Truth Duplication

### Active sources

1. `src/modules/brand-builder/services/brand-interview-service.ts`
   - `confirmProfile()` writes both:
     - `User.metadata.brand_profile`
     - `BrandProfile`
2. `src/app/api/v1/brand-builder/profile/route.ts`
   - PATCH writes directly to `User.metadata.brand_profile`
3. `src/modules/brand-dna/services/brandDnaService.ts`
   - `saveBrandDNA()` writes both:
     - `BrandProfile`
     - `User.metadata.brand_profile`
4. `prisma/schema.prisma`
   - storage models:
     - `BrandInterview.extractedProfile`
     - `BrandProfile`
     - `User.metadata.brand_profile`

### Duplicate authority finding

Current profile truth exists in three runtime states:

1. live/extracted profile in `BrandInterview.extractedProfile`
2. canonical structured profile in `BrandProfile`
3. legacy mirrored profile in `User.metadata.brand_profile`

This is not a single-source system. It is a synchronized duplication pattern, with additional legacy direct writes still allowed.

### Evidence

- `brand-interview-service.confirmProfile()` writes both long-lived stores
- `brand-builder/profile` PATCH bypasses `BrandProfile` and writes legacy metadata only
- `brandDnaService.saveBrandDNA()` preserves backward compatibility by writing both stores

### Audit verdict

- Active: `YES`
- Authoritative: `PARTIAL`
- Duplicated elsewhere: `YES`
- Can become part of Interview Authority: `YES`
- Should eventually be retired: `metadata.brand_profile` direct-write path `YES`

## 2. Audience Truth Duplication

### Active sources

1. `src/modules/brand-builder/services/brand-interview-service.ts`
   - dialogue slot: `preferred_audience`
   - extracted fields: `target_audience`, `audience_pain_points`
2. `prisma/schema.prisma`
   - `BrandProfile.targetAudience`
   - `BrandProfile.audiencePainPoints`
3. `User.metadata.brand_profile`
   - carries `target_audience`, `audience_pain_points`
4. `src/modules/member/services/onboarding-service.ts`
   - writes:
     - `metadata.goals.target_audience`
     - top-level `metadata.target_audience`
5. `src/app/api/v1/member/onboarding/goals/route.ts`
   - runtime entrypoint for onboarding audience writes

### Duplicate authority finding

Audience truth currently exists in at least four overlapping forms:

1. interview slot-level audience intent
2. extracted audience profile in `BrandInterview.extractedProfile`
3. confirmed audience fields in `BrandProfile`
4. onboarding metadata audience fields outside interview flow

The onboarding path is a separate authority, not just a cached read model.

### Evidence

- Interview chain extracts audience facts from dialogue
- `confirmProfile()` writes audience fields into both canonical and legacy profile stores
- onboarding service separately persists target audience into metadata

### Audit verdict

- Active: `YES`
- Authoritative: `NO`
- Duplicated elsewhere: `YES`
- Can become part of Interview Authority: `YES`
- Should eventually be retired: onboarding metadata audience truth as a competing authority `YES`

## 3. Business Mode Truth Duplication

### Active sources

1. `src/app/api/v1/funnel-os/route.ts`
   - reads query param `type`
   - defaults to `retail`
2. `src/components/funnel-operating-system/useFunnelPreference.ts`
   - reads/writes `localStorage['nextshift.currentFunnel']`
3. `src/modules/funnel/services/funnel-context-provider.ts`
   - hard-coded contexts for:
     - `retail`
     - `recruitment`
     - `upgrade`
4. `src/modules/content-engine/services/content-pillar-service.ts`
   - uses `brandContext.industry === 'recruitment'` as an indirect branch

### Duplicate authority finding

Business mode does not have a canonical interview-owned source in the current runtime. Instead, the system uses:

1. request-level mode selection
2. client preference storage
3. static service defaults
4. downstream heuristics

This is an unresolved multi-authority cluster rather than a primary-vs-legacy pair.

### Evidence

- No interview runtime field or persistence layer was found that owns `retail | recruitment | hybrid`
- active behavior is spread across funnel route, local storage, service defaults, and downstream content heuristics

### Audit verdict

- Active: `YES`
- Authoritative: `NO`
- Duplicated elsewhere: `YES`
- Can become part of Interview Authority: `PARTIAL`
- Should eventually be retired: query/local-storage/static default authority split `YES`

## 4. Business Context Truth Duplication

### Active sources

1. `src/modules/brand-builder/services/brand-interview-service.ts`
   - extracted fields:
     - `positioning`
     - `content_pillars`
     - `recommended_platforms`
     - `recommended_frequency`
2. `src/modules/brand-dna/services/brandDnaService.ts`
   - canonical+legacy read/write bridge for structured brand context
3. `src/modules/brand-dna/services/BrandContextProvider.ts`
   - downstream context reader with metadata fallback
4. `src/app/api/v1/brand-builder/profile/route.ts`
   - direct metadata patch surface
5. `src/modules/member/services/onboarding-service.ts`
   - writes `metadata.brand_positioning`
6. `src/app/(auth)/brand-builder/calendar/page.tsx`
   - merges canonical brand DNA with legacy metadata strategy fields
7. `src/modules/brand-discovery/brandDnaGenerator.ts`
   - derives strategy outputs from interview-derived inputs

### Duplicate authority finding

Business context truth is split across:

1. extracted interview strategy-like outputs
2. confirmed `BrandProfile` structured context
3. legacy `metadata.brand_profile`
4. onboarding positioning metadata
5. mixed consumer-side merges

This is both a storage duplication problem and a read-precedence problem.

### Evidence

- `BrandContextProvider` reads `BrandProfile` then metadata fallback
- calendar page merges canonical and legacy fields in the page itself
- onboarding service writes positioning outside the interview/brand DNA chain
- direct profile PATCH can mutate legacy context without touching canonical table

### Audit verdict

- Active: `YES`
- Authoritative: `NO`
- Duplicated elsewhere: `YES`
- Can become part of Interview Authority: `YES`
- Should eventually be retired: mixed consumer-side merges and legacy metadata direct writes `YES`

## 5. Duplicate Authority Summary

| Domain | Current Dominant Sources | Duplication Pattern | Status |
| --- | --- | --- | --- |
| Profile | `BrandInterview.extractedProfile`, `BrandProfile`, `metadata.brand_profile` | synchronized duplicate stores + legacy direct writes | Active conflict |
| Audience | interview slots/extraction, `BrandProfile`, `metadata.brand_profile`, onboarding metadata | overlapping fact stores | Active conflict |
| Business Mode | query param, localStorage, hard-coded defaults, heuristics | fragmented unresolved authority | Active conflict |
| Business Context | extracted strategy, `BrandProfile`, `metadata.brand_profile`, onboarding positioning, consumer merges | duplicate writes + mixed read precedence | Active conflict |

## 6. Current retirement candidates

These sources are currently the strongest retirement candidates once a real interview authority exists:

1. `src/app/api/v1/brand-builder/profile/route.ts` direct metadata-only PATCH authority
2. `src/modules/member/services/onboarding-service.ts` as a competing audience/positioning truth source
3. consumer-side legacy merges such as `src/app/(auth)/brand-builder/calendar/page.tsx`
4. funnel mode truth split across:
   - `src/app/api/v1/funnel-os/route.ts`
   - `src/components/funnel-operating-system/useFunnelPreference.ts`
   - `src/modules/funnel/services/funnel-context-provider.ts`

None of these are ready to delete today. This document records them as current competing authorities.
