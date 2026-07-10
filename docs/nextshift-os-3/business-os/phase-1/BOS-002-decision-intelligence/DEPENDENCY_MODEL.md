# BOS-002 Dependency Model

## Purpose

This document defines the dependency model for Decision Intelligence.

## Dependency Principle

Decision Intelligence must operate from documented business context. It cannot recommend, prioritize, or rank opportunities without the foundation provided by BOS-001.

## Dependency Chain

```text
BOS-001 Business Foundation
  -> BOS-002 Decision Intelligence
  -> BOS-003 AI Workflow
```

## Dependency Roles

| Dependency | Provides | Consumed By |
| --- | --- | --- |
| BOS-001 Business Foundation | Business identity, customer context, content context, campaign context, revenue context, analytics readiness, and Business Brain intelligence | BOS-002 Decision Intelligence |
| Decision Brain | Recommendation and prioritization framing | Recommendation Engine, Opportunity Ranking, AI Workflow |
| Recommendation Engine | Explainable next-action guidance | AI Workflow, Automation, Business Brain |
| Business Context | Minimum decision input boundary | Decision Brain, Recommendation Engine, Prioritization |
| Decision Policies | Decision governance boundary | Recommendation Engine, AI Workflow, Audit |

## BOS-003 Dependency

BOS-003 AI Workflow depends on BOS-002 for:

- Recommended action
- Recommendation rationale
- Priority
- Opportunity context
- Decision policy boundary
- Required business context
- Execution readiness signal

## Boundary

This dependency model is documentation-only. It does not introduce dependency injection, package dependencies, runtime wiring, event contracts, database relationships, or API requirements.
