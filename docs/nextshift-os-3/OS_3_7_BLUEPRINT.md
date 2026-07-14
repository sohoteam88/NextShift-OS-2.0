# NextShift OS 3.7 Blueprint — Command Center 长全 + Business Twin v1

Version: 1.0
Status: Draft — awaiting Steven approval
Date: 2026-07-13
Author: Claude (Architecture / Orchestration)
Baseline: `v3.6.0` in production（Business Memory 已接入讨论与推荐，六个 runtime flag 全部揭幕）
Parent: [Master Roadmap 2026-07](MASTER_ROADMAP_2026-07.md) — 本版是 **Stage A（"Brain 开始记住"）的后半段**，对应 Master Roadmap 的 A2 + A3 + 结果闸门 A 检查点；Stage A 完成后进入 Stage B（3.8-3.9，"Brain 开始干活"）

---

## 1. OS 3.6 证明了什么，OS 3.7 要接上什么

OS 3.6 让 Business Memory 从骨架变活体：讨论会记住上次聊过什么，推荐引擎会因为反复讨论同一话题而调整措辞。但用户打开 dashboard 时看到的仍然是**两套互不知情的系统**并排堆叠——`TodayRecommendationCard`（推荐引擎驱动）和 `AICommandCard`（mission-engine 驱动）在 `DashboardHome.tsx` 里各自独立请求 `/api/v1/dashboard/recommendation` 和 `/api/v1/dashboard/projection`，各自的后端服务互不引用。这就是 Master Roadmap 点名的"两个声音"问题，也是 Layer 8（Command Center）至今没有"长全"的原因。

同时，`packages/contracts/src/business-twin/index.ts` 里已经定义好一份完整的 `BusinessTwinSnapshot`（identity/brand/offer/customer/goals/understanding/activation/strategy/knowledge/memory 十个字段），`packages/business-brain/src/business-twin/index.ts` 也有 `BusinessTwinRepository` 接口——但目前唯一的调用点在 `discussion-service.ts` 第 214 行，且只填了两个字段：`identity` 是硬编码的 stub（`businessName: 'NextShift Command Center'`），`understanding` 是从当次推荐现造的，不是真实业务数据。用户在 Interview（`interview-authority` 模块）和 Brand DNA（`brand-dna` 模块）里填过的真实信息，从来没有流进这份 snapshot。

## 2. OS 3.7 的一句话目标

**把 Command Center 从两张互不知情的卡片变成一个统一的信息层级，并让 Business Twin 第一次装进用户真实填过的数据——讨论时 AI 不只记得"上次聊了什么"，还知道"这是一家什么样的生意"。**

## 3. Non-Goals

- 不做 Layer 9（BI）、Layer 11（Relationship）的完整版——Weekly Review 只做"借壳先行"的雏形，不是完整的周报表体系（Master Roadmap 原文用词）
- 不扩大 Business Twin 的数据来源到 Interview/Brand DNA 之外（不接 CRM、不接 Content Memory——那是 Stage B 的 B1/B3）
- 不重新设计 `BusinessTwinSnapshot` 的 contract 形状（`packages/contracts` 已冻结在 Core Runtime v0.1，字段已经够用，本版只负责把真实数据填进去，不改 shape）
- 不做独立的"Twin 画像"用户可见页面（Twin 摘要只注入 system prompt，用户通过讨论质量感知，不是新增一个"查看我的 AI 画像"页面——如果后续想做，应该是独立的 task，不在本版隐含实现）
- 不触碰"结果闸门 A"本身的达成——≥10 真实周活用户是 Steven 的获客轨（非工程）决定的，本版只负责把度量管线核对到位、把可能拖慢获客的 onboarding 摩擦点找出来
- 不做 AI 成本仪表（`costsByTenant`）——Master Roadmap 把这个排在 Stage C 前必须完成，不是 Stage A 收官项，本版不提前做

---

## 4. Workstream C — Command Center 长全 (Command Center Completion)

