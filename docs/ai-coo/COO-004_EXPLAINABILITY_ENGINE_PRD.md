# COO-004 Explainability Engine PRD

## Mission

The Explainability Engine generates a complete explanation for every AI COO decision.

It answers:

- Why this?
- Why now?
- Why not something else?
- What happens next?
- What happens if the user ignores it?

## Decision Hierarchy

1. Validation Engine
2. Business State Engine
3. Bottleneck Engine
4. Priority Engine
5. Explainability Engine
6. Mission Generator
7. Dashboard

## Output Contract

```ts
type ExplainabilityResult = {
  whyThis: string;
  whyNow: string;
  whyNotOthers: string;
  expectedOutcome: string;
  expectedRisk: string;
  nextMilestone: string;
};
```

Every mission must include an explanation. No explanation means no mission.

## Quality Rules

- Do not expose internal scores such as confidence, candidate score, priority score, or severity weight.
- Do not expose raw signal tables such as `trafficCount=153`.
- Do not mention implementation details such as Bottleneck Engine, Priority Engine, or Validation Layer.
- Use business language and outcome language.

## Healthy Business Logic

`BUSINESS_HEALTHY` explains that there are no critical bottlenecks, optimization has the highest leverage, no repair action is needed, and the next milestone is scaling operations.

## NO_SYSTEM Logic

`NO_SYSTEM` explains that business signals are unavailable, reliable recommendations require restored signal visibility, speculative business recommendations should be avoided, and the next milestone is signal recovery.

## Dashboard Rule

Dashboard displays:

- Why This
- Why Now
- Expected Outcome
- Next Milestone

Dashboard may collapse:

- Why Not Others
- Expected Risk

## Audit Rule

Mission decision audit metadata stores:

- `whyThis`
- `whyNow`
- `whyNotOthers`
- `expectedOutcome`
- `expectedRisk`
- `nextMilestone`

## Acceptance Criteria

- Every mission has all six explainability fields.
- Dashboard projection includes structured explainability fields.
- No internal scores are exposed in explainability text.
- No raw signal evidence is exposed in explainability text.
- Type-check passes.
- Build passes.
