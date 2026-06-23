# COO-002 Bottleneck Engine PRD

Version: V8
Status: P0 Critical
Owner: AI COO System

## Depends On

- COO-001 Business State Engine PRD
- COO-001A State Requirements Matrix
- COO-001B State Validation Engine PRD
- DASH-003 AI COO Mission Engine PRD

## Mission

Identify the single constraint most responsible for preventing business growth.

The Bottleneck Engine exists to answer:

> What is stopping this business from progressing?

## Core Philosophy

Business State tells us where the user is.

Bottleneck tells us why the user is stuck.

Two users can share the same Business State and still have different bottlenecks:

- `LEAD_GENERATION` with `traffic = 0`, `leads = 0`, `customers = 0` resolves to `NO_TRAFFIC`.
- `LEAD_GENERATION` with `traffic = 500`, `leads = 120`, `customers = 0` resolves to `NO_CONVERSION`.

Same state. Different bottleneck. Different mission.

## Decision Hierarchy

1. Validation Engine
2. Business State Engine
3. Signal Engine
4. Bottleneck Engine
5. Priority Engine
6. Mission Generator

## Inputs

- Business State
- Validation Results
- Traffic Metrics
- Lead Metrics
- Customer Metrics
- Content Metrics
- Offer Metrics
- CRM Metrics
- Agent Activity
- Journey Progress

## Output Contract

```ts
interface BottleneckResult {
  bottleneck: MissionBottleneck;
  confidence: number;
  evidence: string[];
  severity: 'Critical' | 'High' | 'Medium';
  explainability: string;
}
```

Only one bottleneck may exist in the final result.

## Supported Bottlenecks

- `NO_BRAND`
- `NO_POSITIONING`
- `NO_CONTENT`
- `NO_AUDIENCE`
- `NO_LEAD_MAGNET`
- `NO_FUNNEL`
- `NO_TRAFFIC`
- `NO_LEADS`
- `NO_CONVERSION`
- `NO_CUSTOMERS`
- `NO_RETENTION`
- `NO_SYSTEM`
- `NO_TEAM`

## Resolution Rules

The highest-impact constraint wins.

The winner is not necessarily:

- the earliest missing item
- the latest activity
- the first incomplete validation rule

Examples:

- `trafficCount = 0` produces `NO_TRAFFIC`.
- `trafficCount > 100` and `leadCount = 0` produces `NO_LEADS`.
- `leadCount > 20` and `customerCount = 0` produces `NO_CONVERSION`.

## Signal Engine

Version 1 is deterministic and does not use AI.

Traffic signals:

- `trafficCount`
- `trafficTrend`
- `activeTrafficSourceCount`

Lead signals:

- `leadCount`
- `leadGrowthRate`
- `leadConversionRate`

Sales signals:

- `customerCount`
- `revenue`
- `closeRate`

Content signals:

- `contentCount`
- `contentConsistency`
- `engagementRate`

Offer signals:

- `offerExists`
- `offerPublished`
- `offerConversionRate`

## Candidate Ranking

The engine creates candidates, then ranks them.

Severity weights:

- `Critical = 100`
- `High = 50`
- `Medium = 20`

Tie breaker: Business State relevance.

## Dashboard Rule

Dashboard never calculates bottlenecks.

Dashboard consumes:

- `bottleneck`
- `severity`
- `explainability`

## Priority Engine Rule

Priority Engine must consume:

- Business State
- Bottleneck
- Signals

Priority Engine must not inspect raw metrics.

## Mission Engine Rule

Mission Engine consumes `BottleneckResult`.

Mission Engine does not determine bottlenecks.

## Recalculation Triggers

- Traffic Updated
- Lead Added
- Customer Added
- Offer Published
- Content Published
- Mission Completed
- Manual Refresh

## Error Handling

Signal failure must return:

- `bottleneck = NO_SYSTEM`
- `severity = High`
- `explainability = Business signals unavailable.`

Never return `null`, `undefined`, or `unknown`.

## Success Metrics

- Bottleneck Accuracy: 85%
- Mission Acceptance Rate: 75%
- Mission Completion Rate: 65%
- Manual Override Rate: below 10%

## Final Principle

Business State tells us where the user is.

Signals tell us what is happening.

Bottleneck tells us what is stopping progress.
