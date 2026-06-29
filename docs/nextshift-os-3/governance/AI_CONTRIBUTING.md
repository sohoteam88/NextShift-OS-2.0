# AI Contributing

Version: 1.0

Status: Approved

## Purpose

This document defines how AI systems contribute to the NextShift OS repository.

It establishes the behavioral rules, architectural constraints, and decision boundaries that every AI contributor must follow.

This document applies to:

- Claude Code
- OpenAI Codex
- Cursor AI
- GitHub Copilot
- Internal NextShift AI Agents
- Any future AI development assistant

AI contributors are collaborators.

They are not architecture owners.

## Mission

The purpose of an AI contributor is to improve the implementation of NextShift without compromising its architecture.

AI should accelerate development.

It should never redefine the product.

## Required Reading Order

Before making any proposal, generating code, or modifying documentation, an AI contributor must understand the architecture in the following order:

1. [Governance](GOVERNANCE.md)
2. [Phase 0 Foundation](../phase-0-foundation/README.md)
3. [Phase 1 Constitution](../phase-1-constitution/README.md)
4. [Phase 2 Architecture](../phase-2-architecture/README.md)
5. [Relevant RFCs](../rfc/README.md)
6. [Relevant ADRs](../adr/README.md)
7. [Phase 3 Implementation](../phase-3-implementation/README.md)

Architecture always precedes implementation.

## Architecture Hierarchy

AI contributors must respect the architectural hierarchy.

```text
Vision
  -> Foundation
  -> Constitution
  -> Architecture
  -> Implementation
  -> Source Code
```

Lower layers must never redefine higher layers.

## Core Responsibilities

AI contributors should:

- Improve implementation quality.
- Preserve architectural consistency.
- Reduce unnecessary complexity.
- Reuse existing concepts.
- Strengthen the Business Twin.
- Improve recommendation quality.
- Keep documentation synchronized with implementation.

## Prohibited Actions

AI contributors must never:

- Invent new architectural concepts without approval.
- Introduce duplicate business models.
- Create independent sources of business truth.
- Bypass the AI Operating Loop.
- Change Business Twin responsibilities.
- Modify Constitution documents without an approved RFC.
- Prioritize implementation convenience over architectural integrity.

## Business Twin Rule

Every architectural proposal should answer:

How does this strengthen the Business Twin?

If the answer is unclear, the proposal should be reconsidered.

## AI Operating Loop Rule

Every new capability should support one or more stages of the AI Operating Loop:

- Observe
- Understand
- Recommend
- Discuss
- Decide
- Execute
- Measure
- Reflect
- Learn

Capabilities that bypass this cycle require explicit architectural justification.

## Recommendation Rule

AI should optimize for better business decisions.

Not more features.

When proposing improvements, AI should explain:

- Why this improves decision quality.
- What business outcome is expected.
- Which architectural principles are strengthened.

## Business Language

AI contributors must reuse existing terminology.

Use:

- Business Twin
- Capability
- Story
- Memory
- Knowledge
- Recommendation
- Opportunity
- Reflection

Avoid introducing alternative terms with equivalent meanings.

Shared language preserves architectural consistency.

## RFC Requirement

An RFC should be proposed before introducing changes that affect:

- Product philosophy
- AI reasoning
- Business Twin
- Knowledge model
- System architecture
- User interaction paradigm
- Core capabilities

Implementation details do not require RFCs.

## Documentation Rule

Every significant implementation should update the corresponding documentation.

Documentation and implementation should evolve together.

Neither should become outdated.

## Explainability

AI contributors should explain architectural reasoning.

Every major proposal should answer:

- Why?
- Why now?
- Why this approach?
- Why not the alternatives?
- What trade-offs exist?

Reasoning is as important as implementation.

## Success Criteria

An AI contribution is considered successful when it:

- Preserves architectural consistency.
- Improves business intelligence.
- Strengthens the Business Twin.
- Follows the AI Operating Loop.
- Improves maintainability.
- Reduces unnecessary complexity.
- Supports long-term evolution.

## Guiding Principle

AI contributes to the architecture.

It does not redefine it.

Every contribution should leave NextShift more coherent, more intelligent, and easier to evolve than before.
