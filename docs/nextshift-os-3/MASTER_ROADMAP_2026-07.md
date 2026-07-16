# NextShift OS Master Roadmap — 从 v3.7.0 到完整愿景

Version: 1.2
Status: Approved by Steven — active governance baseline
Date: 2026-07-15
Author: ChatGPT Work (Architecture Governance), based on Claude's original roadmap
v1.2 增补: Claude (Orchestration) — 产品条件全景五项 + 小白北极星 + 三断点地图,经 Steven 逐项确认（2026-07-15 会话）
Baseline: `v3.7.0` at `28c077f`（Command Center + Business Memory + Business Twin v1；production health/version verification PASS）
Source: [LAYER_ROADMAP_P0.md](LAYER_ROADMAP_P0.md)（15 层愿景 + Top 10 + AI Success Engine）

---

## 0. 当前位置（对照 15 层愿景的诚实盘点）

| Layer | 愿景 | 现状 |
|---|---|---|
| 1 Business Brain | Twin/记忆/知识图谱 | ✅ Business Memory + Business Twin v1 已上线；真实使用数据仍待 Dogfood 累积 |
| 2 Decision Engine | 推荐/置信/解释 | ✅ 已上产品(推荐卡片),规则+引擎双路 |
| 3 Conversation | Business Discussion | ✅ 首切片已上(锚定推荐的 5 轮讨论) |
| 4 Creative Studio | 内容全家桶 | 存量功能多(content/video 模块),未经 Brain 个性化 |
| 5 Growth | Funnel/Webinar | 存量功能在,AI recommendation 未接入 |
| 6 Traffic/Trend | 各平台 viral 情报 | ❌ 外部数据无解,维持降级 |
| 7 Revenue/WhatsApp | AI 成交引擎 | whatsapp-ai 模块存量在,AI Reply 未激活 |
| 8 Command Center | AI 每日任务中心 | ✅ Business Score、统一 Mission/Recommendation、Weekly Review 已上线 |
| 9-12 BI/Presence/Relationship/Knowledge | | 存量模块散在,未串联 |
| 13-15 Workforce/Learning/Marketplace | | P2 未动(正确) |
| Success Engine | 目标→每日动态策略 | 未动——**这是终局** |

工程基线:`v3.7.0` production、5/68 模块按需 runtime 化、Business Memory/Twin/Command Center 上线、E2E 与 release audit 纪律持续执行。**当前最大空白不是继续增加功能，而是核心工作流尚未达到 Steven 可连续使用的标准。**

### 0.1 一站式愿景链的三个断点（v1.2,决定"一站式"是否成立）

愿景链:起号 → 文案+图 → 视频 → 7/30 天规划 → 广告 → 回报建议 → 漏斗/webinar → CRM → WhatsApp 成交。逐环盘点后,断的是三处——**接上这三处,一站式才成立;其余皆为增强**:

1. **图像断点**:系统零图像能力,而 FB/IG/XHS 无图不能发——文案环因此实际断裂 → Stage B 修（B4）
2. **Lead 进水管断点**:漏斗页→lead→CRM 的通道未接,CRM 是空水池 → Stage B 修（B3 前置）
3. **广告回报断点**:广告生成有存量,投后成绩与建议为零 → Stage C 修（C0 桥接版,不依赖广告平台 API）

---

## 1. 总原则:从"造功能"切换到"结果闸门"

OS 3.3-3.5 的闸门是工程性的（测试绿、审计过）。从 Stage A 起,每个 Stage 增加一个**结果闸门**——不满足就不开下一个 Stage 的新功能,只做打磨:

> **Stage 结果闸门 = 先通过 Steven Dogfood，再有 N 个真实用户使用上一 Stage 核心能力，且留存/激活数据可查（PostHog 已接）。**

理由:15 层愿景的每一层都假设"用户在用前一层产生的数据"。没有用户,Layer 1 的记忆、Layer 14 的教练、Success Engine 全是空转。这个项目现在最贵的不是代码,是真实使用。

### 1.5 产品北极星:小白用户七条件（v1.2,所有 Stage 的验收滤镜）

目标用户是**完全不会 social media marketing 的小白**(典型:直销伙伴,手机优先,中/马/英三语市场)。任何功能交付前用这七条过滤:

