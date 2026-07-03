# BOS-002 Capability Matrix

## Purpose

This matrix maps Decision Intelligence capabilities to their Business OS role, source context, and documentation purpose.

## Matrix

| Capability | Business OS Role | Source Context | BOS-002 Use |
| --- | --- | --- | --- |
| Decision Brain | Decision intelligence foundation | BOS-001 Business Foundation and phase-2 architecture | Frames recommendation and prioritization behavior. |
| Recommendation Engine | Next-action guidance | Business identity, goals, customer context, commercial context, and analytics readiness | Defines how recommendations should be supported by business context. |
| Prioritization | Work ordering | Goals, opportunity value, urgency, and available evidence | Defines how competing actions should be ranked. |
| Opportunity Ranking | Business opportunity evaluation | Campaign, revenue, analytics, and Business Brain context | Defines how opportunities should be compared and explained. |
| Business Context | Decision input boundary | CAP-001 through CAP-008 consolidated by BOS-001 | Defines the minimum context required before decisions are recommended. |
| Decision Policies | Decision governance boundary | Product governance, release governance, and AI role standards | Defines which decision types can be recommended, blocked, escalated, or routed to review. |

## Consolidation Rule

BOS-002 may reference planned or existing architecture documents, but it must not change the lifecycle truth recorded by Business Brain, Decision Brain, or capability owners.

## Readiness for BOS-003

BOS-002 is ready for BOS-003 when the decision matrix gives AI Workflow clear inputs for what decision to execute, why it matters, and what evidence supports it.
