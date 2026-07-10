# Conversation Engine Architecture

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Define guided conversation and AI-human collaboration.

Conversation Engine helps users clarify, discuss, brainstorm, challenge, approve, reject, and refine business direction before execution.

---

## Responsibilities

| Area | Responsibility |
| --- | --- |
| Discussion | Support business conversations around goals, strategy, and next actions |
| Brainstorming | Generate options while preserving business context |
| Clarification | Ask for missing or ambiguous context |
| Strategy Conversation | Help users evaluate direction and tradeoffs |
| Decision Discussion | Translate recommendations into understandable choices |
| Approval Flow | Capture approval, rejection, revision, or deferral |
| Execution Handoff | Pass approved intent to Creative Studio, Growth & Revenue, or workflows |

---

## Inputs

Conversation Engine reads:

- Business Brain context
- Decision Engine recommendations and explanations
- user prompts
- active workspace context
- prior conversation state

---

## Outputs

Conversation Engine produces:

- clarified intent
- user decisions
- approval records
- revision requests
- strategy notes
- execution-ready briefs

---

## Boundary

Conversation Engine discusses and clarifies.

It does not own durable business memory, calculate final priority, generate final publishing packages, or execute revenue workflows.
