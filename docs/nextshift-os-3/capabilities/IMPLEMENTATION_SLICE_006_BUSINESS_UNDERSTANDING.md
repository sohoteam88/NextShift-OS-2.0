## IMPLEMENTATION_SLICE_006_BUSINESS_UNDERSTANDING

Version: 1.0

Status: Ready

Capability: CAP-001 Business Profile

Slice: 006

Priority: P0

---

## Purpose

Implement the first cognitive slice of the Business Brain.

Unlike previous slices, this slice does not collect new business facts.

Instead, it synthesizes existing business knowledge into a coherent Business Understanding.

This is the first slice where the Business Brain demonstrates reasoning rather than storage.

---

## Business Outcome

After completing this slice, the Business Brain can synthesize:

- Business Identity
- Brand DNA
- Offer
- Customer Intelligence
- Business Goals

into a unified business understanding.

The entrepreneur can review and confirm the AI's understanding.

---

## Scope

Included:

- Business Understanding synthesis
- Executive business summary
- Business strengths
- Business weaknesses
- Business opportunities
- Missing information detection
- Contradiction detection
- Confidence score

Excluded:

- AI recommendations
- Strategy generation
- Execution planning
- Learning
- Coaching
- Analytics

Those belong to future capabilities.

---

## Cognitive Architecture

```text
Identity
        +
Brand
        +
Offer
        +
Customer
        +
Goals

|
v

Business Brain

|
v

Business Understanding
```

The Business Brain performs synthesis.

No new business facts are created.

---

## Domain Changes

Package:

```text
packages/domain
```

Implement:

```ts
export interface BusinessUnderstanding {
  readonly executiveSummary: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly opportunities: readonly string[];
  readonly missingInformation: readonly string[];
  readonly contradictions: readonly string[];
  readonly confidence: number;
}
```

BusinessUnderstanding is a derived domain object.

It is not persisted as a primary business entity.

---

## Contract Changes

Package:

```text
packages/contracts
```

Add:

- BusinessUnderstandingPayload

Requests:

- GenerateBusinessUnderstandingRequest
- GetBusinessUnderstandingRequest

Responses:

- BusinessUnderstandingResult

Do not import `@nextshift/domain`.

---

## Business Twin Contract

Extend:

```text
BusinessTwinSnapshot
```

Add:

```ts
readonly understanding?: BusinessUnderstandingContext;
```

The context contains:

- Executive Summary
- Strengths
- Weaknesses
- Opportunities
- Missing Information
- Contradictions
- Confidence

---

## Application Layer

Package:

```text
packages/application
```

Implement:

- GenerateBusinessUnderstandingCommand
- GenerateBusinessUnderstandingUseCase
- GetBusinessUnderstandingQuery
- GetBusinessUnderstandingUseCase

Application coordinates Business Brain.

---

## Business Brain

Package:

```text
packages/business-brain
```

Implement:

- generateBusinessUnderstanding()
- getBusinessUnderstanding()

Responsibilities:

- Read all existing Business Profile sections.
- Detect missing information.
- Detect obvious inconsistencies.
- Generate a deterministic executive summary.
- Produce confidence score.

No generative AI.

No LLM calls.

Only deterministic synthesis.

---

## Event Bus

Package:

```text
packages/event-bus
```

Publish:

```text
BusinessUnderstandingGenerated
```

The event signals that a new understanding is available.

---

## Deterministic Rules

This slice should be deterministic.

Examples:

- Missing Brand -> missingInformation.
- Missing Customer -> lower confidence.
- Missing Goals -> lower confidence.
- Empty Offer -> contradiction warning.

Do not use probabilistic AI generation.

---

## Tests

Required:

- Domain tests
- Business Brain synthesis tests
- Application tests
- Event publication tests

---

## Audit

Claude Code should verify:

- Business Understanding is derived.
- No new business facts are invented.
- Deterministic synthesis.
- Runtime boundaries remain intact.
- No AI generation introduced.

---

## Acceptance Criteria

Slice-006 is complete when:

- Business Understanding can be generated.
- Business Understanding can be retrieved.
- Confidence score is computed.
- Missing information is detected.
- Contradictions are detected.
- BusinessUnderstandingGenerated event is publishable.
- Typecheck passes.
- Slice Audit passes.
- Chief Architect approves.

---

## Deliverables

Production-ready implementation for:

- Business Understanding
- Executive Summary
- Confidence
- Missing Information
- Contradiction Detection

---

## Next Slice

Slice-007

Business Twin Ready

The Business Twin is finalized and becomes available to downstream capabilities.
