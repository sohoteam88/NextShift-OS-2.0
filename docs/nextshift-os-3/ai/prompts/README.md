# README.md

Version: v1.0
Status: Approved

# AI Prompt Library

## Purpose

This directory is the canonical entry point for the NextShift AI Prompt Library.

It provides the reusable prompt set that standardizes how AI assistants execute work across all NextShift projects while remaining aligned with:

- AI_BOOTSTRAP.md
- AI_CONTEXT_LOADING.md
- AI_EXECUTION_GUIDE.md
- PROJECT_STATUS.md
- STD-006 Project Execution Orchestration Standard

The Prompt Library does not replace these standards. It operationalizes them through reusable execution prompts.

---

# Prompt Catalog

| Prompt | Lifecycle | Purpose |
|---------|-----------|---------|
| AI_PROMPT_LIBRARY.md | Overview | Prompt catalog and workflow |
| AI_SESSION_STARTER.md | Session | Start an AI session |
| AI_BOOTSTRAP.md | Session | Load canonical project context |
| AI_CONTEXT_LOADING.md | Session | Detect repository state |
| AI_EXECUTION_GUIDE.md | All | Execution responsibilities |
| AI_PROMPT_LIBRARY_AUDIT_CONTRACT.md | Audit | Prompt library audit contract |
| AI_PROMPT_EVOLUTION_FRAMEWORK.md | Improvement | Continuous prompt improvement framework |
| AI_IMPLEMENTATION_PROMPT.md | Stop A | Implementation handoff |
| AI_VERIFICATION_PROMPT.md | Stop B | Requirements Verification |
| AI_AUDIT_PROMPT.md | Stop B | Repository Audit |
| AI_RELEASE_PROMPT.md | Stop C | Release preparation and release execution |

---

# Lifecycle Mapping

```text
Session
    ↓
AI_SESSION_STARTER
    ↓
AI_BOOTSTRAP
    ↓
AI_CONTEXT_LOADING
    ↓
AI_EXECUTION_GUIDE

Stop A
    ↓
AI_IMPLEMENTATION_PROMPT

Stop B
    ↓
AI_VERIFICATION_PROMPT
    ↓
AI_AUDIT_PROMPT

Stop C
    ↓
AI_RELEASE_PROMPT
```

---

# Repository-First Principles

All prompts follow these rules:

- Detect lifecycle state from repository artifacts.
- Continue from the current lifecycle phase.
- Never regenerate completed lifecycle artifacts.
- Respect Stop A → Stop B → Stop C.
- Perform Git validation before release.
- Commit and push only when explicitly instructed or when authorized by release governance.

---

# Related Standards

- AI_BOOTSTRAP.md
- AI_CONTEXT_LOADING.md
- AI_EXECUTION_GUIDE.md
- AI_PROMPT_EVOLUTION_FRAMEWORK.md
- PROJECT_STATUS.md
- MASTER_INDEX.md
- STD-006 Project Execution Orchestration Standard

---

# Maintenance

Any new prompt added to this directory should:

1. Be listed in AI_PROMPT_LIBRARY.md.
2. Be referenced from this README.
3. Follow the Repository-first execution model.
4. Pass AI Prompt Library Audit before release.