1. **永远只有一个下一步**——打开系统只见"今天做这件事";功能随旅程解锁,绝不一次全摆(U2/U3 的北极星)
2. **产出是成品不是素材**——文案+配图+hashtag+发布说明,按平台裁好,一键复制;小白没有组装能力
3. **手机优先**——核心闭环必须拇指可完成;**列入 Dogfood 强制条件**(Steven 手机跑一周)
4. **失败安全**——自动保存、可撤销、永远找得回;丢一次内容=永久流失一个用户
5. **教练语气,不是数据面板**——每个数字配一句"所以呢,明天做什么"(Success Engine 的语气层现在就做)
6. **合规护栏**——健康品类的疗效/收入声明是封号雷区;生成器内置声明安全规则+发布前检查。**既是护栏也是卖点,竞品皆无**
7. **用量可见**——AI credits 用户端可见(服务端配额已有,Stage C 收费前必须补 UI)

### 1.6 招募/零售隔离原则（v1.2,一等数据维度）

招募与零售是两门生意,混合互杀(零售客户惧"拉人头",招募对象不吃产品话术)。隔离必须贯穿数据链,不是 UI 开关:

- **立即执行的 schema 决定**:`mode`(retail/recruitment)成为一等字段——content/funnel/lead/mission/memory 事件入库即打标(越早定,数据越干净)
- 贯穿七层:Twin 双画像、内容生成双 prompt 体系(招募侧收入声明护栏更严)、双内容日历(onboarding 增加"一号混发 80/20 或双号"策略题)、双漏斗模板、**CRM 双管道**(客户:lead→试用→成交→复购→转介绍;伙伴:好奇→说明→跟进→加入→带教)、双异议库、Business Score 双子分
- **唯一不隔死的:毕业桥**——复购 N 次/主动转介绍的客户,AI 提示"适合聊事业",一键带完整历史升入伙伴管道。隔离为了话术不串,不是拆桥

---

## 2. 分阶段大纲

### Stage A — "Brain 开始记住"（OS 3.6-3.7，工程交付完成）

主题:Layer 1 从骨架变活体 + Layer 8 长全。

- **A1 Business Memory v1**:把用户在系统里的真实行为（任务完成、内容发布、lead 变化、讨论内容）写进 business-brain 的 memory 存储;推荐卡片和讨论开始引用"上周你做了什么"
- **A2 Command Center 长全**（Layer 8 完整版）:Business Score 卡、Today's Mission 与推荐卡合并信息层级（消除现在"两个声音"问题）、Weekly Review 雏形（Layer 9 借壳先行）
- **A3 Business Twin v1**:AI Interview + Brand DNA 的存量数据 → Twin 初始画像;讨论的 system prompt 注入 Twin 摘要（个性化第一步）
- **Stage A 工程状态**：A1/A2/A3 已随 `v3.6.0`–`v3.7.0` 发布；工程完成不等于产品闸门完成。
- **⭐ Dogfood 闸门（获客前置）**：Steven 连续 7 天用真实业务完成「生成 → 编辑 → 保存 → 复制/发布」，且愿意继续使用。
- **⭐ 结果闸门 A**：Dogfood PASS 后，≥10 个真实用户完成 onboarding 且周活跃，dashboard 推荐点击率可查。
- 获客轨（非工程）：闸门开放后，Steven 用 Herbalife/团队圈子招募种子用户。

### Stage A+ — "产品先能用"（OS 3.8 Product Usability Recovery）

主题：修复「生成 → 编辑 → 保存 → 复制/发布」闭环，并收敛用户信息架构；不提前扩建 Stage B 功能。

- **E1 Content 编辑闭环**：生成结果可编辑、可复制，沿用 Brand Builder 已验证的交互范式。
- **E2 Content Library**：已保存内容可查看、再编辑、删除、复制。
- **E3 范式推广**：Video 补保存；Lead Magnet/Webinar 接入统一编辑与留存范式。
- **U1 死代码治理**：先盘点再删除重复/孤儿组件。
- **U2 信息架构一页纸**：45 个 auth routes 按保留/合并/隐藏分类，Steven 批准后才能实施。
- **U3 页面收敛**：依据批准后的 IA 统一导航与页面。
- **证据**：[Product Usability Audit 2026-07](reviews/PRODUCT_USABILITY_AUDIT_2026-07.md)

### Stage B — "Brain 开始干活"（OS 3.9+，须通过 Dogfood 与结果闸门 A）

