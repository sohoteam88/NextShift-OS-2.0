# Phase 10G — Experience Simplification Report

**Date:** 2026-06-16
**Scope:** Transform feature-rich system into guided growth system
**Status:** ✅ Complete

---

## Files Created/Modified

### New (1)

| File | Purpose |
|---|---|
| `experience/components/UnlockPreview.tsx` | Shows what unlocks after current stage — motivation without clutter |

### Modified (3)

| File | Change |
|---|---|
| `mission/constants/sidebar-config.ts` | Added EXPLORER_SIDEBAR, BUILDER_SIDEBAR, OPERATOR_SIDEBAR |
| `components/layouts/Sidebar.tsx` | Level-based sidebar selection + unlock preview text |
| `dashboard/components/DashboardV4.tsx` | Added UnlockPreview to Progress column |

---

## Level-Based Sidebar

| Level | Visible Items | Hidden |
|---|---|---|
| **Explorer** | Dashboard, Journey | Content, Lead, CRM, Sales, Team |
| **Builder** | + Content (Command Center, AI, Video) | Lead, CRM, Sales, Team |
| **Operator** | + Lead, CRM, Sales | Team |
| **Leader** | All modules | — |

### Explorer Sidebar

```
仪表盘
旅程地图
─────────────────
完成品牌基础后解锁：
内容引擎、客户开发、销售中心
```

## UnlockPreview Component

Shows on Dashboard for Explorer/Builder/Operator users:

```
🔒 完成当前阶段后解锁
解锁内容引擎
→ 内容策略自动生成
→ AI 内容创作助手
→ 内容表现分析
```

Leaders see nothing (all unlocked).

## Dashboard Layout (Final)

```
┌──────────────────────────────────────┐
│ ⚡ 今日任务 — 动态 CTA               │
├────────────────┬─────────────────────┤
│ 成长路线图      │ AI 教练             │
│ 解锁预览        │                     │
└────────────────┴─────────────────────┘
```

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully
✓ Generating static pages
```
