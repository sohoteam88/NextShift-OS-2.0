# Reporting Engine Examples

## Example 1: Weekly Leader Report

**Input:** "Design a weekly report for team leaders showing their team's performance."

**Expected output:**

Report: "团队周报 — Week of {date}"
Audience: Leader
Delivery: Every Monday 9am via email + in-app notification
Sections:
1. Summary: total leads, conversions, team active rate
2. Member breakdown table: name, leads added, follow-ups done, conversions, content published
3. Highlights: top performer, biggest improvement
4. Alerts: members inactive 5+ days
5. AI recommendation: "小李 has 5 hot leads — suggest she focus on closing this week"

## When NOT to Use This Skill

- User needs **metric definitions** → use `data/analytics-engine`
- User needs **dashboard UI** → use `crm/analytics-dashboard`
