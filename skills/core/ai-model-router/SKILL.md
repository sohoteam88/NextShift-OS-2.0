---
name: ai-model-router
description: Provide AI model routing policy for NextShift OS Claude Code, Codex, and AI Coworker tasks based on task type, complexity, risk, context size, reasoning depth, code needs, budget sensitivity, and speed priority.
---

# AI Model Router v2.0

## Purpose

为 NextShift OS 的 Claude Code / Codex / AI Coworker 提供模型选择与平台路由策略。避免简单任务浪费高级模型，也避免复杂任务使用低能力模型导致架构错误。同时决定任务应在哪个执行平台运行，以及是否可以拆分为并行子任务。

This skill does not write production code. It decides:
1. Which AI model tier should handle a task.
2. Which execution platform should run it.
3. Whether the task can be decomposed for parallel execution across tiers.
4. A confidence score for the routing decision.

## When to Use

Use this skill when a task involves:

- 系统架构 / System Architecture
- 数据库设计 / Database Design
- SaaS 权限 / Permissions
- 多租户 / Multi-Tenant
- AI Agent 编排 / AI Agent Orchestration
- 代码生成 / Code Generation
- Bug 修复 / Bug Fixing
- UI/UX 设计 / UI/UX Design
- 文案生成 / Copywriting
- 翻译 / Translation
- 内容改写 / Content Rewriting
- 大文件分析 / Large File Analysis
- 安全审查 / Security Review
- 部署排查 / Deployment Troubleshooting
- 批量任务 / Batch Processing
- 多步骤工作流 / Multi-step Workflows

---

## Routing Criteria

Evaluate every task using these dimensions:

| Dimension | Values |
|---|---|
| Task Type | Architecture / Code / Copy / UX / Data / Security / DevOps / Batch |
| Complexity | Low / Medium / High / Critical |
| Risk Level | Low / Medium / High / Critical |
| Context Size | Small (<4K tokens) / Medium (4-32K) / Large (32-128K) / Huge (>128K) |
| Required Reasoning | Basic / Advanced / Deep / Extended Thinking |
| Output Type | Code / Architecture / Copy / UX / Data / Security / Config / Mixed |
| Cost Sensitivity | Low / Medium / High |
| Speed Priority | Low / Medium / High / Real-time |
| Interactivity | None / Low / High (needs human-in-loop) |

---

## Platform Routing

Before selecting a model tier, determine which execution platform fits the task.

### Claude Code (Interactive CLI)

Best for:
- Tasks requiring real-time human feedback loops
- File editing, refactoring, debugging with context
- Tasks touching many files in a single repo
- Architecture review requiring back-and-forth clarification

Constraints:
- Single session, single repo context
- Human must be present
- Best for tasks < 30 minutes

### Codex (Async Batch Agent)

Best for:
- Well-defined tasks with clear acceptance criteria
- Tasks that can run unattended (CI-like)
- Bulk operations across many files
- Tasks where latency tolerance is high (minutes to hours OK)
- Parallel execution of independent subtasks

Constraints:
- No real-time human interaction
- Must have clear success criteria upfront
- Sandboxed environment

### AI Coworker (Cowork Mode)

Best for:
- Non-developer users
- Document generation, research, presentations
- Tasks involving browser automation or external tools
- Multi-tool orchestration (MCP connectors, file creation, web)
- Tasks requiring visual output or rich formatting

Constraints:
- Desktop app context
- Optimized for knowledge work, not heavy code generation
- Best for tasks under 1 hour

### Platform Decision Matrix

| Signal | Platform |
|---|---|
| Needs iterative code discussion | Claude Code |
| Clear spec, can run unattended | Codex |
| Non-code deliverable (doc, deck, research) | Coworker |
| Touches >20 files mechanically | Codex |
| Needs MCP connectors (Slack, Canva, etc.) | Coworker |
| Real-time debugging | Claude Code |
| Batch translation / formatting | Codex |
| Security review with human sign-off | Claude Code |

---

## Model Tiering

Do not bind routing to a single vendor. Choose by model capability class.

### Tier S — Deep Reasoning / Architecture

Use for:
- System Architecture design
- Database Architecture (core tables, tenancy, auth, billing)
- Multi-Tenant SaaS Design
- Security Design and Audit
- AI Agent Orchestration design
- Complex cross-module Refactoring
- Production Incident Root Cause Analysis
- Compliance / Legal-sensitive logic

Recommended models (2025-2026):

| Vendor | Model | Strengths |
|---|---|---|
| Anthropic | `claude-opus-4-6` | Deep reasoning, extended thinking, architecture |
| OpenAI | `o3` / `o4-mini` (high reasoning) | Chain-of-thought, math-heavy logic |
| Google | `gemini-2.5-pro` | Large context (1M+), multimodal reasoning |

Approximate profile: ~$15-75/M input tokens, 30-120s response, highest accuracy.

### Tier A — Advanced Coding / Product Logic

Use for:
- Feature Implementation (full modules)
- API Design and implementation
- Frontend Dashboard development
- Backend business logic
- CRM Workflow automation
- Funnel Builder logic
- Role/Permission implementation
- Integration work (third-party APIs)
- Complex test strategies

