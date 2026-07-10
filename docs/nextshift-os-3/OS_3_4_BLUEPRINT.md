# NextShift OS 3.4 Blueprint — Business Brain Becomes Visible

Version: 1.0
Status: Draft — awaiting Steven approval
Date: 2026-07-10
Author: Claude (Architecture / Orchestration)
Baseline: `v3.3.0-rc1` + PR #23-#25（治理瘦身、E2E 真门禁 23/23、admin guard 补齐）

---

## 1. OS 3.3 证明了什么

OS 3.3 把"新架构能不能进产品"变成了已回答的问题：adapter 工厂是类型强制的标准、2 个 pilot 有真实调用点、CI 是实跑的门禁（E2E 23/23）、治理开销降到了可持续水平。

但用户至今看不到任何变化——flag 全部 off，Business Brain 的输出没有出现在任何界面上。

## 2. OS 3.4 的一句话目标

**让用户第一次"看见" Business Brain：dashboard 上出现一张由 decision-brain 驱动的 AI 推荐卡片，且其数据链路（5 个模块）全部 runtime 化。**

## 3. Non-Goals（明确不做）

- 不做 68 模块全量 runtime 迁移（只做 Command Center 消费链）
- 不做全局 UI 大翻新（对齐策略见 Workstream C，跟着迁移走）
- 不做 Layer 6 Trend Intelligence（外部数据依赖未解决，维持 P2）
- 不做 Marketplace / Learning Center（P2 不变）
- 不引入新的治理文档类型

---

## 4. Workstream A — Command Center 第一切片（Layer 8）

用户可见目标：dashboard 顶部出现 **Today's Recommendation** 卡片：

- 内容：decision-brain 的 recommendation + confidence score + explain（"为什么推荐这个"）
- 数据源：经 runtime adapter 的 mission/business-state/revenue/analytics 上下文
- Flag：`NEXT_PUBLIC_ENABLE_COMMAND_CENTER`（默认 off，注册进 runtime-flags.ts）
- 交互最小集：查看推荐、展开解释、跳转到对应模块执行——不做对话，不做多卡片流

**UI 铁律**：此切片 100% 使用 `@/components/ui` + tailwind token，零任意值逃逸——它是后续 UI 对齐的样板间（参照第 6.4 节）。

任务切分（每个独立 PR）：

| # | 任务 | 依赖 |
|---|---|---|
| A1 | recommendation 数据通路：dashboard service 经 decision-brain adapter 取推荐（flag off 时返回空,卡片不渲染） | B1 |
| A2 | Today's Recommendation 卡片 UI + explain 展开 | A1 |
| A3 | E2E：flag on 时卡片渲染 + 跳转链路用例 | A2 |

## 5. Workstream B — Runtime 消费链迁移

按 Command Center 数据依赖排序,每模块一个 PR,全部走 `createRuntimeAdapter()` 工厂 + flag 默认 off + Standard 的 Code Review Checklist：

| # | 模块 | 说明 |
|---|---|---|
| B1 | mission-engine | Command Center 的核心数据源（Today's Mission）|
| B2 | business-state | Business Score / 状态上下文 |
| B3 | crm | Lead 上下文（Layer 7/11 的地基）|
| — | revenue-drivers / analytics | OS 3.3 已完成 ✓ |

每个 B 任务的验收固定为：type-check / test / packages test / build 全绿 + E2E 实跑全绿 + flag off 行为与基线一致 + 新增 1 条该模块的 e2e 用例。

**Flag 转正（graduation）**：B 系列完成后,单独一个 PR 把 `RUNTIME_REVENUE` / `RUNTIME_ANALYTICS` 默认值转为 on（生产验证 ≥ 1 周无 fallback warning 后删除 flag 与 legacy 路径——删除动作留给 OS 3.5）。

## 6. Workstream C — Hygiene / UX 轨道（穿插执行,不阻塞 A/B）

1. **eslint 边界生成器**：`scripts/generate-eslint-boundaries.ts` 生成 68 模块 override,CI 校验生成物与 .eslintrc.json 一致（防第 69 个模块漏加）
2. **D-001 关闭**：确认部署拓扑（Cloudflare / nginx）后统一限流 IP 头的取法
3. **CI actions 升级**：消除 Node.js 20 deprecation warning（checkout/setup-node/pnpm action 升版本）
4. **UI 对齐启动（不重构存量）**：
   - token 系统补厚：spacing / radius / 字号语义层进 tailwind.config
   - lint 新规：新增代码禁止任意值 Tailwind 与自造 Button/Card（warn 级）,记录基线（当前逃逸 3,519 / Button 5 套 / Card 24 套）只降不升
   - B 系列每迁移一个模块,该模块 UI 顺手收编到 `@/components/ui`
5. **E2E 扩容**：随 A/B 增长到 ≥ 30 用例；visual QA 截图脚本纳入 nightly（可选）

## 7. 执行顺序

```
Phase 1（并行）: B1 mission-engine + C1 生成器 + C3 actions 升级
Phase 2:        B2 business-state + A1 数据通路 + C4 token/lint
Phase 3:        A2 卡片 + B3 crm + C2 D-001
Phase 4:        A3 E2E + flag graduation PR + RC package
```

节奏参照 OS 3.3：每 PR 一 review，每 2-3 个 PR 一次 Claude Code audit（Round 3 / Round 4）。

## 8. 发布标准（v3.4.0）

全部满足才 tag：

1. `NEXT_PUBLIC_ENABLE_COMMAND_CENTER=on` 时 dashboard 渲染推荐卡片,E2E 有用例证明
2. 5/68 模块 runtime 化（B 系列全绿）
3. `RUNTIME_REVENUE` / `RUNTIME_ANALYTICS` 默认 on
4. E2E ≥ 30 用例实跑全绿；eslint 边界 warn ≤ 413（2026-07-10 修正：next lint 缓存导致旧基线少报，静态验证代码违规无增长）；UI 逃逸基线 ≤ 3,519
5. 两轮 Claude Code audit PASS,结论落库
6. Release package 按 OS 3.3 结构,canonical status 文档一次更新到位

**附带决定**：OS 3.4 开工时同步评估 `v3.3.0-rc1 → v3.3.0` 转正——rc 的两个理由（E2E 未实跑、覆盖 2/68）中前者已消除,可在 B1 合并后直接转正打 `v3.3.0`。

## 9. 风险

| 风险 | 缓解 |
|---|---|
| decision-brain 的推荐质量在真实数据前"空洞"（冷启动） | A1 允许 rule-based 兜底推荐（如"今天还没发内容"类规则）,PR 描述注明哪些是 LLM/规则 |
| mission-engine 是被依赖大户（被 39 处 import）,迁移面大 | B1 只做 adapter 接缝不动内部结构；边界 warn 数作为回归哨兵 |
| UI 样板间与存量视觉不一致产生"两张皮" | 接受短期不一致,这是既定策略；卡片风格以 token 为准 |
| flag graduation 后出现生产 fallback | 保留 legacy 路径至 OS 3.5,fallback warning 有日志可查 |

---

## Audit Result

（Round 3 / Round 4 由 Claude Code 填写,完整报告存 audit/ 目录）
