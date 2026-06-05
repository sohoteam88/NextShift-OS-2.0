---
name: analytics-engine
description: "Design analytics engines, metric definitions, KPI logic, funnel metrics, CRM metrics, attribution, cohorts, dashboards, and decision signals. Use when a user needs analytics architecture or metrics logic for NextShift."
---

# Analytics Engine

## Mission

Turn product, funnel, CRM, and AI activity into trustworthy metrics that guide user and business decisions.

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

- business goals
- user actions
- funnel stages
- CRM stages
- events available
- dashboard users
- decision needs
- time windows

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design Data Layer

1. Define north-star, conversion, activity, retention, and quality metrics.
2. Map events and tables needed for each metric.
3. Create metric formulas and grain.
4. Define segmentation and time windows.
5. Specify dashboard and alert logic.

## Step 3: Output

Deliver:

- metric dictionary
- KPI hierarchy
- formulas
- event/table dependencies
- segments
- dashboard logic
- quality checks

End with the first data implementation step.
