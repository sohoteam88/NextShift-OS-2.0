# Post Launch Button Audit Report

Date: 2026-06-19
Source spec: `POST_LAUNCH_BUTTON_AUDIT.md`

## Scope

Audited visible navigation and action controls across Dashboard, Journey, Admin Dashboard, Brand Builder, Content Engine, Funnels, AI COO, AI Workforce, Analytics, and Settings.

Static scan checks included:

- `href="#"`
- empty `onClick` handlers
- `console.log` only handlers
- `disabled={true}`
- visible `Coming Soon` / `coming soon`
- TODO / mock / placeholder markers in scoped UI
- buttons rendered without a meaningful handler in high-risk components

## Findings and Results

| Button Text | Current Route | Expected Route / Action | Actual Result | Status |
| --- | --- | --- | --- | --- |
| Start Interview / 开始访谈 | `/dashboard` | `/brand-builder/step/interview` | `router.push` / route mapping exists in `TodaysActionCard` | PASS |
| Confirm Brand DNA / 确认品牌 DNA | `/dashboard` | `/brand-builder/step/profile` | `router.push` / route mapping exists | PASS |
| Generate Content / 生成内容 | `/dashboard` | `/content-engine` | `router.push` / route mapping exists | PASS |
| Dashboard journey collapse / expand | `/dashboard` | Toggle journey map collapsed state | Local state toggle exists | PASS |
| Generate recommended content / 生成推荐内容 | `/content-engine` command center | `/content-engine?mode=generator&generate=smart&platform=facebook` | Real route push exists and content engine auto-generates | PASS |
| Full dashboard / 完整仪表盘 | `/content-engine` command center | `/content-engine` | `Link` exists | PASS |
| AI recommendation cards | `/content-engine` command center | `/content-engine?mode=generator&generate=smart` | Route push exists | PASS |
| Platform tabs IG/FB/TikTok/XHS | `/content-engine` | Switch platform | Local state update exists | PASS |
| Generate post / 生成帖子 | `/content-engine` | POST `/api/v1/content-engine/generate` | Mutation exists and invalidates content engine query | PASS |
| Copy post / 复制 | `/content-engine` | Copy generated post body | Clipboard action exists | PASS |
| Generate 30 / 90 / 180 days | `/content-engine` | POST `/api/v1/content-engine/calendar` and show generated calendar | Mutation exists; report includes UI fix to show first 10 generated items | PASS |
| Brand Builder completion links | `/brand-builder/step/complete` | Calendar, Content Engine, Video, CRM | `Link` routes exist | PASS |
| Enter dashboard / 进入控制台 | `/brand-builder/step/complete` | Complete wizard and return to `/dashboard` | Two completion API calls and route push exist | PASS |
| Brand Intelligence back link | `/brand-builder/intelligence` | `/brand-builder/profile` | `Link` exists | PASS |
| Admin back button | `/admin` command center | `/dashboard` | `router.push` exists | PASS |
| Admin approvals | `/admin` command center | `/admin/approvals` | `router.push` exists | PASS |
| Admin users | `/admin` command center | `/admin/users` | `router.push` exists | PASS |
| Admin quick actions | `/admin` command center | `/admin/approvals`, `/admin/users`, `/admin/settings`, `/admin/training`, `/admin/daily-actions`, `/admin/templates` | `router.push` exists for each item | PASS |
| Admin passive KPI cards | `/admin` command center | Display-only metrics | Fixed: cards without actions now render as `div`, not clickable buttons | PASS |
| Funnel preview mobile / desktop | `/funnel/*/edit` | Toggle preview device | Local state toggle exists | PASS |
| Funnel preview CTA / form submit visuals | `/funnel/*/edit` | Display preview only | Fixed: non-interactive preview CTAs render as `div`, not buttons | PASS |
| Public funnel CTA | `/[tenant_slug]/funnel/[funnel_slug]` | WhatsApp, form anchor, or link action | Fixed: legacy tenant route now uses public renderer with real CTA/form behavior | PASS |
| AI Workforce launch team | `/ai-workforce` | POST `/api/v1/ai-workforce/execute` | Mutation exists | PASS |
| AI Workforce agent cards | `/ai-workforce` | Execute selected agent | Mutation exists | PASS |
| Analytics back button | `/analytics` | `/dashboard` | `router.push` exists | PASS |
| Settings language buttons | `/settings` | Update locale cookie and refresh | Handler exists | PASS |
| Settings update password | `/settings` | Supabase password update | Handler exists | PASS |
| Settings logout | `/settings` | Supabase sign out and `/login` | Handler exists | PASS |

## Remediation Summary

- Removed clickable Admin KPI buttons when there is no action.
- Replaced non-interactive funnel preview submit/CTA buttons with non-clickable preview elements.
- Switched legacy tenant public funnel route to the real public renderer.
- Removed visible Brand Intelligence `Coming Soon` placeholder labels.
- Added generated calendar item preview to Content Engine so calendar generation has visible output.

## Remaining Notes

The broad UI scan still finds many valid form placeholders and normal disabled states tied to pending mutations. No exact match remains for `href="#"`, empty click handlers, `console.log`-only click handlers, `disabled={true}`, or visible `Coming Soon` in scoped application code.
