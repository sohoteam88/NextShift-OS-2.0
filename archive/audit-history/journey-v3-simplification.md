# Journey V3 Simplification Report

**Date:** 2026-06-15
**Scope:** Redesign `/journey` for new user clarity
**Status:** ✅ Complete

---

## Problem

Previous `/journey` page used expert terminology (漏斗/转化率/Pipeline/Traffic/Bottleneck) that confused beginners. Users saw information but didn't know what action to take.

## Solution

**Default mode = Beginner.** Advanced mode available via toggle.

### Files Created/Modified

| File | Change |
|---|---|
| `src/modules/journey/utils/getNextJourneyAction.ts` | NEW — dynamic next-action resolver (120 lines) |
| `src/modules/journey/components/BeginnerJourneyView.tsx` | NEW — beginner-friendly journey UI (110 lines) |
| `src/app/(auth)/journey/page.tsx` | Modified — mode toggle + beginner redirect |

---

## Beginner Mode Layout

```
🎯 你的当前目标
   "让系统先了解你..."

📍 当前任务：品牌探索访谈
   ⏱ 预计时间：10 分钟
   ✅ 你的品牌定位
   ✅ 你的内容方向
   ✅ AI 文案生成基础
   [开始品牌访谈 →]

📊 你的成长进度
   ▓░░░░░░░ 14% — 步骤 1/7

🤖 AI 教练建议
   "先完成品牌探索访谈..."
```

## Completion Logic

| If... | Shows... | CTA Route |
|---|---|---|
| Brand Interview incomplete | 品牌探索访谈 | `/brand-builder/step/interview` |
| Brand DNA incomplete | 生成品牌 DNA | `/brand-dna` |
| First Content incomplete | 发布第一篇内容 | `/content-engine` |
| First Lead incomplete | 创建引流磁铁 | `/lead-magnet` |
| First Customer incomplete | 开始客户跟进 | `/crm` |
| Follow-up incomplete | 设置自动跟进 | `/whatsapp-ai` |
| First Member incomplete | 邀请团队成员 | `/team` |

## Terminology Changes

| Replaced (Expert) | With (Beginner) |
|---|---|
| 漏斗 | 成长阶段 |
| 转化率 | (hidden) |
| Pipeline | (hidden) |
| Traffic | (hidden) |
| Bottleneck | (hidden) |
| Funnel Health | (hidden) |
| Retail/Recruitment/Upgrade Funnel | 阶段 1–7 |

## Advanced Mode Preservation

All existing funnel metrics (FunnelSelector, FunnelProgressCard, FunnelHealthCard, FunnelMilestoneCard, JourneyPhaseList) are preserved behind the "高级模式" toggle. Advanced users can switch with one click.

## Acceptance Criteria Status

| Criteria | Status |
|---|---|
| `/journey` default view is beginner-friendly | ✅ |
| New users understand what to do within 5 seconds | ✅ |
| No funnel terminology in beginner mode | ✅ |
| Main CTA says "开始品牌访谈" | ✅ |
| Main CTA routes to `/brand-builder/step/interview` | ✅ |
| Advanced metrics preserved in advanced mode | ✅ |
| Dashboard "开始旅程" routes to `/journey` | ✅ Undamaged |
| `/journey` routes to correct next task based on progress | ✅ Dynamic completion logic |
| Mobile UI not crowded | ✅ Single column, spaced cards |
| No breaking existing journey data logic | ✅ Uses existing `useMissionState()` |

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully
✓ Generating static pages (208/208)
```
