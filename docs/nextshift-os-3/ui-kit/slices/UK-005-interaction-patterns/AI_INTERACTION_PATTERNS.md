# NextShift UI Kit v1.0

# UK-005 AI Interaction Patterns

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-005 Interaction Patterns  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-005 Planning, UK-001 AI Design Language, UK-002 Human And AI Collaboration, UK-003 AI Components, UK-004 AI Information Hierarchy  
**Outputs:** AI interaction pattern guidance for Workspace-aware interfaces  
**Exit Criteria:** AI interactions define recommendation, reasoning, confidence, control, and recovery expectations without AI runtime implementation

## Purpose

This document defines how AI-assisted interactions should appear and behave in NextShift Workspace interfaces at the UI Kit level.

AI interactions help members understand, decide, draft, rank, summarize, and act. They do not define model behavior, prompt engineering internals, API calls, data pipelines, persistence, or runtime orchestration.

## AI Interaction Principles

| Principle | Rule |
| --- | --- |
| Human control | Members decide whether to accept, adjust, dismiss, or inspect AI output. |
| Explainability | AI output should include reason and confidence or uncertainty. |
| Workspace scope | AI output should clearly belong to the active Workspace and view context. |
| Decision support | AI should help the member decide and act, not add decorative content. |
| Recoverability | Failed or low-confidence AI states should provide retry, revise, or dismiss paths. |
| Audit friendliness | Material AI output should preserve enough context for review where needed. |

## Standard AI Recommendation Pattern

Use when AI recommends an operational action.

Structure:

1. Recommendation: what AI suggests.
2. Reasoning summary: why the recommendation matters.
3. Confidence or uncertainty: how reliable the recommendation appears.
4. Evidence or source detail: what supports the recommendation, where appropriate.
5. Member actions: accept, adjust, dismiss, regenerate, or inspect.
6. Result state: accepted, adjusted, dismissed, pending, or failed.

Guidance:

- Show the recommendation before long reasoning.
- Keep reasoning concise by default.
- Use disclosure for detailed audit or source information.
- Avoid presenting AI output as final unless the member has accepted it.

## AI Draft Pattern

Use when AI generates text, summaries, messages, plans, or structured drafts.

Guidance:

- Label the output as a draft until accepted.
- Provide edit or adjust action.
- Provide regenerate only when useful and safe.
- Show what context the draft used when material.
- Keep final submission under member control.

## AI Ranking Pattern

Use when AI prioritizes leads, tasks, candidates, actions, risks, or recommendations.

Guidance:

- Show ranking reason, not only order.
- Include confidence or uncertainty where material.
- Allow members to inspect supporting evidence.
- Do not hide critical unranked items unless filters are explicit.
- Preserve manual override.

## AI Insight Pattern

Use when AI identifies a trend, anomaly, risk, opportunity, or summary.

Guidance:

- State the insight in plain language.
- Show why it matters to the current Workspace or view.
- Pair with next action when one exists.
- Distinguish insight from warning or required task.

## AI Assistant Pattern

Use when a member asks AI for help inside a Workspace surface.

Guidance:

- Keep the assistant scoped to the active Workspace context.
- Show whether the assistant is answering, searching, drafting, or analyzing.
- Provide source or context hints when the answer affects business action.
- Do not let assistant responses bypass required confirmations for material actions.

## AI Working and Error States

AI interactions should define:

- Idle state
- Working state
- Empty or no-result state
- Low-confidence state
- Error state with retry or recovery
- Accepted state
- Dismissed state

The AI happy path alone is incomplete.

## Confidence and Uncertainty

Confidence should help the member judge the output.

Guidance:

- Use plain-language confidence labels.
- Explain uncertainty when it affects the decision.
- Do not imply precision that the interface cannot support.
- Let low-confidence output be dismissed, revised, or inspected.

## Human Override

Members must be able to:

- Ignore or dismiss AI output.
- Edit AI-generated drafts before use.
- Choose a different action than AI recommends.
- Inspect reasoning or evidence where material.
- Recover when AI fails or produces no useful result.

## Workspace-Aware AI Rules

- AI output should indicate the Workspace context when consequence is Workspace-scoped.
- Retail and Recruitment AI guidance should use shared interaction patterns with Workspace-specific content.
- AI actions should not silently cross Workspace boundaries.
- Workspace metadata may shape AI labels, recommended actions, and evidence, but not the interaction model.

## Relationship To Components

AI interactions may appear through UK-003 components such as:

- AI Recommendation Panel
- AI Insight Card
- Reasoning Summary
- Confidence Indicator
- Action groups

UK-005 defines how these components are used in interaction patterns. It does not redefine the components.

## Non-Goals

- No model selection.
- No prompt implementation.
- No AI orchestration.
- No API contract.
- No memory, training, or retrieval architecture.
- No runtime permissions or automation rules.

## Status

Implemented.