| # | 任务 | 说明 |
|---|---|---|
| C0 | ~~Business Score 卡片接线~~ **已完成（2026-07-13）**：PR #63（app 层镜像公式）被架构复审驳回，PR #64 落库纠正方案（`C0_CANONICAL_SCORE_INTEGRATION_BRIEF.md`），PR #65 按方案实现：`packages/domain` 导出纯函数 `calculateBusinessScore`，`createBusinessScore()` 内部改为调用它；`src/modules/dashboard/services/business-score-service.ts` 从 `@nextshift/domain` 导入该函数（不镜像公式），CRM `confidenceScore`（0-100）显式转换为 0-1 unit 值再传入；`DashboardHome.tsx` 渲染 `<BusinessScoreCard />`；缺 tenant/CRM 加载失败/confidence 非法均走 `runtimeFallbackLogger` 降级为 `null`，不是报错 |
| C1 | ~~Today's Mission 与推荐卡合并信息层级~~ **已完成（2026-07-14）**：PR #67 合并统一 Mission 卡片、Recommendation 分叉提示与讨论入口；架构复审 PASS，Type Check + Lint + Build、Tests、E2E Secret Check、E2E Tests 全部通过 | 一页纸信息架构决定见 [C1 Command Center Information Architecture](C1_COMMAND_CENTER_INFORMATION_ARCHITECTURE.md)。Steven 已确认两个关键判断：(1) 主线索是 Mission 卡片，Recommendation 的 explain/rationale 和"和 AI 讨论"入口吸收进 Mission 卡片，不再单独成卡；(2) decision-brain 引擎给出跟 mission 不同的建议时，用主卡片内的次要提示条呈现分叉信号，不恢复成第二张卡片。实现按该文档第 3/4 节完成 |
| C2 | ~~Weekly Review 雏形（借壳先行）~~ **已完成（2026-07-14）**：PR #68 实现只读的 7 天 Business Memory 周聚合卡片，展示已完成任务、AI 建议发出／采纳／忽略数量及近期活动；不新增独立存储、不做趋势图表。`completedMilestones` 与 `executionPattern` 目前未在卡片中呈现。 |

C0 implementation direction: [Canonical Business Score Integration Brief](business-command-center-v1/C0_CANONICAL_SCORE_INTEGRATION_BRIEF.md). The domain score policy is the single formula owner; C0 is not complete until the dashboard consumes that policy.

---

## 5. Workstream T — Business Twin v1 (Real Data Wiring)

| # | 任务 | 说明 |
|---|---|---|
| T1 | ~~Interview + Brand DNA 数据接入 `BusinessTwinRepository`~~ **已完成（2026-07-14）**：PR #69 实现（stub 移除、identity/brand 接真实数据、空值降级为省略字段而非伪造——审计 PIPELINE_AUDIT_20260714-160343 逐条确认）。注：#69 经旧管线在 CI 红灯下被合并（boundaries 未再生成）,`201fca6` 补齐配置后 CI run #230 全绿（478 tests）,T1 自此获得完整 CI 背书 | 原要求：把 `discussion-service.ts` 第 214 行现在的 stub 替换成真实实现：`identity` 字段从 `interview-authority`（`InterviewProfileSnapshot.ts`）或 `brand-builder`（`brand-interview-service.ts`）的既有数据读取；`brand` 字段（`BrandDNAContext`）从 `brand-dna` 模块读取。用户没做过 Interview/Brand DNA 时必须有明确的空值降级（不是报错，也不是硬编码假数据） |
| T2 | ~~Twin 摘要注入讨论 system prompt~~ **已完成（2026-07-14）**：PR #70（pipeline 首跑产物）。有界注入、空 Twin 整段跳过、仅输出已填字段、200 字符截断、排序在 Memory 摘要后、"do not infer beyond them" 指令、读取失败降级——单测逐条断言。首跑 Step 4 架构复审 FAIL 拦下一个无效 E2E（off-topic 消息不经 prompt 路径,且与既有用例重复）;人工裁决:删除该 E2E,prompt 内容覆盖归属单测层（E2E 无 LLM key 无法观察 prompt 内部,已留注释防复发）。原要求:在 `buildSystemPrompt()`（`discussion-service.ts` 268-291 行）里，紧跟现有的 `buildMemorySummary(memory)` 之后（289 行），新增一段有界的 Twin 摘要注入，做法与 OS 3.6 M2 的 Memory 摘要完全对称：只注入摘要不注入原始 JSON，读取失败走 `runtimeFallbackLogger` 降级为无 Twin 数据继续回复 |

**T1/T2 安全网**：延续 OS 3.6 M1-M3 定的规则——Twin 数据读取失败不能阻塞讨论功能，必须能降级为"无 Twin 摘要"模式继续工作，降级要 Sentry 可见。

---

## 6. Workstream G — 结果闸门 A 收尾 (Stage A Closeout)

| # | 任务 | 说明 |
|---|---|---|
| G1 | ~~onboarding 摩擦点诊断~~ **已完成（2026-07-14）**：PR #71（pipeline 第二圈产物,Steven 手动合并——docs-only diff 触发 ci.yml paths-ignore 导致零 checks,管线误判 abort,缺口由 PIPE-FIX-2 修复）。诊断达标:两条 finish line 分开测量、摩擦点按流失概率排序、可执行清单在报告第 5 节、生产 PostHog 测量缺口显式移交 G2 | 原要求:Master Roadmap 点名"现在的 Journey 偏长，种子用户会流失在路上"。测量当前从注册到看到第一个 AI 推荐的实际步骤数和预估耗时，产出诊断结论（哪几步最容易流失），**不要求本版改完所有摩擦点**，但要有可执行的下一步清单。诊断见 [G1 Onboarding Friction Diagnosis](G1_ONBOARDING_FRICTION_DIAGNOSIS.md)。 |
| G2 | 结果闸门 A 度量核对 | 从生产 PostHog 后台拉取真实数据，确认 OS 3.6 M0 接的四个事件（`recommendation_viewed`/`recommendation_clicked`/`discussion_turn_sent`/`weekly_active`）以及既有的 `user_signed_up` 确实有真实数据在流入（不是"代码写了"，是"面板里能查到"），写入 blueprint。闸门本身（≥10 真实周活）达成与否不是本项验收标准，由 Steven 的获客轨决定 |
| G3 | 遗留 hygiene：`generateWithFallback` 收编进 router | Master Roadmap 记录为"2 处遗留"，实测（2026-07-13 grep）实际是 **4 处**：`src/modules/member/services/onboarding-service.ts`（326、381 行）和 `src/modules/voice/services/voice-service.ts`（303、316 行）直接调用 `providers/factory.ts` 的 `generateWithFallback`，绕过了 `src/modules/ai/router/ai-router.ts`。收编进 router，统一走 T1（OS 3.5）已经建立的路由+配额+日志路径 |

