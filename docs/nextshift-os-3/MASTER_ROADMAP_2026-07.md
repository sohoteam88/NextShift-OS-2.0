# NextShift OS Master Roadmap — 从 v3.5.0 到完整愿景

Version: 1.0
Status: Draft — awaiting Steven approval
Date: 2026-07-12
Author: Claude (Architecture / Orchestration)
Baseline: `v3.5.0`（Command Center 卡片 + AI 讨论 + flag 生命周期首个完整闭环）
Source: [LAYER_ROADMAP_P0.md](LAYER_ROADMAP_P0.md)（15 层愿景 + Top 10 + AI Success Engine）

---

## 0. 当前位置（对照 15 层愿景的诚实盘点）

| Layer | 愿景 | 现状 |
|---|---|---|
| 1 Business Brain | Twin/记忆/知识图谱 | packages 骨架全在,**无真实数据积累**——已建成"脑",还没开始"记" |
| 2 Decision Engine | 推荐/置信/解释 | ✅ 已上产品(推荐卡片),规则+引擎双路 |
| 3 Conversation | Business Discussion | ✅ 首切片已上(锚定推荐的 5 轮讨论) |
| 4 Creative Studio | 内容全家桶 | 存量功能多(content/video 模块),未经 Brain 个性化 |
| 5 Growth | Funnel/Webinar | 存量功能在,AI recommendation 未接入 |
| 6 Traffic/Trend | 各平台 viral 情报 | ❌ 外部数据无解,维持降级 |
| 7 Revenue/WhatsApp | AI 成交引擎 | whatsapp-ai 模块存量在,AI Reply 未激活 |
| 8 Command Center | AI 每日任务中心 | ✅ 第一张脸已揭幕 |
| 9-12 BI/Presence/Relationship/Knowledge | | 存量模块散在,未串联 |
| 13-15 Workforce/Learning/Marketplace | | P2 未动(正确) |
| Success Engine | 目标→每日动态策略 | 未动——**这是终局** |

工程基线:5/68 模块 runtime 化、E2E 32+、6 flag 生命周期管理、部署一键、四轮 audit 纪律。**最大的空白不是功能,是真实用户和真实数据——Brain 没有东西可记,Success Engine 没有目标可追。**

---

## 1. 总原则:从"造功能"切换到"结果闸门"

OS 3.3-3.5 的闸门是工程性的（测试绿、审计过）。从 Stage A 起,每个 Stage 增加一个**结果闸门**——不满足就不开下一个 Stage 的新功能,只做打磨:

> **Stage 结果闸门 = 有 N 个真实用户在用上一 Stage 的核心能力,且留存/激活数据可查（PostHog 已接）。**

理由:15 层愿景的每一层都假设"用户在用前一层产生的数据"。没有用户,Layer 1 的记忆、Layer 14 的教练、Success Engine 全是空转。这个项目现在最贵的不是代码,是真实使用。

---

## 2. 分阶段大纲

### Stage A — "Brain 开始记住"（OS 3.6-3.7,约 4-6 周工程量）

主题:Layer 1 从骨架变活体 + Layer 8 长全。

- **A1 Business Memory v1**:把用户在系统里的真实行为（任务完成、内容发布、lead 变化、讨论内容）写进 business-brain 的 memory 存储;推荐卡片和讨论开始引用"上周你做了什么"
- **A2 Command Center 长全**（Layer 8 完整版）:Business Score 卡、Today's Mission 与推荐卡合并信息层级（消除现在"两个声音"问题）、Weekly Review 雏形（Layer 9 借壳先行）
- **A3 Business Twin v1**:AI Interview + Brand DNA 的存量数据 → Twin 初始画像;讨论的 system prompt 注入 Twin 摘要（个性化第一步）
- **⭐ 结果闸门 A**:≥10 个真实用户完成 onboarding 且周活跃,dashboard 推荐点击率可查
- 并行获客轨（非工程）:Steven 用自己的 Herbalife/团队圈子做种子用户——**产品的目标客群就是你自己的人脉网,这是你相对任何竞品的唯一不公平优势**

### Stage B — "Brain 开始干活"（OS 3.8-3.9）

主题:Layer 4/5 的存量功能接上 Brain——从"工具箱"变"参谋部"。

- **B1 Creative Studio 个性化**:content/video 生成注入 Twin + Memory 上下文（"按你的品牌声音和上周表现建议今天发什么"）,产出物回写 Content Memory
- **B2 Growth 推荐化**:AI Funnel/Lead Magnet/Webinar Recommendation——decision-brain 已有的引擎接到这三个存量模块
- **B3 Relationship 雏形**（Layer 11 借壳）:CRM 的 lead 数据 → Customer Memory 首版,推荐开始出现"该跟进谁"
- **⭐ 结果闸门 B**:用户经 AI 建议产出的内容/漏斗占比可测,≥N 用户为此续用

