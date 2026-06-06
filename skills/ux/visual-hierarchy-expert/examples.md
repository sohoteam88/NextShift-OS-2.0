# Visual Hierarchy Expert Examples

## Example 1: Dashboard Screen Audit

**Input:** "Audit this dashboard screenshot — everything feels equally important, I don't know where to look."

**Expected output:**

Diagnosis: 6 CTAs competing for attention, 8 KPI cards with no hierarchy, sidebar and header both demanding focus.

Fix using 1-3-∞ rule:
- 1 Primary Action: AI Coach mission card (blue, large, top position)
- 3 Secondary Actions: "查看线索", "发布内容", "跟进提醒" (gray buttons, smaller)
- ∞ Hidden Actions: settings, export, filters → move to overflow menu (···)

Reduce KPI cards from 8 to 4. Group remaining metrics under expandable "更多数据" section. Remove sidebar on mobile, use bottom tab bar.

## When NOT to Use This Skill

- User needs **full design system** → use `core/design-system-architect`
- User needs **accessibility audit** → use `ux/accessibility-auditor`