---

## 7. 执行顺序

```
Phase 0（立即，互不阻塞，可并行）：G2 度量核对 + G3 router 收编 + T1 Twin 数据接入
Phase 1：C0 Business Score 接线（为 C1 打基础）
Phase 2：C1 设计判断先行（一页纸信息架构，Steven 过目）→ C1 实现
Phase 3：T2 Twin 摘要注入讨论 + C2 Weekly Review 雏形
Phase 4：G1 onboarding 诊断（可与 Phase 3 并行，不依赖前面任务）
Phase 5：Round 7/8 audit → RC → planning→main → v3.7.0
```

节奏照旧：每 PR 一 review，每 2-3 PR 一次 Claude Code audit，交付物落库由 Claude 执行。C1 是唯一一个在进 Codex 执行前需要 Steven 产品判断的任务，不要跳过这一步直接让 Codex 自由发挥信息架构。

---

## 8. 发布标准（v3.7.0）

1. Business Score 卡片在 dashboard 真实渲染，评分计算来自 `createBusinessScore()` 所使用的导出 domain score policy，不在 app 层硬编码或镜像公式/分段
2. Today's Mission 和推荐卡不再是两个独立 fetch、两个并排卡片——有一份 Steven 过目认可的信息架构决定，且实现与该决定一致
3. Weekly Review 雏形可见，纯读取现有 Memory 数据，无新增存储
4. `discussion-service.ts` 的 Twin snapshot 不再是硬编码 stub，`identity`/`brand` 字段在用户做过 Interview/Brand DNA 时反映真实数据，没做过时有明确空值降级
5. Twin 摘要注入 system prompt，读取失败有 Sentry 可见降级，E2E 有覆盖
6. G2 度量核对完成，PostHog 后台真实数据截图/记录写入 blueprint
7. `generateWithFallback` 的 4 个遗留直连点清零，统一走 router
8. G1 诊断结论写入 blueprint，不要求摩擦点本版全部修完
9. 两轮 audit PASS 落库；release package + canonical status 一次到位

不在本版标准内：结果闸门 A 本身（≥10 真实用户周活）的达成——工程只负责把度量管线和体验摩擦点处理好，闸门达成由获客决定，不写进 audit 验收。闸门达成后才能开 Stage B。

---

## 9. 风险

| 风险 | 缓解 |
|---|---|
| C1 信息架构判断被跳过，Codex 直接按自己理解合并 UI，做出 Steven 不认可的方案，返工成本高 | 执行顺序明确要求 C1 分两步，设计判断产出物必须先经过 Claude 转达 Steven 确认，再进入 Codex 执行阶段 |
| Twin 数据把 Interview/Brand DNA 里用户没填的字段当成"已知"注入 prompt，导致 AI 编造不存在的业务细节 | T1 实现时必须显式处理空值/未完成 Interview 的情况，不能用默认值伪装成真实数据；T2 的 prompt 注入要在 Twin 摘要为空时完全跳过该段，而不是注入"未知"占位符 |
| Business Score 卡片和即将合并的 C1 信息层级顺序冲突（C0 先做，C1 又要重新调整布局） | 执行顺序把 C0 排在 C1 之前，C1 的一页纸设计判断阶段必须把 Business Score 卡片的位置一并考虑进去，不是做完 C0 再推倒重来 |
| Weekly Review 复用 Memory 数据但周聚合逻辑与 M3（讨论记忆门槛）用的时间窗口不一致，产生两套"最近"定义 | C2 实现前先读 `business-memory-projection.ts` 和 `discussionAttentionFor()` 已有的窗口定义，复用而不是新造一套时间窗口常量 |
| G1 诊断发现的摩擦点范围超出本版能改完的量，导致 Phase 4 无限拖延 | 发布标准明确"不要求本版改完所有摩擦点"，G1 只要求诊断结论和下一步清单，不是修复承诺 |

---

## Audit Result

（Round 7/8 由 Claude Code 完成，落库由 Claude 执行，完整报告存 audit/ 目录）
