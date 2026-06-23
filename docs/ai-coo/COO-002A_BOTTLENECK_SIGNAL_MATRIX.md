# COO-002A Bottleneck Signal Matrix

Version: V8
Status: P0 Critical
Owner: AI COO System

## Depends On

- COO-002 Bottleneck Engine PRD
- COO-001 Business State Engine PRD
- COO-001A State Requirements Matrix
- COO-001B State Validation Engine PRD

## Mission

Define the deterministic signal rules used by the Bottleneck Engine.

This matrix is the source of truth for:

- signal thresholds
- bottleneck candidates
- severity ranking
- evidence requirements
- explainability inputs

The Bottleneck Engine must validate bottlenecks from signals. It must not guess.

## Severity

- `Critical`: the business cannot progress because the core capability is missing.
- `High`: the capability exists but is not producing results.
- `Medium`: the capability exists but is weak or inconsistent.

Severity weights:

- `Critical = 100`
- `High = 50`
- `Medium = 20`

## Tie Breakers

When two bottlenecks have the same severity:

1. Business State relevance
2. Revenue proximity
3. Current Journey stage
4. Latest user action
5. Default state order

## Signal Rules

| Bottleneck | Severity | Rule summary | Evidence examples |
| --- | --- | --- | --- |
| `NO_BRAND` | Critical | AI Interview incomplete, business context missing, personal story too short, or target audience missing | `aiInterviewCompleted=false`, `businessContextExists=false`, `personalStoryLength=42`, `targetAudienceExists=false` |
| `NO_POSITIONING` | Critical | Niche missing, fewer than 3 audience pains, transformation missing, or positioning missing | `nicheSelected=false`, `audiencePainCount=1`, `transformationStatementExists=false`, `positioningStatementExists=false` |
| `NO_CONTENT` | Critical | Fewer than 3 content pillars, fewer than 5 content drafts, or content engine disabled | `contentPillarCount=1`, `contentDraftCount=2`, `contentEngineEnabled=false` |
| `NO_AUDIENCE` | High | At least 5 published content pieces with no engagement, or audience size is 0 | `publishedContentCount=7`, `engagementCount=0`, `audienceSize=0` |
| `NO_LEAD_MAGNET` | Critical | Lead magnet, publication, CTA, or asset is missing | `leadMagnetExists=false`, `leadMagnetPublished=false`, `leadMagnetCtaExists=false`, `leadMagnetAssetExists=false` |
| `NO_FUNNEL` | Critical | Landing page, thank-you page, lead route, contact method, or funnel test is missing | `landingPagePublished=false`, `thankYouPagePublished=false`, `leadRouteExists=false`, `contactMethodExists=false`, `funnelTestPassed=false` |
| `NO_TRAFFIC` | Critical | Active traffic source count is 0 or traffic count is 0 | `activeTrafficSourceCount=0`, `trafficCount=0` |
| `NO_LEADS` | High | `trafficCount >= 100` and `leadCount = 0`, or `leadConversionRate < 1%` with enough traffic | `trafficCount=150`, `leadCount=0`, `leadConversionRate=0%` |
| `NO_CONVERSION` | High | `leadCount >= 20` and `customerCount = 0`, or `closeRate < 2%` with enough leads | `leadCount=28`, `customerCount=0`, `closeRate=0%` |
| `NO_CUSTOMERS` | High | Offer and sales workflow exist, customer count is 0, and lead count is positive | `offerPublished=true`, `salesWorkflowExists=true`, `customerCount=0`, `leadCount=8` |
| `NO_RETENTION` | Medium | `customerCount >= 3` and no repeat purchase, or retention below 20% | `customerCount=5`, `repeatPurchaseCount=0`, `retentionRate=0%` |
| `NO_SYSTEM` | High | Validation failed, signal source unavailable, or required metrics cannot be resolved | `validationFailed=true`, `signalSourceAvailable=false`, `requiredMetricsResolved=false` |
| `NO_TEAM` | Medium | Revenue exists and SOP count is below 3, or revenue exists with no active agents and no team members | `revenue=500`, `sopCount=1`, `activeAgentCount=0`, `teamMemberCount=0` |

## Business State Relevance Map

- `BRAND_FOUNDATION`: `NO_BRAND`
- `BRAND_POSITIONING`: `NO_POSITIONING`
- `CONTENT_SYSTEM`: `NO_CONTENT`, `NO_AUDIENCE`
- `LEAD_MAGNET`: `NO_LEAD_MAGNET`, `NO_AUDIENCE`
- `FUNNEL`: `NO_FUNNEL`, `NO_LEADS`
- `LEAD_GENERATION`: `NO_TRAFFIC`, `NO_LEADS`, `NO_AUDIENCE`
- `SALES`: `NO_CONVERSION`, `NO_CUSTOMERS`, `NO_LEADS`
- `TEAM_BUILDING`: `NO_TEAM`, `NO_SYSTEM`, `NO_RETENTION`

## Revenue Proximity Rank

Highest to lowest:

1. `NO_CONVERSION`
2. `NO_CUSTOMERS`
3. `NO_RETENTION`
4. `NO_LEADS`
5. `NO_TRAFFIC`
6. `NO_FUNNEL`
7. `NO_LEAD_MAGNET`
8. `NO_AUDIENCE`
9. `NO_CONTENT`
10. `NO_POSITIONING`
11. `NO_BRAND`
12. `NO_SYSTEM`
13. `NO_TEAM`

## Evidence Contract

Every `BottleneckResult` must include:

- `bottleneck`
- `severity`
- `confidence`
- `evidence`
- `explainability`

## Confidence Rule

Confidence is internal. Do not show confidence on Dashboard.

V1 formula:

- Critical + direct evidence: `90`
- High + direct evidence: `80`
- Medium + direct evidence: `65`
- No direct evidence: `40`

## Dashboard Rule

Dashboard may show:

- bottleneck label
- severity
- explanation
- next mission

Dashboard must not show:

- confidence percentage
- raw score
- internal signal table

## Failure Rule

If signals cannot be resolved, return:

- `bottleneck = NO_SYSTEM`
- `severity = High`
- `confidence = 80`
- `evidence = Business signals unavailable.`

Never return `null`, `undefined`, or `unknown`.

## Required Test Cases

- `trafficCount = 0`, `leadCount = 0`, `customerCount = 0` -> `NO_TRAFFIC`
- `trafficCount = 150`, `leadCount = 0` -> `NO_LEADS`
- `leadCount = 25`, `customerCount = 0` -> `NO_CONVERSION`
- `customerCount = 5`, `repeatPurchaseCount = 0` -> `NO_RETENTION`
- `validationFailed = true` -> `NO_SYSTEM`

## Final Principle

Signals create candidates.

Candidates create ranking.

Ranking creates the bottleneck.

The AI COO does not guess what is wrong. It proves what is blocking progress.