### Stage C — "Brain 开始成交"（OS 4.0,大版本）

主题:Layer 7 WhatsApp Revenue Engine——对你的客群这是付费意愿最强的一层。

- **C1 WhatsApp AI Reply**（走官方 Business API,human approval 默认开）
- **C2 AI Objection Handling + Conversation Summary**,回写 Customer Memory
- **C3 计费闸门**:saas/billing 模块激活,这一层开始收钱——免费层到此为止
- **⭐ 结果闸门 C**:首批付费用户;此时才值得谈规模化

### Stage D — "Brain 开始教练"（OS 4.1+）

主题:Success Engine——roadmap 里你自己点名的最大护城河。

- 用户设定目标（月收入/招募/内容量）→ decision-brain + learning-system 每日动态重排 Today's Mission → Weekly/Monthly Review 闭环（Layer 9+14 合体）
- AI Reflection:每周"哪里落后了、为什么、下周怎么调"
- 前置依赖:Stage A 的 Memory 至少积累一个季度的真实行为数据——**这就是为什么 Success Engine 不能提前做**

### Stage E — 待验证区（有付费规模后再评估）

- Layer 13 Agent Workforce（multi-agent 编排,packages/agents 骨架已在）
- Layer 15 Marketplace、Layer 14 Certification
- Layer 6 Trend Intelligence 的降级版（用户手动贴 URL → AI 分析)
- Layer 10 Digital Presence audit（同样受外部数据限制）

---

## 3. 贯穿轨道（每个 Stage 都带一点,不单独立项）

1. **Runtime 迁移按需牵引**:哪个模块被 Stage 需求碰到,哪个迁移+UI 收编（现行策略延续;不追求 68/68）
2. **E2E 随功能增长**;visual QA 截图进 nightly（Stage A 落地）
3. **安全/规模化闸门挂在结果闸门上**:用户 >50 → 备份演练 + RLS 审计;付费启动 → 渗透测试级 review;不提前做
4. **AI 成本仪表**:router-advisor 的 costsByTenant 补全(T1 审计遗留),Stage C 前必须能看清每租户成本
5. **每 Stage 收官保持现有纪律**:Blueprint → task → review → audit → RC → tag

---

## 4. 优化 / 增加 / 拿掉

### 优化（现有东西做对）
- 推荐卡 vs Mission 卡的"两个声音"→ Stage A2 合并信息层级
- ai router 成本可见性(costsByTenant)补全
- onboarding 流程按"10 分钟到第一个 AI 推荐"重新校准——现在的 Journey 偏长,种子用户会流失在路上
- 2 处 legacy `generateWithFallback` 调用点收编进 router(T1 审计遗留)

### 增加（愿景里没有但必需）
- **产品分析闭环**:PostHog 事件设计(激活/留存/推荐点击/讨论轮次)——结果闸门的度量地基,Stage A 第一个 task
- **数据备份与恢复演练**:Supabase 生产库目前无演练过的恢复路径,用户 >0 后这是最大单点风险
- **用户反馈进入循环**:admin/feedback 模块已在,接一条"反馈 → 每周 triage → task"的流程
- **获客里程碑进 roadmap**:非工程项写进 Stage 闸门,防止"再做一层就有用户了"的自我安慰

### 拿掉 / 降级（明确说不）
- ❌ Layer 6 各平台 viral 抓取:ToS + 反爬 + 成本,原形态放弃;保留"贴 URL 分析"降级版进 Stage E
- ❌ 68 模块全量 runtime 迁移目标:按需迁移已被证明是对的,把"全量"从任何目标里删掉
- ❌ Marketplace/Certification 在有付费规模前的任何投入
- ⬇️ franchise / expansion / team-engine 等存量模块:冻结不投入,Stage C 后按付费用户需求复活或归档
- ❌ 每 feature 一份 audit 的旧治理形态不回潮:per-release audit 已定型

---

## 5. 一页时间观

```
now ──► Stage A(OS 3.6-3.7) ──► 闸门A:10 真实周活 ──► Stage B(3.8-3.9)
        Brain 记住                                    Brain 干活
                                                        │
   Stage E ◄── 闸门C:首批付费 ◄── Stage C(4.0) ◄── 闸门B:AI 产出占比
   待验证区                        Brain 成交(收钱)
        │
        └──► Stage D(4.1+) Success Engine —— 护城河,需要 Memory 数据积累
```

工程节奏参照 OS 3.3-3.5 实测:一个 Stage ≈ 2-3 个 Blueprint 周期。**但从 Stage A 起,日历时间由用户和数据决定,不由代码决定。**
