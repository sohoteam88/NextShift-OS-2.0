# Data Warehouse Examples

## Example 1: Lead Analytics Mart

**Input:** "Design a data mart for lead conversion analysis."

**Expected output:**

Fact table: `fct_lead_conversions` (lead_id, tenant_id, created_date, converted_date, days_to_convert, source, funnel_id, final_score, stage_count, touchpoint_count).

Dimensions: `dim_source` (source_name, source_type), `dim_funnel` (funnel_name, funnel_type, tenant_id), `dim_date` (date, week, month, quarter).

Refresh: nightly ELT from leads + activities tables. Tool: SQL views in Supabase (Phase 1), dbt + BigQuery (Phase 2+).

Note: This is Phase 2+ architecture. For Phase 1, use direct queries on application tables.

## When NOT to Use This Skill

- User needs **application database tables** → use `data/crm-database`
- User needs **event definitions** → use `data/event-tracking`
