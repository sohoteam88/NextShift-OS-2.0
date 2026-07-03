# AI_PROMPT_LIBRARY.md

Version: v1.0
Status: Approved

# Purpose

This document defines the standard AI prompt library for all NextShift projects.

Every AI assistant (Codex, Claude Code, ChatGPT, or future agents) should use these prompts together with AI_BOOTSTRAP.md and STD-006 Project Execution Orchestration Standard.

---

# Prompt Library

| Prompt | Lifecycle | Purpose |
|--------|-----------|---------|
| AI_SESSION_STARTER.md | Session | Start a new AI session |
| AI_BOOTSTRAP.md | Session | Load canonical project context |
| AI_CONTEXT_LOADING.md | Session | Detect repository state |
| AI_EXECUTION_GUIDE.md | All | Define execution responsibilities |
| AI_IMPLEMENTATION_PROMPT.md | Stop A | Implementation handoff |
| AI_VERIFICATION_PROMPT.md | Stop B | Requirements Verification |
| AI_AUDIT_PROMPT.md | Stop B | Repository Audit |
| AI_RELEASE_PROMPT.md | Stop C | Release preparation and release execution |

---

# Standard Workflow

```text
AI Session Starter
        ↓
AI Bootstrap
        ↓
Context Loading
        ↓
Execution Guide
        ↓
Implementation Prompt
        ↓
Verification Prompt
        ↓
Audit Prompt
        ↓
Release Prompt
```

---

# Repository Rules

- Always detect lifecycle state from repository artifacts.
- Never regenerate completed lifecycle artifacts.
- Continue only from the next required phase defined by STD-006.
- Follow Stop A → Stop B → Stop C.
- Perform Git validation before release.
- Commit and push only when explicitly instructed or when the release workflow authorizes it.

---

# Repository Location

Recommended location:

```text
docs/nextshift-os-3/ai/prompts/
├── AI_PROMPT_LIBRARY.md
├── AI_SESSION_STARTER.md
├── AI_BOOTSTRAP.md
├── AI_CONTEXT_LOADING.md
├── AI_EXECUTION_GUIDE.md
├── AI_IMPLEMENTATION_PROMPT.md
├── AI_VERIFICATION_PROMPT.md
├── AI_AUDIT_PROMPT.md
└── AI_RELEASE_PROMPT.md
```

---

# Usage

Implementation:

```text
Execute AI_IMPLEMENTATION_PROMPT.md

Capability:
BOS-003 AI Workflow
```

Verification:

```text
Execute AI_VERIFICATION_PROMPT.md

Capability:
BOS-003 AI Workflow
```

Audit:

```text
Execute AI_AUDIT_PROMPT.md

Capability:
BOS-003 AI Workflow
```

Release:

```text
Execute AI_RELEASE_PROMPT.md

Capability:
BOS-003 AI Workflow
```
