---
name: crm-database
description: "Design CRM database schemas for Supabase/Postgres, including leads, contacts, customers, pipeline, activities, tasks, teams, distributors, scoring, retention, and analytics tables. Use when a user needs CRM schema, table design, relationships, RLS notes, indexes, lifecycle states, or implementation-ready database specs."
---

# CRM Database

## Mission

Create a clean CRM data model that supports lead management, pipelines, customer journeys, team activity, retention, and reporting.

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

- CRM modules
- user roles
- entities
- pipeline stages
- lead/customer lifecycle
- team/distributor structure
- reporting needs
- Supabase/RLS requirements

Ask concise questions only for missing high-impact details. If enough context exists, proceed directly and label assumptions.

## Step 2: Design Data Layer

1. Define core entities and relationships.
2. Specify tables, fields, enums, indexes, and constraints.
3. Map ownership, permissions, and row-level security notes.
4. Add audit, activity, task, and event tables.
5. Create migration-ready implementation notes.

## Step 3: Output

Deliver:

- entity relationship map
- tables
- fields
- relationships
- indexes
- RLS notes
- migration plan

End with the first data implementation step.
