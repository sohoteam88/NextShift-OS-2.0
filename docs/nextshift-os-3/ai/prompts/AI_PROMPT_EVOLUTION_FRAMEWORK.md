# AI Prompt Evolution Framework

Version: v1.0
Status: Planning

## Purpose

Define the continuous improvement framework for the NextShift AI Prompt Library.

Instead of treating prompt updates as ad hoc fixes, this framework captures recurring engineering patterns from implementation, verification, audit, and release activities, then feeds those lessons back into the prompt library.

---

## Vision

Every completed project should improve the AI engineering framework.

```text
Implementation
      ↓
Verification
      ↓
Repository Audit
      ↓
Recurring Pattern
      ↓
Prompt Enhancement
      ↓
Prompt Library Update
      ↓
Future Projects Benefit
```

---

## Scope

Applies to:

- AI_IMPLEMENTATION_PROMPT.md
- AI_VERIFICATION_PROMPT.md
- AI_AUDIT_PROMPT.md
- AI_RELEASE_PROMPT.md
- AI_BOOTSTRAP.md
- AI_CONTEXT_LOADING.md

---

## Trigger Conditions

Create a Prompt Enhancement proposal when:

- The same audit finding appears in two or more capabilities.
- Engineers repeatedly perform the same manual correction.
- Repository-first execution can be strengthened.
- Lifecycle orchestration can be simplified.
- Navigation, validation, or release tasks become repetitive.

---

## Prompt Evolution Workflow

1. Detect recurring pattern.
2. Confirm recurrence across multiple capabilities.
3. Create `AI_PROMPT_ENHANCEMENT_*.md`.
4. Review against AI Engineering Foundation and STD-006.
5. Update the affected prompt(s).
6. Validate on subsequent capabilities.
7. Record the improvement in the AI Prompt Library changelog.

---

## Governance Rules

- Never weaken Repository-first execution.
- Never bypass lifecycle gates.
- Preserve compatibility with:
  - STD-004 Release Governance
  - STD-005 GitHub Alignment
  - STD-006 Project Execution Orchestration
  - STD-007 Repository Canonical Resolution
- Improvements must be evidence-based, not speculative.

---

## Success Criteria

The framework is successful when:

- Repeated audit findings steadily decrease.
- Prompt quality improves over time.
- Future capabilities require fewer manual corrections.
- AI assistants converge on consistent engineering behavior using the same repository state.
