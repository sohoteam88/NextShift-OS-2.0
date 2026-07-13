# C1 — Command Center 信息架构决定（一页纸，待 Steven 确认）

Version: 1.0（草案）
Date: 2026-07-13
Author: Claude（Architecture / Orchestration）
状态: **待 Steven 确认** —— 确认后才能让 Codex 进入实现阶段（OS 3.7 blueprint C1 的硬性要求）

---

## 1. 先说一个代码里查到的事实，这决定了整个方案

`TodayRecommendationCard` 和 `AICommandCard` 不只是"看起来重复"——它们经常字面上是同一件事的两种转述。`recommendation-service.ts` 的规则兜底路径（`resolveColdStartRule`）在分析信号不足时，直接把 mission-engine 的 `context.mission.currentMission`/`priorityAction` 的标题和路由塞进推荐卡；即使走 decision-brain 引擎打分路径，输入的元数据也来自同一个 mission 上下文。也就是说，多数情况下用户看到的是：同一个"今天该做什么"，被两张卡片用不同的措辞、不同的视觉语言各讲了一遍。

真正会分叉的情况：decision-brain 引擎路径独立打分后，可能给出跟 mission 当前任务不同的建议（这是"两个声音"里少数真正有价值的分歧信号，不是噪音）。

`packages/domain` 里已有的合并先例（`business-command-center-v1.ts`）对这两种输入有两种不同处理方式，不是同一套逻辑：`createBusinessScore()` 把两者**平均成一个分数**；`createRecommendationFeed()` 则是把两者**并列列出、各自标注来源**，不做去重或优先级判断。这两个先例本身就说明"合并"不等于"平均"或"选一个"，要看信息类型。

## 2. 决定

**主线索是 Mission（`AICommandCard` 的内容），Recommendation 卡片的"为什么"（`explain`/`rationale`）被吸收进 Mission 卡片的 whyThis/whyNow 区块，不再单独起一张卡片。**

理由：`AICommandCard` 已经有完整的执行细节（当前步骤、进度、完成清单、下一步检查点），这是用户真正要"做"的东西；`TodayRecommendationCard` 在多数情况下只是同一件事的另一种措辞，唯一的独有价值是"和 AI 讨论"入口和 decision-brain 独立打分时的分歧信号。两者都可以嫁接到 Mission 卡片上，不需要保留成第二张卡片。

## 3. 新的信息层级（从上到下）

```
BusinessScoreCard（已完成，C0 交付，不变）
    ↓
统一的 "Today" 卡片：
  - 顶部：todayMission（沿用 Mission 现有的大标题）
  - 紧跟一行来源说明：如果 decision-brain 引擎给出的建议与 mission 当前任务一致 → 不额外提示；
    如果分叉 → 显式展示一条"AI 另有建议"的次要提示条（不是新卡片，是主卡片内的一个区块），
    带一个次要 CTA 可以切换查看该建议的 explain/rationale
  - whyThis / whyNow / whyNotOthers 区块：保留 Mission 现有结构，
    当 decision-brain 有 explain/rationale 且与 mission 一致时，两者的文案合并显示，不重复展示两段相似的话
  - "和 AI 讨论" 入口：从 Recommendation 卡片移到这里，锚定在 whyThis 区块下方，
    讨论的 5 轮上限、discuss API 调用不变
  - 当前步骤 / 进度 / 完成清单 / 执行步骤 / 优先级 / Gap / 下一里程碑：Mission 卡片现有结构完全保留
    ↓
JourneyProgressCard + MomentumCard（不变）
```

## 4. 数据请求怎么合并

`useDashboardMission()`（`/api/v1/dashboard/projection`）和 recommendation 的 `/api/v1/dashboard/recommendation` 目前是两次独立 fetch，各自 loading/error 状态不同步，是"两个声音"在工程上的直接体现（用户可能看到一张卡片加载完了、另一张还在转圈）。C1 实现时把两次请求改成并行发起（`Promise.all` 或等效方式），但**不要求合并成一个后端 endpoint**——decision-brain 和 mission-engine 仍是两个独立服务，只是前端统一等两者都返回后再渲染成一张卡片，其中一个失败时对方仍可用（比如 mission 拿到了、recommendation 拿不到，就不显示"AI 另有建议"区块和讨论入口，不是整卡报错）。

## 5. Non-goals（这份决定不包括的）

- 不重新设计视觉样式（配色、间距、字号延续 Mission 卡片现有的设计系统组件，不是重新画一版 UI）
- 不改变 decision-brain 或 mission-engine 任何一方的后端计算逻辑，只改前端信息呈现层级
- 不删除 recommendation-service.ts 或它的 API 路由——讨论入口仍然调用同一套 API，只是挂载位置从独立卡片改为 Mission 卡片内的一个区块
- 不处理"AI 另有建议"分叉情况以外的边界情况优化（比如两者都失败、都为空等），这些走各自现有的 fallback（`MissionEngineFailure`、recommendation 现有的错误态）

## 6. 需要 Steven 确认的两个具体判断

1. **主线索选 Mission 而不是 Recommendation**——认可吗？（理由见第 2 节：Mission 有完整执行细节，Recommendation 多数时候只是转述）
2. **分叉时的处理方式**——decision-brain 引擎给出跟 mission 不同的建议时，展示成"主卡片内的次要提示条"而不是恢复成第二张卡片——认可吗？

如果这两点确认无误，Codex 执行时会拿到这份文档作为实现依据，不再自由发挥信息架构。