Recommended models (2025-2026):

| Vendor | Model | Strengths |
|---|---|---|
| Anthropic | `claude-sonnet-4-6` | Fast coding, strong instruction following |
| OpenAI | `gpt-4.1` / `o4-mini` (standard) | Reliable code generation, tool use |
| Google | `gemini-2.5-flash` (thinking) | Fast, cost-efficient with reasoning |

Approximate profile: ~$3-12/M input tokens, 5-30s response, high accuracy.

### Tier B — Standard Execution

Use for:
- UI Component creation (from spec)
- Simple CRUD operations
- Copy updates and editing
- Form validation logic
- Small bug fixes (isolated, clear cause)
- Translation (customer-facing, nuanced)
- Styling adjustments
- Standard unit tests

Recommended models (2025-2026):

| Vendor | Model | Strengths |
|---|---|---|
| Anthropic | `claude-haiku-4-5` | Ultra-fast, very cost-effective |
| OpenAI | `gpt-4.1-mini` | Good balance of speed and capability |
| Google | `gemini-2.5-flash` (no thinking) | Fastest in class |

Approximate profile: ~$0.25-1/M input tokens, 1-5s response, good accuracy.

### Tier C — Fast Utility

Use for:
- Formatting and linting
- Renaming and reorganizing
- Simple Markdown cleanup
- JSON/YAML restructuring
- Minor text rewrites
- Simple classification/tagging
- Template expansion

Recommended models (2025-2026):

| Vendor | Model | Strengths |
|---|---|---|
| Anthropic | `claude-haiku-4-5` (low temp) | Cheapest Anthropic option |
| OpenAI | `gpt-4.1-nano` | Minimal cost |
| Google | `gemini-2.5-flash` (no thinking) | Sub-second responses |

Approximate profile: ~$0.05-0.25/M input tokens, <1s response, adequate accuracy.

---

## Parallel Task Decomposition

Complex tasks can often be split across tiers for faster, cheaper execution.

### When to Decompose

- Task has independent subtasks (no data dependency between them)
- Mix of complexity levels within one request
- Time-sensitive delivery with budget flexibility
- Large scope that would exceed single-model context limits

### Decomposition Pattern

```
PARENT TASK → [Tier S: Architecture/Design]
                ↓ outputs spec
              [Tier A: Implementation] + [Tier A: Tests] ← parallel
                ↓ outputs code
              [Tier B: Docs] + [Tier B: i18n] + [Tier C: Formatting] ← parallel
```

### Rules

- Tier S always runs first if architecture decisions are needed.
- Implementation subtasks at Tier A can run in parallel if they touch different modules.
- Tier B/C tasks (docs, translation, formatting) always run last and always in parallel.
- Each subtask must have its own clear input/output contract.
- If a subtask fails, only escalate that subtask — don't re-run the entire pipeline.

---

## Confidence Scoring

Every routing decision includes a confidence level:

| Confidence | Meaning | Action |
|---|---|---|
| **High** (>85%) | Clear match to routing criteria | Execute immediately |
| **Medium** (60-85%) | Some ambiguity in scope or risk | Execute but flag for review |
| **Low** (<60%) | Unclear scope, mixed signals | Generate clarification questions before executing |

Factors that reduce confidence:
- Task scope is vague or ambiguous
- Multiple tiers could reasonably handle it
- Risk assessment depends on implementation details not yet known
- Task crosses multiple domains (e.g., security + UX + data)

---

## Routing Matrix

| Task | Complexity | Risk | Tier | Platform | Notes |
|---|---|---|---|---|---|
| Create system architecture | Critical | Critical | S | Claude Code | Read architecture docs first; preserve module boundaries. |
| Design database schema | High/Critical | High/Critical | S | Claude Code | Core tables, tenancy, auth, billing require Tier S. |
| Implement CRM lead table | Medium/High | Medium/High | A | Codex | Use Tier S if changing core schema or tenant isolation. |
| Create landing page copy | Low/Medium | Low | B | Coworker | Escalate to A if tied to regulated claims. |
| Translate zh/en/ms | Low | Low | B/C | Codex | Batch via Codex; use B for customer-facing nuance. |
| Generate WhatsApp script | Low/Medium | Low/Medium | B | Coworker | Use A if automating sequences with sensitive data. |
| Debug production auth issue | Critical | Critical | S | Claude Code | Auth + tenant leakage = always Tier S + human. |
| Add new dashboard card | Low/Medium | Low/Medium | B | Codex | Use A if card depends on API/security logic. |
| Build admin approval workflow | High | High | A/S | Claude Code | Use S if workflow changes permissions or audit logs. |
| Create AI lead scoring logic | High | High | A/S | Claude Code | Use S for model policy, fairness, privacy. |
| Refactor API structure | High | High | A/S | Claude Code | Use S for cross-module or breaking changes. |
| Review security rules | Critical | Critical | S | Claude Code | Never use low-tier for security/auth/permissions. |
| Write unit tests | Low/Medium | Low/Medium | B | Codex | Use A for integration/auth/multi-tenant test strategy. |
| Create onboarding UX flow | Medium | Medium | A | Coworker | Use B for small copy updates after design is done. |
| Bulk file renaming/formatting | Low | Low | C | Codex | Pure mechanical; fastest model, batch execution. |
| Generate slide deck | Medium | Low | A | Coworker | Coworker has pptx skill; use A for strategic content. |
| Research competitor features | Medium | Low | A | Coworker | Coworker has web search + document creation. |

