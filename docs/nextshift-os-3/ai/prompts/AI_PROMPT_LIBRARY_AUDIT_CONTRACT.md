# AI_PROMPT_LIBRARY_AUDIT_CONTRACT.md

Version: v1.0
Status: Approved

# Purpose

Define the standard audit process for the NextShift AI Prompt Library.

This audit validates that the prompt library remains aligned with AI Bootstrap, AI Context Loading, AI Execution Guide, and STD-006 Project Execution Orchestration Standard.

---

# Audit Scope

Audit the following directory:

```text
docs/nextshift-os-3/ai/prompts/
```

Required files:

- AI_PROMPT_LIBRARY.md
- AI_SESSION_STARTER.md
- AI_BOOTSTRAP.md
- AI_CONTEXT_LOADING.md
- AI_EXECUTION_GUIDE.md
- AI_IMPLEMENTATION_PROMPT.md
- AI_VERIFICATION_PROMPT.md
- AI_AUDIT_PROMPT.md
- AI_RELEASE_PROMPT.md

---

# Audit Checklist

## 1. File Completeness

Verify every required prompt exists.

Result:

- PASS
- FAIL

---

## 2. Bootstrap Alignment

Verify prompts follow:

AI_SESSION_STARTER
→ AI_BOOTSTRAP
→ AI_CONTEXT_LOADING
→ AI_EXECUTION_GUIDE

No lifecycle prompt may bypass Bootstrap.

---

## 3. Lifecycle Alignment

Verify:

Stop A
- AI_IMPLEMENTATION_PROMPT

Stop B
- AI_VERIFICATION_PROMPT
- AI_AUDIT_PROMPT

Stop C
- AI_RELEASE_PROMPT

No skipped or duplicated lifecycle stages.

---

## 4. Prompt Scope

Implementation Prompt:
- Must not verify, audit, release, commit, or push.

Verification Prompt:
- Must not implement or release.

Audit Prompt:
- Must not modify implementation.

Release Prompt:
- Must not regenerate planning or implementation artifacts.

---

## 5. Repository-first Rules

Verify every lifecycle prompt requires:

- Repository artifact detection
- Continue-from-current-phase
- No regeneration of completed artifacts
- Repository-first execution

---

## 6. Git Validation

Implementation:

- pwd
- git rev-parse --show-toplevel
- git remote -v
- git branch --show-current
- git status

Verification:

- git diff --check
- git diff --cached --check

Release:

- git add
- git commit
- git push (only when authorized)

---

## 7. Reference Compliance

Verify prompts reference:

- AI_BOOTSTRAP.md
- PROJECT_STATUS.md
- MASTER_INDEX.md
- STD-006

Avoid duplicating standards.

---

## 8. Documentation Quality

Verify:

- Internal links
- Relative links
- Markdown formatting
- Consistent metadata
- No conflict markers
- No trailing whitespace

---

# Validation Commands

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git status
git diff --check
git diff --cached --check
```

---

# Audit Output

Produce:

- Audit Result (PASS / FAIL / CONDITIONAL PASS)
- Files Reviewed
- Missing Files
- Lifecycle Alignment
- Bootstrap Alignment
- Scope Compliance
- Git Validation
- Documentation Quality
- Issues Found
- Required Corrections
- Final Recommendation

---

# Release Gate

The AI Prompt Library is approved only if:

- All required prompts exist.
- Lifecycle alignment matches STD-006.
- Bootstrap flow is correct.
- Repository-first rules are followed.
- Git validation passes.
- No duplicated standards or scope violations exist.
