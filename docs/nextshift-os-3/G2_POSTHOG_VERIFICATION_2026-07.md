# G2 — PostHog 度量核对（结果闸门 A 地基验证）

Version: 1.0
Date: 2026-07-14
Author: Claude (orchestration) — 数据由 Steven 人工在生产 PostHog 后台核对
Status: 核对完成;含一项 P0 级衍生发现（见第 4 节,已转 F1）

---

## 1. 核对方法

Steven 直接登录生产 PostHog 后台（US Cloud）,在 Activity/Events 面板核对事件流入;
Claude 依据面板截图记录结论。证据等级:全部为 **Observed production**（面板实查),
无推断项。

## 2. 首要发现:instrumentation 在 2026-07-14 之前为黑箱

- 生产 `.env.production` 中 `NEXT_PUBLIC_POSTHOG_HOST` 为空、`NEXT_PUBLIC_POSTHOG_KEY`
  为 2.0 时代遗留值,**不对应任何可访问的 PostHog 项目**（幽灵 key）
- 结论:OS 3.6 M0 接入的事件代码自上线以来发出的数据不可查。
  "代码写了" ≠ "面板里能查到"——G2 存在的意义被这个发现本身证明
- **当日修复**:新建 PostHog 项目（US Cloud）→ 更新 GitHub
  `PROD_NEXT_PUBLIC_POSTHOG_KEY` / 新增 `PROD_NEXT_PUBLIC_POSTHOG_HOST` → VPS env 同步
  → Deploy re-run 重烤前端 → 事件即时可查

## 3. 五事件核对结果（2026-07-14,修复后）

| 事件 | 面板可查 | 备注 |
|---|---|---|
| `recommendation_viewed` | ✅ Observed | 来源 nextshiftos.com/dashboard,library=web |
| `discussion_turn_sent` | ✅ Observed | 同上 |
| `weekly_active` | ✅ Observed | 同上 |
| `recommendation_clicked` | ✅ Observed | CTA 点击后入账 |
| `user_signed_up` | ⛔ 无法验证 | 被生产注册流程断裂阻断——见第 4 节;事件代码存在,但当前没有任何用户能走完注册 |

## 4. P0 衍生发现:注册流程生产级断裂（已转 F1）

首次真实生产注册尝试（2026-07-14）复现完整断裂链:

1. 注册表单提交 → 报错 **"Authentication required"**（文案本身即 UX 缺陷:
   未告知用户需要邮箱验证）
2. Supabase 认证层用户已创建,验证邮件发出;用户点击 Confirm 成功
3. 验证后登录 → 卡在空状态;应用层 user/tenant 记录**从未创建**
   （admin User Management 无记录）
4. 结果:**悬空账号**——认证层存在、应用层不存在,用户无法使用产品且无从自救

影响评级:P0。在修复前,所有真实新用户注册均会流失。Stage A 结果闸门
（≥10 真实周活）在此 bug 存在期间不可能达成。

补充记录:G1 诊断（本地运行）无法观察到此断裂——本地未真实提交注册。
生产实测对本地诊断的这次修正,是"结果闸门方法论"的直接收益证据。

测试残留:悬空认证账号 `stevensc082+g2test@gmail.com` 保留,作为 F1 修复的
复现用例与验收 fixture。

## 5. G2 验收结论

G2 的任务是"确认数据真实流入面板并写入 blueprint"——已完成:4/5 事件实证可查,
第 5 个(`user_signed_up`)的不可验证性本身定位出了比事件缺失更严重的产品缺陷。
instrumentation 自今日起为真实可观测状态,结果闸门 A 的度量地基就绪。