---

## Escalation Rules

1. 如果任务影响数据库 schema，至少使用 Tier A；如果是核心表结构，使用 Tier S。
2. 如果任务影响 auth、billing、permissions、multi-tenant，使用 Tier S。
3. 如果任务会影响 production deployment，至少使用 Tier A；严重故障使用 Tier S。
4. 如果任务只是文案、翻译、格式化，使用 Tier B 或 C。
5. 如果低级模型失败两次，自动升级一级（Auto-Escalation Protocol）。
6. 如果模型输出与 architecture 文件冲突，必须停止并读取 architecture 文件。
7. 如果 task scope 不清楚，不要乱做，先生成 clarification note 或 assumption list。
8. 如果涉及用户数据、安全、权限，不能使用低阶模型。
9. If confidence < 60%, do NOT execute. Produce clarification questions first.
10. If a Codex task requires >3 rounds of human clarification, reroute to Claude Code.

## Downgrade Rules

1. 重复性格式化任务降级到 Tier C。
2. 已有明确架构的组件开发可使用 Tier B。
3. 普通 UI 微调可使用 Tier B/C。
4. 翻译和语言润色可使用 Tier B/C。
5. 已通过高级模型设计的任务，后续执行可降级给 Tier A/B。
6. If Tier S produced a clear spec, implementation drops to Tier A.
7. If Tier A produced working code, docs/tests drop to Tier B.
8. Monitoring and alerting setup (when following existing patterns) → Tier B.

---

## Architecture Files To Consider

Read the relevant file before making a routing recommendation when the task touches system design, data, security, deployment, AI, CRM, funnels, analytics, UI/UX, i18n, or AI coworker behavior:

- `docs/architecture/00_SYSTEM_OVERVIEW.md`
- `docs/architecture/04_MODULE_ARCHITECTURE.md`
- `docs/architecture/07_DATABASE_ARCHITECTURE.md`
- `docs/architecture/08_API_ARCHITECTURE.md`
- `docs/architecture/09_AI_ARCHITECTURE.md`
- `docs/architecture/10_CRM_ARCHITECTURE.md`
- `docs/architecture/11_FUNNEL_ARCHITECTURE.md`
- `docs/architecture/13_ANALYTICS_ARCHITECTURE.md`
- `docs/architecture/14_UI_UX_ARCHITECTURE.md`
- `docs/architecture/15_I18N_ARCHITECTURE.md`
- `docs/architecture/17_SECURITY_ARCHITECTURE.md`
- `docs/architecture/18_DEPLOYMENT_ARCHITECTURE.md`
- `docs/architecture/21_AI_COWORKER_RULES.md`

---

## Required Output Format

Every model routing decision must use this format:

```text
MODEL ROUTING DECISION

Task:
Complexity:
Risk:
Context Size:
Confidence: [High/Medium/Low] ([percentage]%)
Recommended Tier:
Recommended Model: [vendor] [model-string]
Platform: [Claude Code / Codex / Coworker]
Decomposable: [Yes/No]
  └─ Subtasks: (if Yes)
     - [Subtask 1] → Tier [X] on [Platform]
     - [Subtask 2] → Tier [X] on [Platform]
Reason:
Architecture Files To Read:
Fallback: [Next tier up + trigger condition]
Estimated Cost: [Low/Medium/High] (~$X per run)
Estimated Latency: [Xs - Ys]
```

---

## Decision Workflow

1. Classify the task type and output type.
2. Determine the execution platform (Claude Code / Codex / Coworker).
3. Estimate complexity, risk, context size, and required reasoning.
4. Calculate confidence score.
5. If confidence < 60%, stop and produce clarification questions.
6. Check if the task is decomposable into parallel subtasks.
7. Apply escalation rules first.
8. Apply downgrade rules only if no escalation rule is triggered.
9. Select the recommended tier, specific model, and platform.
10. List architecture files that must be read before execution.
11. Provide a fallback tier with trigger condition.
12. Estimate cost and latency.

---

## Auto-Escalation Protocol

When a model fails or produces subpar output:

```
Attempt 1: Selected tier → evaluate output quality
  ↓ (if output fails quality check or produces errors)
Attempt 2: Same tier, different prompt strategy
  ↓ (if still fails)
Attempt 3: Escalate one tier up + flag for human review
  ↓ (if Tier S fails)
STOP: Produce incident report + request human architect intervention
```

Quality check criteria:
- Code compiles / passes linting
- Output doesn't contradict architecture files
- No security anti-patterns introduced
- Meets the original task acceptance criteria
