# COO-003 Priority Engine PRD

## Mission

The Priority Engine determines the highest leverage action the user should execute right now.

The Bottleneck Engine answers what is blocking growth. The Priority Engine answers what should be done first.

## Decision Hierarchy

1. Validation Engine
2. Business State Engine
3. Signal Engine
4. Bottleneck Engine
5. Priority Engine
6. Mission Generator
7. Dashboard

## Output Contract

```ts
type PriorityResult = {
  priorityAction: string;
  priorityReason: string;
  expectedImpact: string;
  urgency: 'Critical' | 'High' | 'Normal';
  confidence: number;
  category: PriorityCategory;
  missionType: MissionType;
  route: string;
  ctaLabel: string;
};
```

Only one priority action may be emitted.

Confidence is internal and must not be displayed on the Dashboard.

## Priority Categories

- `FOUNDATION`
- `CONTENT`
- `LEADS`
- `CONVERSION`
- `RETENTION`
- `SYSTEM`
- `SCALE`
- `OPTIMIZATION`

## Rules

- Fix bottlenecks before optimization.
- Fix constraints closest to revenue.
- Never scale broken systems.
- Never automate missing systems.
- Available agents may increase score, but must not determine the score.
- Mission history should avoid repeating the same priority unless new evidence requires it.
- On priority failure, fall back to the bottleneck default action.

## Bottleneck Mapping

| Bottleneck | Priority Action |
| --- | --- |
| `NO_BRAND` | Complete AI Interview |
| `NO_POSITIONING` | Define Market Position |
| `NO_CONTENT` | Build Content Foundation |
| `NO_AUDIENCE` | Publish Audience Growth Content |
| `NO_LEAD_MAGNET` | Create Lead Magnet |
| `NO_FUNNEL` | Build Funnel |
| `NO_TRAFFIC` | Activate Traffic Source |
| `NO_LEADS` | Improve Lead Capture |
| `NO_CONVERSION` | Improve Offer |
| `NO_CUSTOMERS` | Convert Existing Leads |
| `NO_RETENTION` | Build Retention System |
| `NO_TEAM` | Create SOP |
| `BUSINESS_HEALTHY` | Optimize Growth |
| `NO_SYSTEM` | Restore Business Signals |

## Healthy Business Logic

When the bottleneck is `BUSINESS_HEALTHY`, the Priority Engine must emit optimization actions only. It must not generate repair, fix, restore, or recovery priorities.

## Dashboard Rule

Dashboard receives:

- Priority
- Reason
- Expected impact
- Urgency

Dashboard does not calculate priority.

## Mission Engine Rule

Mission Engine consumes `PriorityResult`. It must not rank or score actions itself.

## Acceptance Criteria

- `PriorityEngine` returns exactly one action.
- Every `MissionBottleneck` maps to a deterministic priority.
- `BUSINESS_HEALTHY` maps to optimization, not repair.
- `NO_SYSTEM` maps to signal restoration.
- Mission authority consumes `PriorityResult`.
- Dashboard does not display priority confidence.
- Priority tests and mission authority tests pass.
