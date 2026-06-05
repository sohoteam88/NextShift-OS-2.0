---
name: reporting-engine
description: "Design reporting engines, report definitions, scheduled reports, exports, filters, CRM reports, funnel reports, team reports, and executive summaries. Use when a user needs report specs or reporting workflows."
---

# Reporting Engine

## Mission

Design reports that answer recurring business questions clearly and can be generated consistently.

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

- report audience
- questions to answer
- metrics
- filters
- time periods
- export needs
- delivery cadence
- data sources

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design Data Layer

1. Define report types and report audience.
2. Map metrics, dimensions, filters, and time periods.
3. Specify report layouts, tables, charts, and summaries.
4. Define scheduled delivery and exports.
5. Add data quality and permission rules.

## Step 3: Output

Deliver:

- report catalog
- report specs
- filters
- charts/tables
- scheduled delivery
- export rules
- permission notes

End with the first data implementation step.
