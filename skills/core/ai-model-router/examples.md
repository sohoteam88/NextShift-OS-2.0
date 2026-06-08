# AI Model Router Examples

## Example 1 — Database Schema (Tier S, Claude Code)

```text
MODEL ROUTING DECISION

Task: Design lead, pipeline, and tenant-aware CRM tables.
Complexity: Critical
Risk: Critical
Context Size: Large
Confidence: High (92%)
Recommended Tier: Tier S
Recommended Model: Anthropic claude-opus-4-6
Platform: Claude Code
Decomposable: No
Reason: Core schema, multi-tenant boundaries, permissions, and CRM data integrity are affected. Requires human architect feedback loop.
Architecture Files To Read: 03_DOMAIN_MODEL.md, 05_USER_ROLES_AND_PERMISSIONS.md, 06_MULTI_TENANT_ARCHITECTURE.md, 07_DATABASE_ARCHITECTURE.md, 10_CRM_ARCHITECTURE.md, 17_SECURITY_ARCHITECTURE.md
Fallback: If uncertainty remains, pause and produce assumptions plus open questions before implementation.
Estimated Cost: High (~$2-5 per session)
Estimated Latency: 60-120s per response
```

## Example 2 — Markdown Cleanup (Tier C, Codex)

```text
MODEL ROUTING DECISION

Task: Clean heading levels and link formatting across 47 markdown docs.
Complexity: Low
Risk: Low
Context Size: Medium
Confidence: High (95%)
Recommended Tier: Tier C
Recommended Model: OpenAI gpt-4.1-nano
Platform: Codex
Decomposable: Yes
  └─ Subtasks:
     - [Process docs 1-15] → Tier C on Codex (parallel)
     - [Process docs 16-30] → Tier C on Codex (parallel)
     - [Process docs 31-47] → Tier C on Codex (parallel)
Reason: Repetitive formatting with no product, data, security, or architecture impact. Batch-friendly.
Architecture Files To Read: None.
Fallback: Upgrade to Tier B if content restructuring or technical interpretation is required.
Estimated Cost: Low (~$0.02 total)
Estimated Latency: 5-10s per batch
```

## Example 3 — Production Auth Debugging (Tier S, Claude Code)

```text
MODEL ROUTING DECISION

Task: Debug production login issue where users may see another tenant's data.
Complexity: Critical
Risk: Critical
Context Size: Large
Confidence: High (97%)
Recommended Tier: Tier S
Recommended Model: Anthropic claude-opus-4-6
Platform: Claude Code
Decomposable: No
Reason: Auth, permissions, tenant isolation, and production user data safety are involved. Requires real-time human collaboration and sign-off.
Architecture Files To Read: 05_USER_ROLES_AND_PERMISSIONS.md, 06_MULTI_TENANT_ARCHITECTURE.md, 08_API_ARCHITECTURE.md, 17_SECURITY_ARCHITECTURE.md, 18_DEPLOYMENT_ARCHITECTURE.md
Fallback: STOP all deployment-affecting changes until root cause and rollback path are clear.
Estimated Cost: High (~$5-10 for full debugging session)
Estimated Latency: 60-120s per response
```

## Example 4 — Full Feature Build with Decomposition (Mixed Tiers)

```text
MODEL ROUTING DECISION

Task: Build a new "Team Analytics" dashboard with role-based access, charts, and export.
Complexity: High
Risk: Medium
Context Size: Large
Confidence: Medium (72%)
Recommended Tier: Mixed (S → A → B)
Recommended Model: Starts with claude-opus-4-6, then claude-sonnet-4-6
Platform: Claude Code (design) → Codex (implementation) → Coworker (docs)
Decomposable: Yes
  └─ Subtasks:
     - [Design data model + access control] → Tier S on Claude Code
     - [Implement API endpoints] → Tier A on Codex
     - [Build frontend components] → Tier A on Codex (parallel with API)
     - [Write component tests] → Tier B on Codex (after implementation)
     - [Create user documentation] → Tier B on Coworker (parallel with tests)
     - [i18n translations] → Tier B on Codex (parallel with docs)
Reason: Multi-domain task (security + data + frontend + UX). Architecture phase needs Tier S for access control design. Implementation is well-scoped after design phase.
Architecture Files To Read: 05_USER_ROLES_AND_PERMISSIONS.md, 07_DATABASE_ARCHITECTURE.md, 08_API_ARCHITECTURE.md, 13_ANALYTICS_ARCHITECTURE.md, 14_UI_UX_ARCHITECTURE.md
Fallback: If access control design is ambiguous, stay in Tier S until fully resolved before spawning implementation tasks.
Estimated Cost: Medium (~$8-15 total across all subtasks)
Estimated Latency: 15-30 min total (with parallel execution)
```

## Example 5 — Low Confidence → Clarification Required

```text
MODEL ROUTING DECISION

Task: "Make the CRM better"
Complexity: Unknown
Risk: Unknown
Context Size: Unknown
Confidence: Low (25%)
Recommended Tier: CANNOT ROUTE — clarification required
Recommended Model: N/A
Platform: N/A
Decomposable: Unknown

CLARIFICATION QUESTIONS:
1. Which aspect of the CRM? (Lead management, pipeline, contacts, reporting?)
2. What does "better" mean? (Performance, UX, features, data accuracy?)
3. Who is the target user? (Sales rep, manager, admin?)
4. Is there a specific pain point or bug driving this request?
5. What is the timeline and budget sensitivity?

Reason: Task scope is too vague to assess complexity, risk, or appropriate tier. Executing without clarification risks wasted compute and wrong architecture decisions.
Architecture Files To Read: Pending clarification — likely 10_CRM_ARCHITECTURE.md once scope is defined.
Fallback: N/A — await human input.
Estimated Cost: N/A
Estimated Latency: N/A
```

## Example 6 — Competitive Research (Tier A, Coworker)

```text
MODEL ROUTING DECISION

Task: Research top 5 competitors' pricing pages and produce a comparison document.
Complexity: Medium
Risk: Low
Context Size: Medium
Confidence: High (88%)
Recommended Tier: Tier A
Recommended Model: Anthropic claude-sonnet-4-6
Platform: Coworker
Decomposable: No (sequential research, then synthesis)
Reason: Requires web search, reading multiple pages, synthesizing findings, and producing a formatted deliverable. Coworker has web search + document creation tools. Tier A needed for quality synthesis and strategic framing.
Architecture Files To Read: None (external research task).
Fallback: If research reveals complex pricing models requiring deep analysis, consider Tier S for strategy recommendations.
Estimated Cost: Low (~$0.50-1.00)
Estimated Latency: 5-10 min total
```
