---
name: event-tracking
description: "Define product, funnel, CRM, AI Coach, onboarding, content, WhatsApp, and conversion tracking events. Use when a user needs event names, properties, tracking plans, analytics instrumentation, or conversion event specs."
---

# Event Tracking

## Mission

Create an event tracking plan that captures meaningful user behavior without noisy or redundant events.

## Operating Principles

- Design data structures before dashboards.
- Prefer clear names, stable IDs, explicit lifecycle states, and auditability.
- Keep metrics explainable and tied to events or tables.
- Include privacy, access control, and data quality notes.
- Make assumptions explicit when context is missing.
- Never expose API keys, secrets, or unsafe private data.
- Write in the user's language unless they request another language.

## Step 1: Collect Context

Collect:

- product flows
- funnel steps
- key actions
- conversion goals
- user roles
- platforms
- analytics tools
- privacy constraints

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design Data Layer

1. Define event naming conventions.
2. Map events by flow and screen.
3. Specify required and optional properties.
4. Mark conversion, activation, retention, and error events.
5. Add implementation and QA notes.

## Step 3: Output

Deliver:

- tracking plan
- event names
- event properties
- conversion events
- user properties
- implementation notes
- QA checklist

End with the first data implementation step.
