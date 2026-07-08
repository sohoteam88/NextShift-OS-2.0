# Creative Studio v1.0 Execution Task

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-08

---

## Task

Implement Creative Studio v1.0 according to the approved implementation contract.

---

## Branch

Use the current OS 3.3 runtime platform branch:

```text
planning/os-3.3-runtime-platform
```

---

## Implementation Steps

1. Inspect Business Architecture v1.0, Creative Studio Architecture, and released Business Foundation v1.0, Business Brain v1.0, Decision Engine v1.0, and Conversation Engine v1.0 documents.
2. Inspect existing domain, application, contract, and test patterns before editing.
3. Define Creative Studio domain primitives for the ten required creative areas.
4. Define read-only upstream references to Business Foundation, Business Brain, Decision Engine, and Conversation Engine outputs.
5. Implement AI Writer behavior.
6. Implement Content Generation Pipeline outputs.
7. Implement Visual Generation Pipeline outputs.
8. Implement Carousel Builder package records.
9. Implement Reel Builder package records.
10. Implement Blog & Email Generator package records.
11. Implement Publishing Package handoff records without publishing execution.
12. Implement Brand Kit Application constraints and validation state.
13. Implement Creative Lifecycle state and transitions.
14. Implement Creative Integration references and downstream handoff intent.
15. Implement Creative Studio integration through repositories, application services, contracts, exports, and tests.
16. Run required validation.
17. Stop after implementation reporting.

---

## Required Workstreams

Implement only Creative Studio v1.0:

- AI Writer
- Content Generation Pipeline
- Visual Generation Pipeline
- Carousel Builder
- Reel Builder
- Blog & Email Generator
- Publishing Package
- Brand Kit Application
- Creative Lifecycle
- Creative Integration

---

## Upstream Consumption Rule

Creative Studio must consume Business Foundation, Business Brain, Decision Engine, and Conversation Engine outputs as read-only inputs.

Creative Studio must not own or mutate:

- Business Foundation facts
- Business Brain understanding, insights, assessment, situation analysis, or interpretation
- Decision Engine recommendations, priority scores, confidence scores, explanations, opportunities, gaps, health, coach guidance, or lifecycle state
- Conversation Engine conversations, clarifications, brainstorm selections, approval outcomes, or handoff intent

---

## Explicit Non-Goals

Do not implement:

- Growth & Revenue
- Command Center
- publishing execution
- live channel posting
- external publishing integrations
- campaign execution
- revenue workflows
- autonomous action execution
- UI screens
- database migrations
- deployment behavior
- generated context-package changes
- generated ZIP artifacts as tracked files

---

## Required Commands

Run:

```bash
git diff --check
git diff --cached --check
```

For code implementation during Stop B, also run the targeted package tests and type checks identified by the Stop B task.

If documentation links or navigation are changed, also run:

```bash
pnpm docs:links
pnpm docs:navigation
```

---

## Return Format

Return:

1. Files changed
2. Functional scope implemented
3. Tests executed
4. Typecheck result
5. Documentation updated
6. Known limitations
7. Git status
8. Commit and push status

---

## Stop Condition

Do not proceed to Growth & Revenue, Command Center, publishing execution, or autonomous action execution.

Do not commit or push unless a separate Git release checkpoint task explicitly authorizes it.

---
