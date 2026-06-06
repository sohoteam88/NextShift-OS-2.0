# CRM UIUX Examples

## Example 1: Mobile Lead Detail Screen

**Input:** "Design the lead detail screen for mobile. Members use this 90% on phone."

**Expected output:**

Mobile layout (375px):
- Header: Lead name, score badge (75 🟢), stage pill (已联系)
- Quick actions (sticky bottom): WhatsApp, Call, Add Note, AI Reply
- Tabs: 详情 | 活动 | 备注

详情 tab: phone, WhatsApp, source, tags, assigned to, created date.
活动 tab: reverse-chronological timeline (WhatsApp sent, note added, stage moved, quiz completed).
备注 tab: notes list + add note input at bottom.

Thumb-zone: all CTAs within bottom 1/3 of screen. WhatsApp button = primary (green, largest).

## Example 2: Pipeline Kanban on Desktop

**Input:** "Design the pipeline kanban board for desktop."

**Expected output:** Horizontal columns (1 per stage), cards show: name, score badge, last activity relative time, next action icon. Drag-drop to move stages. Filter bar: tags, owner, score range, date range. Empty column shows "没有客户在这个阶段" + CTA to add lead.

## When NOT to Use This Skill

- User needs **pipeline stage definitions** → use `crm/pipeline-management`
- User needs **design system components** → use `core/design-system-architect`
