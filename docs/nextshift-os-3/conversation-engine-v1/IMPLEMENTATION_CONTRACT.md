# Conversation Engine v1.0 Implementation Contract

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-08

---

## Objective

Implement Conversation Engine v1.0 as the first collaborative business discussion layer built on released Business Foundation v1.0, Business Brain v1.0, and Decision Engine v1.0.

The implementation must create the domain, application, contract, and test surface needed to transform AI recommendations into collaborative business conversations.

---

## Required Implementation Scope

Implement only Conversation Engine v1.0.

Expected documentation area:

```text
docs/nextshift-os-3/conversation-engine-v1/
```

Expected implementation areas must be selected according to existing repository architecture during Stop B and may include:

```text
packages/domain/src/conversation-engine-v1/
packages/application/src/conversation-engine-v1/
packages/contracts/src/conversation-engine-v1/
```

Only modify files required by the approved Stop B task.

---

## Functional Requirements

### 1. AI Strategy Chat

Define the strategy chat behavior that turns upstream context and recommendations into guided strategic conversation.

The implementation must cover:

- upstream context consumption
- strategy prompts
- recommendation-aware discussion
- tradeoff framing
- no final content generation
- no action execution

### 2. Business Discussion Model

Define business discussion records.

The implementation must cover:

- conversation ID
- business ID
- thread or session identity
- participants
- turns or messages
- discussion topic
- evidence references
- discussion outcome

### 3. Conversation Context

Define how conversation context is resolved.

The implementation must cover:

- Business Foundation references
- Business Brain references
- Decision Engine references
- active recommendation context
- prior conversation references
- workspace context references where available

### 4. Recommendation Discussion

Define how Decision Engine recommendations are discussed.

The implementation must cover:

- recommendation ID
- recommendation title and action reference
- priority and confidence context
- explanation and evidence references
- user questions
- discussion notes
- decision intent

### 5. Clarification Workflow

Define how missing or ambiguous context is clarified.

The implementation must cover:

- clarification question
- source gap or uncertainty reference
- user response
- resolution state
- follow-up requirement

### 6. Brainstorm Workflow

Define brainstorming support around current business context.

The implementation must cover:

- brainstorm prompt
- generated option records
- rationale
- constraints
- evidence references
- selected or discarded options
- no final content or asset generation

### 7. Follow-up Conversation

Define follow-up conversation behavior.

The implementation must cover:

- parent conversation reference
- follow-up reason
- continuity context
- unresolved questions
- follow-up lifecycle state

### 8. Conversation Memory Integration

Define how conversations reference prior memory.

The implementation must cover:

- memory reference identifiers
- conversation summary reference
- relevant prior decisions
- no durable Business Foundation memory ownership
- no Business Brain ownership changes

### 9. Human Approval Conversation

Define human approval conversation outcomes.

The implementation must cover:

- approval question
- approved, rejected, revise, or deferred outcome
- rationale
- timestamp
- user or actor reference
- execution handoff intent without executing actions

### 10. Conversation Lifecycle

Define lifecycle state for Conversation Engine outputs.

The implementation must cover:

- opened
- in_progress
- awaiting_clarification
- awaiting_approval
- approved
- rejected
- deferred
- resolved
- archived
- timestamps and transition rules

---

## Upstream Consumption Rules

Conversation Engine consumes but does not own:

- Business Foundation facts and durable context
- Business Brain understanding, insights, assessment, situation analysis, and interpretation
- Decision Engine recommendations, scores, explanations, opportunities, gaps, health, coach guidance, and lifecycle

Conversation Engine implementation must not create duplicate ownership models for Business Foundation facts, Business Brain intelligence outputs, or Decision Engine recommendation outputs.

---

## Architecture Requirements

Conversation Engine v1.0 must follow existing repository architecture.

The implementation must:

- preserve current package boundaries
- follow existing domain-driven design patterns
- avoid unrelated refactors
- expose contracts through existing contract index patterns
- add targeted domain and application tests
- keep upstream evidence references explicit
- keep outputs deterministic and serializable
- avoid runtime, deployment, UI, and database changes unless explicitly authorized by Stop B

---

## Boundary Rules

Conversation Engine v1.0 must not implement:

- Creative Studio
- Growth & Revenue
- Command Center
- content generation
- final asset generation
- campaign execution
- revenue workflow execution
- autonomous action execution
- publishing
- external integrations
- database migrations
- UI screens
- deployment behavior

Conversation Engine v1.0 may create conversation outputs and approval intent consumed by those layers later.

---

## Validation Requirements

Run and report at minimum:

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

## Documentation Requirements

Stop B implementation must produce or update:

- `docs/nextshift-os-3/conversation-engine-v1/README.md`
- `docs/nextshift-os-3/conversation-engine-v1/IMPLEMENTATION_REPORT.md`

Navigation updates must be scoped to required Conversation Engine references only.

---

## Stop Condition

Stop after Conversation Engine v1.0 implementation and validation.

Do not proceed to Creative Studio, Growth & Revenue, Command Center, content generation, or action execution.

Do not commit or push unless a separate Git release checkpoint task explicitly authorizes it.
