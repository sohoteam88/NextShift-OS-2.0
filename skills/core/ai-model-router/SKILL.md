---
name: ai-model-router
description: Provide AI model routing policy for NextShift OS Claude Code, Codex, and AI Coworker tasks based on task type, complexity, risk, context size, reasoning depth, code needs, budget sensitivity, and speed priority.
---

# AI Model Router

## Purpose

为 NextShift OS 的 Claude Code / Codex / AI Coworker 提供模型选择策略，避免简单任务浪费高级模型，也避免复杂任务使用低能力模型导致架构错误。

This skill does not write production code. It decides which AI model tier or AI agent should handle a task.

## When to Use

Use this skill when a task involves:

- 系统架构
- 数据库设计
- SaaS 权限
- 多租户
- AI Agent 编排
- 代码生成
- Bug 修复
- UI/UX 设计
- 文案生成
- 翻译
- 内容改写
- 大文件分析
- 安全审查
- 部署排查

## Routing Criteria

Evaluate every task using these dimensions:

- Task Type
- Complexity: Low / Medium / High / Critical
- Risk Level: Low / Medium / High / Critical
- Context Size: Small / Medium / Large / Huge
- Required Reasoning: Basic / Advanced / Deep
- Output Type: Code / Architecture / Copy / UX / Data / Security
- Cost Sensitivity: Low / Medium / High
- Speed Priority: Low / Medium / High

## Model Tiering

Do not bind routing to a single vendor. Choose by model capability class.

### Tier S - Deep Reasoning / Architecture

Use for:

- System Architecture
- Database Architecture
- Multi-Tenant SaaS Design
- Security Design
- AI Agent Orchestration
- Complex Refactor
- Production Incident Analysis

Recommended model types:

- Claude Opus 类
- GPT Thinking 类
- Gemini Pro Deep Reasoning 类

### Tier A - Advanced Coding / Product Logic

Use for:

- Feature Implementation
- API Design
- Frontend Dashboard
- Backend Logic
- CRM Workflow
- Funnel Builder
- Role Permission
- Integration Work

Recommended model types:

- Claude Sonnet 类
- GPT high-intelligence coding 类
- Gemini Pro 类

### Tier B - Standard Execution

Use for:

- UI Component
- Simple CRUD
- Copy Update
- Form Validation
- Small Bug Fix
- Translation
- Styling Adjustment

Recommended model types:

- GPT mini 类
- Claude Haiku 类
- Gemini Flash 类

### Tier C - Fast Utility

Use for:

- Formatting
- Renaming
- Simple Markdown
- JSON Cleanup
- Minor Text Rewrite
- Simple Classification

Recommended model types:

- Small / Fast / Low-cost model

## Routing Matrix

| Task | Complexity | Risk | Recommended Tier | Notes |
|---|---|---|---|---|
| Create system architecture | Critical | Critical | Tier S | Read architecture docs first; preserve module boundaries. |
| Design database schema | High / Critical | High / Critical | Tier S | Core tables, tenancy, auth, billing, or permissions require Tier S. |
| Implement CRM lead table | Medium / High | Medium / High | Tier A | Use Tier S if changing core CRM schema or tenant isolation. |
| Create landing page copy | Low / Medium | Low | Tier B | Escalate to Tier A if tied to regulated claims or major offer strategy. |
| Translate zh/en/ms | Low | Low | Tier B / C | Use Tier B for customer-facing nuance; Tier C for literal utility translation. |
| Generate WhatsApp script | Low / Medium | Low / Medium | Tier B | Use Tier A if automating sequences or handling sensitive customer data. |
| Debug production auth issue | Critical | Critical | Tier S | Auth, session, permissions, and tenant leakage issues require deep reasoning. |
| Add new dashboard card | Low / Medium | Low / Medium | Tier B | Use Tier A if card depends on API/data/security logic. |
| Build admin approval workflow | High | High | Tier A / S | Use Tier S if workflow changes permissions, audit logs, or tenancy. |
| Create AI lead scoring logic | High | High | Tier A / S | Use Tier S for model policy, fairness, privacy, or production scoring architecture. |
| Refactor API structure | High | High | Tier A / S | Use Tier S for cross-module or breaking API changes. |
| Review security rules | Critical | Critical | Tier S | Never use low-tier models for security, auth, permissions, or data access. |
| Write unit tests | Low / Medium | Low / Medium | Tier B | Use Tier A for complex integration, auth, or multi-tenant test strategy. |
| Create onboarding UX flow | Medium | Medium | Tier A | Use Tier B for small copy/layout updates after the flow is already designed. |
| Generate video script prompt | Low / Medium | Low | Tier B | Use Tier A if prompt architecture affects reusable AI video system behavior. |
| Clean markdown files | Low | Low | Tier C | Formatting, title cleanup, and simple organization can use fastest low-cost model. |

## Escalation Rules

- 如果任务影响数据库 schema，至少使用 Tier A；如果是核心表结构，使用 Tier S。
- 如果任务影响 auth、billing、permissions、multi-tenant，使用 Tier S。
- 如果任务会影响 production deployment，至少使用 Tier A；严重故障使用 Tier S。
- 如果任务只是文案、翻译、格式化，使用 Tier B 或 C。
- 如果低级模型失败两次，自动升级一级。
- 如果模型输出与 architecture 文件冲突，必须停止并读取 architecture 文件。
- 如果 task scope 不清楚，不要乱做，先生成 clarification note 或 assumption list。
- 如果涉及用户数据、安全、权限，不能使用低阶模型。

## Downgrade Rules

- 重复性格式化任务降级到 Tier C。
- 已有明确架构的组件开发可使用 Tier B。
- 普通 UI 微调可使用 Tier B/C。
- 翻译和语言润色可使用 Tier B/C。
- 已通过高级模型设计的任务，后续执行可降级给 Tier A/B。

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

## Required Output Format

Every model routing decision must use this format:

```text
MODEL ROUTING DECISION

Task:
Complexity:
Risk:
Context Size:
Recommended Tier:
Recommended Model Type:
Reason:
Architecture Files To Read:
Fallback:
```

## Decision Workflow

1. Classify the task type and output type.
2. Estimate complexity, risk, context size, and required reasoning.
3. Apply escalation rules first.
4. Apply downgrade rules only if no escalation rule is triggered.
5. Select the recommended tier and model type.
6. List architecture files that must be read before execution.
7. Provide a fallback tier if the selected model fails or the task expands.
