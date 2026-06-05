---
name: data-warehouse
description: "Design data warehouse models, staging tables, marts, dimensions, facts, ETL/ELT flows, CRM/funnel analytics marts, and warehouse governance. Use when a user needs scalable data architecture beyond app tables."
---

# Data Warehouse

## Mission

Create a warehouse structure that turns raw product, CRM, funnel, and AI events into analytics-ready data marts.

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

- source systems
- raw tables/events
- reporting needs
- metric grain
- refresh cadence
- data volume
- warehouse tool
- governance needs

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design Data Layer

1. Define raw, staging, intermediate, and mart layers.
2. Design facts and dimensions.
3. Map source-to-mart transformations.
4. Specify refresh cadence, lineage, and data quality tests.
5. Create governance and access notes.

## Step 3: Output

Deliver:

- warehouse layers
- source map
- facts
- dimensions
- data marts
- ELT flow
- quality tests
- governance notes

End with the first data implementation step.
