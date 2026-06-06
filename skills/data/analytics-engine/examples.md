# Analytics Engine Examples

## Example 1: Define Conversion Funnel Metrics

**Input:** "Define the metrics for our lead-to-customer conversion funnel."

**Expected output:**

| Metric | Formula | Grain | Source |
|--------|---------|-------|--------|
| Lead Volume | COUNT(leads) WHERE created_at in period | Daily/Weekly/Monthly | leads table |
| Contact Rate | leads contacted / total leads × 100 | Weekly | leads WHERE stage != 'new' / total |
| Qualification Rate | leads qualified / leads contacted × 100 | Weekly | leads WHERE stage = 'qualified' / contacted |
| Conversion Rate | customers / total leads × 100 | Monthly | leads WHERE stage = 'converted' / total |
| Time to Convert | AVG(converted_at - created_at) | Monthly | leads WHERE converted |
| Cost per Lead | ad_spend / lead_volume | Monthly | external + leads |

North-star metric: Monthly Conversion Rate. Leading indicators: Contact Rate (48h), Qualification Rate.

## When NOT to Use This Skill

- User needs **dashboard UI design** → use `crm/analytics-dashboard` or `ux/dashboard-ux-designer`
- User needs **event tracking plan** → use `data/event-tracking`
