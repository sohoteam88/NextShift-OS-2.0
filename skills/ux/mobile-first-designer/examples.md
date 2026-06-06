# Mobile-First Designer Examples

## Example 1: CRM Lead List on Mobile

**Input:** "Design the lead list view for mobile. Our users are 85% phone-based in Malaysia."

**Expected output:**

Lead list card (375px):
```
┌─────────────────────────┐
│ 🔵 小王          78 🟢  │
│ 已联系 · 2 天前         │
│ [WhatsApp] [备注] [···] │
└─────────────────────────┘
```

Rules:
- Thumb-zone: action buttons in bottom 1/3
- Swipe actions: left=WhatsApp, right=add note
- Pull-to-refresh
- Search bar sticky at top
- FAB (floating action button) for "Add Lead"
- No hover states (touch only)
- Touch targets ≥ 44px
- Font size ≥ 14px for body text

## When NOT to Use This Skill

- User needs **full design system** → use `core/design-system-architect`
- User needs **desktop-first dashboard** → use `ux/dashboard-ux-designer`
