# NextShift OS 3.5 Blueprint — Business Brain Starts Talking

Version: 1.0
Status: Draft — awaiting Steven approval
Date: 2026-07-11
Author: Claude (Architecture / Orchestration)
Baseline: `v3.4.0` in production（Command Center 卡片已揭幕,engine 推荐已对真实用户输出）

---

## 1. OS 3.4 证明了什么

用户已经能"看见" Business Brain（Today's Recommendation 卡片,engine 路径真实工作,47% confidence 的推荐与业务上下文自洽）。runtime 架构承载真实流量（revenue/analytics 默认 on）,fallback 有 Sentry 可观测,发布管线一天可以安全走两轮。

但看见不等于对话：用户只能接受或忽略推荐,不能问"为什么"之外的问题,不能讨论。Layer 3（Conversation Engine）还停在 packages 里。

## 2. OS 3.5 的一句话目标

**让用户第一次和 Business Brain 对话：推荐卡片上出现 "和 AI 讨论" 入口,基于 decision context 的 LLM 对话,全部流量经 modules/ai router。同时完成 flag 生命周期的第一个完整闭环（转正 → 删除 legacy）。**

## 3. Non-Goals

- 不做全功能 AI Chat / ChatGPT 式开放对话——只做锚定在当前推荐上的 Business Discussion（Layer roadmap 原文:"不是 ChatGPT,而是 Business Discussion"）
- 不做多轮长记忆（Business Memory 是 Layer 1 的事,OS 3.6+）
- 不新增 runtime 模块迁移（5/68 够 Command Center 用了,下一批等需求牵引）
- 不做 UI 大翻新（延续跟随策略）

---

## 4. Workstream G — Flag 生命周期闭环（Graduation Gate）

**前置观察闸门（覆盖式,2026-07-11 修订）**：原定 7 天时间闸门基于"有自然流量"假设,当前生产近零流量,时间等待产生的是空洞证据。改为覆盖三要素,满足即开闸：

1. **管道验证**:Sentry 项目确认能收到生产事件（已满足——2026-06 周报显示项目收到过真实 error 事件）
2. **路径行使**:在生产环境人工真实走一遍 5 个 runtime 模块界面（dashboard 的 mission/business-state/推荐卡、crm-center、analytics、revenue 相关页）,加上 CI E2E 每日 flag-on 全量
3. **行使后取证**:Sentry `runtime-adapter-fallback` 计数为 0,截图归档

G2 的实际安全网不依赖观察期:行为等价 E2E + 分两个 PR + revert 预案（见 G2 说明与风险表）。

| # | 任务 | 说明 |
|---|---|---|
| G1 | 转正剩余 4 个 flag：MISSION / BUSINESS_STATE / CRM / COMMAND_CENTER 切到 `isRuntimeFlagEnabledByDefault` | 观察闸门通过后执行;COMMAND_CENTER 转正意味着卡片对全部用户默认可见 |
| G2 | 删除 revenue/analytics 的 legacy 路径与 flag（OS 3.3 的承诺） | 高风险任务:删除前 E2E 必须有 runtime 路径的行为等价用例;逃生手段从 flag 变为 git revert |
| G3 | flag 注册表加 lifecycle 字段（introduced → graduated → removed）,形成可审计的 flag 履历 | 文档化闭环 |

## 5. Workstream T — Conversation 首切片（Layer 3 落地）

| # | 任务 | 说明 |
|---|---|---|
| T1 | **ai router 就绪审计**：现有 modules/ai router 的模型路由、用量追踪、成本上限、降级策略盘点;补缺口（尤其 per-tenant 用量上限——对话是第一个用户可反复触发的 LLM 面) | 审计先行,T2 的地基 |
| T2 | **"和 AI 讨论"服务层**：conversation service 接 @nextshift/decision-brain 的 conversation-engine（决定对话结构）+ modules/ai router（生成文字）。输入锚定:当前 recommendation + decision context。flag: `NEXT_PUBLIC_ENABLE_AI_DISCUSSION`(默认 off) | LLM 调用必须走 router——架构铁律,禁止直连 |
| T3 | 卡片上的讨论 UI：展开式对话面板（不是独立页面）,3-5 轮上限,每轮显示 token 成本意识（如"本次讨论已用 N 次 AI 调用"） | UI 铁律延续;含 E2E |

## 6. Workstream H — Hygiene 批次（穿插,不阻塞）

1. `next lint` → ESLint CLI 迁移（Next 16 前必做,顺带解决计数不确定性）+ eslint 边界生成器 + CI 一致性校验
2. CI actions 升级（Node 20 deprecation 消除）
3. `getAuthUser` 包 `React.cache()`（消除 admin 页每请求 2-3 次 session 查询）
4. version / health 端点加 `no-store`（v3.4.0 部署验证时被代理缓存误导的教训）
5. compose 文件删 obsolete `version` 字段
6. UI 迭代小项:卡片位置/信息层级评估、confidence < 50% 的展示策略（Round 4 后的两条观察）

## 7. 执行顺序

```
Phase 0（立即）:   Sentry 观察闸门起表(7天) + T1 router 审计 + H1 lint 迁移
Phase 1:          T2 conversation service + H2/H3/H4
Phase 2:          T3 讨论 UI + H6 卡片迭代
Phase 3（≥07-18）: G1 全 flag 转正 → G2 legacy 删除 → G3 履历
Phase 4:          Round 5/6 audit → RC → planning→main → v3.5.0
```

节奏照旧：每 PR 一 review,每 2-3 PR 一次 Claude Code audit,交付物落库由 Claude 执行。

## 8. 发布标准（v3.5.0）

1. flag on 时推荐卡片可展开 AI 讨论,LLM 流量 100% 经 ai router 有用量记录,E2E 有用例
2. 6 个 flag 全部 graduated;revenue/analytics 的 legacy 路径已删除且行为等价有测试证明
3. Sentry 观察期报告归档（fallback 计数为证据）
4. lint 迁移完成:ESLint CLI 确定性计数,边界 warn ≤ 409 + hooks warn ≤ 4（ESLint CLI 确定性计数,PR #41 定稿;历史 192 系 `next lint` 覆盖面少报）,且生成器进 CI
5. 两轮 audit PASS 落库;release package + canonical status 一次到位

## 9. 风险

| 风险 | 缓解 |
|---|---|
| LLM 成本失控（对话可反复触发） | T1 先建 per-tenant 上限;T3 轮次上限 + 成本可见;flag 默认 off 灰度 |
| 对话质量在业务上下文外跑偏 | 锚定 decision context,system prompt 拒绝离题;不做开放 chat 是产品定位不是技术限制 |
| G2 删 legacy 后发现 runtime 路径行为差异 | 删除前行为等价 E2E;分两个 PR（先 revenue 后 analytics）;git revert 预案演练 |
| 观察期内出现 fallback warning | 闸门自动推迟 G 系列,不影响 T/H 轨道并行 |

---

## Audit Result

（Round 5 / Round 6 由 Claude Code 完成,落库由 Claude 执行,完整报告存 audit/ 目录）