主题:Layer 4/5 的存量功能接上 Brain——从"工具箱"变"参谋部"。

- **B1 Creative Studio 个性化**:content/video 生成注入 Twin + Memory 上下文（"按你的品牌声音和上周表现建议今天发什么"）,产出物回写 Content Memory
- **B2 Growth 推荐化**:AI Funnel/Lead Magnet/Webinar Recommendation——decision-brain 已有的引擎接到这三个存量模块
- **B3 Relationship 雏形**（Layer 11 借壳）:CRM 的 lead 数据 → Customer Memory 首版,推荐开始出现"该跟进谁"。**v1.2 增补**:B3 前置修 lead 进水管(漏斗页→lead→CRM 通道,断点 2);双管道按 §1.6 mode 隔离 + 毕业桥
- **B4 配图模板**（v1.2,断点 1）:程序化模板图——品牌色+文案上图+用户照片框,按平台尺寸输出;先模板后 AI 生图(便宜、稳定、必然 on-brand)。无图则 FB/IG/XHS 内容环不成立
- **B5 起号引导**（v1.2）:FB/IG/TikTok/XHS 四平台开号带截图勾选式教程,journey 引擎承载;低工程高价值,内容 AI 起草人工核对,可在 Dogfood 期并行制作
- **B 全程**:B1 生成按 §1.6 双 prompt 体系 + §1.5-6 合规护栏首版(内容侧)
- **⭐ 结果闸门 B**:用户经 AI 建议产出的内容/漏斗占比可测,≥N 用户为此续用

### Stage C — "Brain 开始成交"（OS 4.0,大版本）

主题:Layer 7 WhatsApp Revenue Engine——对你的客群这是付费意愿最强的一层。

- **C0 广告桥接**（v1.2,断点 3）:广告成绩**截图上传 → AI 读图给建议**——零平台 API 依赖(Meta Marketing API 审核重,不提前接),小白够用,马上能做。广告文案生成(存量 Ads Generator)同步接入合规护栏**硬闸**:疗效/收入声明检查不过不出稿
- **C1 WhatsApp AI Reply**（走官方 Business API,human approval 默认开;话术库按 §1.6 mode 分双异议体系;人肉桥接版——"AI 写话术你来发"——可在 Stage B 先行验证价值）
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
6. **合规护栏轨**（v1.2）:声明安全规则库(疗效/收入/前后对比)随每个生成面演进——Stage B 内容侧 warn,Stage C 广告/WhatsApp 侧硬闸;规则库本身是内容资产,AI 起草 Steven 核定
7. **mode 一等字段**（v1.2,§1.6）:自本决定起,新增 content/funnel/lead/mission/memory 数据入库必须携带 retail/recruitment 标;存量回填随 B1/B3 迁移顺路做
8. **教练语气层**（v1.2,§1.5-5）:所有用户可见数字必须配下一步建议;新增 UI 的验收项之一

---

## 4. 优化 / 增加 / 拿掉

### 优化（现有东西做对）
- 推荐卡 vs Mission 卡的"两个声音"→ Stage A2 合并信息层级
- ai router 成本可见性(costsByTenant)补全
- onboarding 流程按"10 分钟到第一个 AI 推荐"重新校准——现在的 Journey 偏长,种子用户会流失在路上
- 2 处 legacy `generateWithFallback` 调用点收编进 router(T1 审计遗留)

### 增加（愿景里没有但必需）
- **v1.2 五件**（详见 §0.1/§1.5/§1.6 及各 Stage 增补行）:配图模板(B4)、起号引导(B5)、合规护栏(贯穿轨 6)、截图式广告分析(C0)、招募/零售 mode 一等隔离(贯穿轨 7)
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
v3.7 ──► Stage A+(OS 3.8) ──► Dogfood 7天 ──► 闸门A:10真实周活 ──► Stage B(3.9+)
         产品能用                                             Brain 干活
                                                        │
   Stage E ◄── 闸门C:首批付费 ◄── Stage C(4.0) ◄── 闸门B:AI 产出占比
   待验证区                        Brain 成交(收钱)
        │
        └──► Stage D(4.1+) Success Engine —— 护城河,需要 Memory 数据积累
```

工程节奏参照 OS 3.3-3.5 实测:一个 Stage ≈ 2-3 个 Blueprint 周期。**但从 Stage A 起,日历时间由用户和数据决定,不由代码决定。**
