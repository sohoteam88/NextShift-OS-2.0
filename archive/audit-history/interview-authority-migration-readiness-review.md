# Interview Authority Migration Readiness Review

Scope: review only. This document uses only the completed Interview Authority audit artifacts to decide whether migration planning may begin.

## Final Decision

`READY WITH CONDITIONS`

Migration planning may begin, but it must be constrained by the blockers and retirement facts already proven in the audits. The system is not implementation-ready for a clean one-pass migration, but it is sufficiently understood to start migration planning.

## 1. Source Authority Review

| Source | Status | Reason |
| --- | --- | --- |
| `BrandInterview.answers` | KEEP | Active live interview capture authority. It is the runtime source for raw answers and dialogue state. |
| `BrandInterview.extractedProfile` | ADAPTER | Active extracted output, but it is an intermediate inference layer between capture and confirmed storage, not the final downstream authority. |
| `BrandProfile` | KEEP | Current canonical structured downstream read source for most service-backed consumers. |
| `metadata.brand_profile` | RETIRE | Still active, but only as legacy mirror and direct-write compatibility store. Audits show it creates duplication and local page/API dependence. |
| onboarding metadata (`metadata.goals.target_audience`, `metadata.target_audience`, `metadata.brand_positioning`) | ADAPTER | Active side-channel authority that still feeds runtime, but it is a competing truth source and cannot remain primary. |
| business-mode sources (`localStorage`, query param `type`, funnel defaults, heuristics) | UNRESOLVED | Audits show no canonical authority exists. Current runtime precedence is consumer-local. |

## 2. Consumer Migration Readiness

| Consumer Cluster | Status | Reason |
| --- | --- | --- |
| interview runtime routes and components | Ready For Migration | Sources, consumers, and precedence are identified. Runtime is concentrated in `brandInterviewService` and the interview API/UI chain. |
| canonical downstream service cluster (`brandDnaService`, `BrandContextProvider`, projections) | Ready For Migration | Read precedence is known, high fan-out hubs are identified, and fallback behavior is documented. |
| legacy builder pages and helper APIs | Ready For Migration | High-risk but well-identified. Direct metadata readers and route-level dependencies are fully listed. |
| onboarding audience/context cluster | Not Ready | Consumer set is known, but this remains a competing authority island with no resolved cross-runtime winner. |
| business-mode cluster | Blocked | No canonical authority exists. Current runtime uses localStorage, query params, defaults, and heuristics with no shared precedence resolver. |

## 3. Projection Readiness

### `InterviewProfileSnapshot`

- source identified: `YES`
- precedence identified: `YES`
- consumers identified: `YES`

Status: `READY`

### `AudienceSnapshot`

- source identified: `YES`
- precedence identified: `PARTIAL`
- consumers identified: `YES`

Status: `READY`

Reason: enough evidence exists to plan migration, but onboarding metadata remains a competing audience authority.

### `BusinessContextSnapshot`

- source identified: `YES`
- precedence identified: `PARTIAL`
- consumers identified: `YES`

Status: `READY`

Reason: canonical-vs-legacy precedence is known, but page-level merges and onboarding positioning remain active exceptions.

### `BusinessModeSnapshot`

- source identified: `YES`
- precedence identified: `YES`, but only as fragmented consumer-local behavior
- consumers identified: `YES`

Status: `NOT READY`

Reason: the audits prove there is no canonical authority to migrate toward.

## 4. Retirement Candidates

These should eventually be retired, based on the completed audits:

1. direct `metadata.brand_profile` writes through `src/app/api/v1/brand-builder/profile/route.ts`
2. direct legacy metadata reads in brand-builder pages
3. `metadata.goals.target_audience` / top-level `metadata.target_audience` as competing audience truth
4. `metadata.brand_positioning` as competing business-context truth
5. page-level authority merges in `src/app/(auth)/brand-builder/calendar/page.tsx`
6. localStorage funnel authority in `useFunnelPreference()`
7. query-param funnel authority in `/api/v1/funnel-os`
8. hard-coded funnel defaults as mode/context authority

## 5. Required Adapters

These adapters are already implied by the current runtime evidence and are required to cross the existing source split during migration:

1. `BrandInterview.answers` -> `InterviewProfileSnapshot`
2. `BrandInterview.extractedProfile` -> `InterviewProfileSnapshot`
3. `BrandProfile` -> `InterviewProfileSnapshot`
4. `BrandProfile` -> `AudienceSnapshot`
5. `BrandProfile` -> `BusinessContextSnapshot`
6. `metadata.brand_profile` -> compatibility adapter for profile/audience/context consumers during retirement
7. onboarding metadata -> compatibility adapter for audience/context consumers during retirement
8. `BrandContextProvider` -> `AudienceSnapshot` / `BusinessContextSnapshot`

No adapter can resolve business mode cleanly yet, because the source authority itself is unresolved.

## 6. Migration Blockers

### Blocker 1

`BusinessModeSnapshot` has no canonical authority.

This is the clearest hard blocker. Planning can acknowledge it, but execution cannot complete this projection without first resolving authority.

### Blocker 2

Audience truth still has a live side-channel authority in onboarding metadata.

Canonical downstream readers usually prefer `BrandProfile`, but onboarding still reads and writes separate audience truth.

### Blocker 3

Business context still has a live side-channel authority in `metadata.brand_positioning`.

This remains a separate product-area read/write path outside the canonical `BrandProfile` chain.

### Blocker 4

Legacy profile metadata remains directly consumed by routes and pages.

This is not a discovery blocker anymore, but it is a migration-risk multiplier.

### Blocker 5

Some runtime surfaces still merge authorities locally.

The strongest proved example is `brand-builder/calendar/page.tsx`.

## 7. Migration Readiness Score

| Area | Score |
| --- | --- |
| Source Audit | 95 |
| Consumer Audit | 95 |
| Precedence Audit | 90 |
| Projection Readiness | 72 |
| Migration Risk | 62 |

Overall: `83/100`

## 8. Review Conclusion

Interview Authority is no longer blocked on discovery. The completed audits answered the questions they were supposed to answer:

- sources are identified
- duplicate authorities are identified
- consumers are identified
- precedence and fallback behavior are identified
- read/write authority behavior is identified

What remains is not audit incompleteness. What remains is runtime risk:

- legacy metadata still active
- onboarding side-channel truth still active
- business mode still unresolved

So the correct review decision is:

`READY WITH CONDITIONS`

Migration planning may begin. Business mode remains the major unresolved blocker, and audience/business-context side channels must be explicitly tracked as retirement or adapter cases.
