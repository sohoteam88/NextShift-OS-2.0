# AI Agent Orchestrator Examples

## Example 1: Content Publishing Pipeline

**Input:** "Design a multi-agent workflow: Agent 1 generates content from member profile, Agent 2 checks compliance, Agent 3 formats for platform, human reviews before publishing."

**Expected output:**

Agent map:
```
ContentGenerator → ComplianceChecker → PlatformFormatter → HumanReview → Publish
```

Agent 1 (ContentGenerator): input=member profile + topic, tool=AI content API, output=draft post
Agent 2 (ComplianceChecker): input=draft, rules=no income claims/no brand names/no medical claims, output=pass/flag
Agent 3 (PlatformFormatter): input=approved draft, tool=platform templates, output=formatted for FB/IG/TikTok/小红书
Human Review: user sees formatted posts, approves/edits
Publish: posts to scheduled queue

Guardrails: Agent 2 blocks if compliance fails (requires human edit). Max 3 retries per agent. All steps logged.

## Example 2: Lead Qualification Bot

**Input:** "Design an agent that qualifies WhatsApp leads through conversation."

**Expected output:** Single agent with conversation state machine: Greet → Ask problem → Ask timeline → Ask budget signal → Score → Route (hot → human closer, warm → nurture sequence, cold → content drip). Handoff rules, safety guardrails (never promise results), logging.

## When NOT to Use This Skill

- User needs a **single AI generation** (content, funnel copy) → use specific ai/ skill
- User needs **AI Coach UX** → use `ai/ai-coach` or `core/ai-assistant-designer`
