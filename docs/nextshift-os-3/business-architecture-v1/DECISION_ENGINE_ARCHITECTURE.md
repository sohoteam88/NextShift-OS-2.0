# Decision Engine Architecture

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Define how NextShift determines what should happen next.

Decision Engine turns Business Brain understanding into recommendations, priorities, gap detection, confidence, explanation, and coaching.

---

## Responsibilities

| Area | Responsibility |
| --- | --- |
| Recommendation | Propose next actions based on business context and goals |
| Priority | Rank work by urgency, value, confidence, and dependency |
| Gap Detection | Identify missing business context, assets, channels, or execution steps |
| Opportunity | Identify valuable market, customer, offer, content, or revenue opportunities |
| Risk | Identify business, execution, brand, or revenue risk |
| Confidence | Explain certainty and evidence quality |
| Explanation | Present why a recommendation matters |
| Coaching | Help users understand choices and tradeoffs |

---

## Inputs

Decision Engine reads:

- Business Brain insight
- Business Foundation goals and operating priorities
- workflow and revenue signals
- historical performance
- user constraints and preferences

---

## Outputs

Decision Engine produces:

- recommendations
- priorities
- detected gaps
- opportunity assessments
- risk assessments
- confidence scores or confidence explanations
- coaching prompts
- proposed actions for Conversation Engine or execution workflows

---

## Boundary

Decision Engine recommends and explains.

It does not conduct long-form discussion, create assets, execute revenue workflows, or mutate Business Foundation state directly.
