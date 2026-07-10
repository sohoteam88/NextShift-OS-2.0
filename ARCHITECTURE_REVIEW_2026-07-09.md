# NextShift OS 全项目 Architecture Review

Date: 2026-07-09
Reviewer: Claude (Cowork) — Architecture Review 角色
Executor: Codex（见文末行动项）
Code Audit: Claude Code（见文末检查点）
Scope: packages 分层、src 模块化单体、Runtime Adapter Standard、迁移路径可扩展性
Branch: `planning/os-3.3-runtime-platform` (HEAD: 780b8ef)

---

## 总评

| 领域 | 评级 | 一句话结论 |
|---|---|---|
| packages 分层与依赖方向 | 🟢 优 | 无环、方向正确、层次清晰 |
| Runtime Adapter Standard | 🟢 良 | 模式正确（strangler + flag + fallback），但按 68 模块扩展时需工具化 |
| src 模块边界 | 🟡 中 | 68 个模块结构惯例一致，但跨模块 import 无任何强制约束 |
| Runtime 包重复 | 🟡 中 | 存在两套 runtime 栈，其中一套近乎空壳 |
| 数据层 / 多租户 | 🟢 良 | schema 层隔离到位（97 处 tenantId），middleware 统一处理 |
| 迁移路径 | 🟡 中 | 方向对，但当前节奏下 68 模块迁移是数月工程,需要批量化策略 |

---

## 1. packages 分层：这是项目最强的部分

实测依赖图（无环 ✓，contracts/shared/domain 无任何反向依赖 ✓）：

```
shared (零依赖)
  └─ contracts
       └─ domain
            └─ application
  └─ event-bus
brains 层：
  business-brain  → shared, contracts, domain, event-bus
  decision-brain  → shared, contracts
  agents          → + business-brain, application
  execution-layer → + decision-brain
  learning-system → + business-brain, execution-layer
  capability-layer→ + application, execution-layer
runtime (零依赖，独立内核)
```

依赖方向完全正确：低层不知道高层，brain 层依赖 domain/contracts 而非相反，runtime 是零依赖内核。**这个结构可以支撑 Layer 1-15 roadmap，不需要推倒重来。**

## 2. 发现：两套 runtime 栈并存

- `packages/runtime`：真实实现（capability/context/diagnostics/event/kernel/permission/session/workspace，8 个子系统 + 完整测试）。src 的两个 pilot adapter 用的是它 ✓
- `packages/runtime-core` + `runtime-adapters` + `runtime-orchestrator` + `workspace-runtime`：四个包组成另一套栈，但 `runtime-core/src` 只有一个 `index.ts` —— **近乎空壳脚手架**，疑似早期规划残留

**风险**：后续 AI（Codex/Claude Code）接手时会困惑该用哪套，可能往空壳里写代码。

**建议**：二选一——(a) 删除空壳四件套（推荐，YAGNI）；(b) 若 orchestrator 是 OS 3.4 规划的一部分，在每个空壳包 README 顶部写明 "PLACEHOLDER — do not implement, use @nextshift/runtime"。

## 3. src 模块边界：惯例好，约束零

68 个模块内部结构惯例一致（components/services/schemas/types），这点难得。但跨模块直接 import 非常多且无任何强制：

| 被依赖最多的模块 | 被 import 次数 |
|---|---|
| @/modules/ai | 79 |
| @/modules/auth | 68 |
| @/modules/mission-engine | 39 |
| @/modules/brand-dna | 37 |
| @/modules/funnel | 31 |

`ai` 和 `auth` 实质上是共享基础设施却放在 modules 里；其余高频交叉引用意味着模块边界只是目录约定。eslint 配置最小化（仅 next/core-web-vitals），没有 import 边界规则。

**风险**：Adapter Standard 精心定义了 packages↔src 的接缝，但 src 内部 68 个模块互相穿透——迁移一个模块时无法确定它的真实依赖面。

**建议**（低成本高回报）：
1. 把 `ai`、`auth` 提升为 `src/core/`（或至少在文档中标记为基础设施模块，允许被依赖）
2. 加 `eslint-plugin-boundaries` 或 `import/no-restricted-paths`：模块只能 import 自己、core 模块和 `@/lib`——先设 warn 不设 error，压住存量不再恶化

## 4. Runtime Adapter Standard 评估

标准本身（RUNTIME_ADAPTER_STANDARD.md）质量高：flag 默认 off、legacy 优先、runtime 构建失败自动 fallback、DI 便于测试、职责边界明确（runtime 不碰 Prisma/auth/UI）。两个 pilot 忠实执行了标准。

三个扩展性问题：

**4a. 手写成本**：每个 adapter 约 100-150 行样板。68 个模块 × 每模块 1-3 个 capability ≈ 一万行以上的手写样板。
→ 建议：从 pilot 提炼 `createRuntimeAdapter()` 工厂函数进 `@nextshift/runtime`，把每个 adapter 压到 20-30 行配置；或写 codegen 脚本。**在第 3 个 adapter 之前做这件事**，否则后面 65 个都在复制粘贴。

**4b. 标准靠文档执行，不靠代码执行**：Codex 写第 10 个 adapter 时是否还遵守标准，取决于它有没有读那份 md。
→ 建议：把标准变成类型约束——工厂函数的签名强制 flag/fallback/DI 参数,不合规代码无法编译。这比任何 audit 都可靠。

**4c. flag 治理**：每模块一个 `NEXT_PUBLIC_ENABLE_RUNTIME_*` 环境变量,68 个模块后会有 68+ 个 flag。
→ 建议：现在就建一个 `runtime-flags.ts` 统一注册表（flag 名、owner、目标移除日期），避免 flag 债务。

**4d. 当前最紧迫**：两个 pilot adapter 在产品代码中零调用点（只有测试调用）。标准的 "UI → Adapter → Runtime" 流程实际上还没有任何 UI 走过。**下一步不是写第 3 个 adapter，而是让前 2 个接上真实调用点。**

## 5. 数据层 / 多租户

- Prisma 31 个模型、97 处 tenantId：隔离在 schema 层设计到位
- middleware 统一处理子域解析 + 安全头 + CORS 预检：正确
- Supabase(auth) + Prisma(data) 双轨是常见组合，无结构性问题
- 遗留提醒（来自 audit）：`images.remotePatterns` 全通配、check-slug/invite 缺限流

## 6. 迁移路径判断

当前节奏（1 pilot ≈ 2-3 天含 plan/review/archive）× 68 模块 ≈ 5-7 个月纯迁移。建议：

1. **不要全量迁移**。按 Layer roadmap 倒推：只有 Layer 1-3 + Command Center 需要的模块才走 runtime 化（估计 15-20 个），其余保持 legacy 直到有真实需求
2. 迁移顺序按"Layer 8 Command Center 消费链"排：mission-engine → business-state → analytics(已有) → revenue-drivers(已有) → crm
3. 每 5 个 adapter 做一次批量 review，替代每个 adapter 一轮 plan/review/archive 仪式

---

## 给 Codex 的行动项（按序）

| # | 任务 | 规模 |
|---|---|---|
| C1 | 给 revenue/analytics 两个 pilot adapter 接真实调用点（各选该模块一个 service 入口，flag on 时走 adapter） | 小 |
| C2 | 从两个 pilot 提炼 `createRuntimeAdapter()` 工厂进 `@nextshift/runtime`，重构两个 pilot 使用它 | 中 |
| C3 | 处理空壳包：删除或标记 runtime-core/runtime-adapters/runtime-orchestrator/workspace-runtime | 小 |
| C4 | 建 `runtime-flags.ts` flag 注册表 | 小 |
| C5 | eslint 加模块边界规则（warn 级）+ 收敛 remotePatterns + check-slug/invite 限流 | 小 |
| C6 | 根目录 Layer roadmap 文件移入 docs 并 commit | 小 |

每项独立分支 + PR，遵循 CODEX_EXECUTION_PLAN 的执行总则（禁 force push / 禁 tag / 禁删文件）。

## 给 Claude Code 的 Audit 检查点（C1-C6 完成后）

1. flag off 时两个 pilot 模块行为与基线 100% 一致（回归测试）
2. flag on 时真实请求链路走通 adapter → runtime（集成测试证据）
3. `createRuntimeAdapter()` 工厂的类型签名是否强制了标准要求的 flag/fallback/DI
4. `pnpm -r test` + `pnpm type-check` + `pnpm build` 全绿
5. eslint 边界规则不产生 error（存量 warn 可接受），warn 总数记录为基线
6. 空壳包处理后无残留 import 引用

审计结论追加到本文件末尾的 "Audit Result" 章节，不要另开新文档。

---

## Audit Result

### Round 1 — PR #16-#19（C1 / C1.5 / C1.6 / C2）

Date: 2026-07-09
Auditor: Claude Code
HEAD: `1168dc3`
Verdict: **PASS** — 无阻塞问题

完整报告：[audit/OS33_C1_C2_PR16_PR19_CODE_REVIEW_REPORT.md](audit/OS33_C1_C2_PR16_PR19_CODE_REVIEW_REPORT.md)

检查点结论：CP1 flag-off 基线一致 ✓（逐字段对照 `4e13568` 基线）；CP2 flag-on 链路走通 ✓；CP3 工厂类型签名强制 flag/fallback/DI ✓；CP4 全部验证命令通过 ✓（type-check 0 错、345 tests passed、build clean）；CP5 eslint 基线 0 errors / 4 warnings（既有，与 OS 3.3 无关）；CP6 顺延至 C3。

Non-blocking advisories（转入后续任务）：

- **C-001**：工厂类型只能强制 `isEnabled` 存在，不能强制它调用真实 flag。→ 纳入 Pilot 3 起的 code review 检查清单
- **C-002**：`createWarningPayload` 收到完整 input，未来 adapter 若直接 spread 会把 tenantId/userId 泄进日志。→ 在 RUNTIME_ADAPTER_STANDARD 补充说明（C3 顺手项）

### Round 2 — PR #20-#21（C3 / C4-C6）

Date: 2026-07-10
Auditor: Claude Code
HEAD: `888b04e`
Verdict: **PASS** — 无阻塞问题

完整报告：[audit/OS33_C3_C6_PR20_PR21_CODE_REVIEW_REPORT.md](audit/OS33_C3_C6_PR20_PR21_CODE_REVIEW_REPORT.md)

检查点结论：CP6 四个 legacy 包 README 与实际导出逐一核对属实，src 零引用 ✓；C4 flag 注册表 `=== 'true'` 语义等价、345 tests 零改动 ✓；C5 图片域名清单经全仓库 grep 验证完整、限流 key 构造正确（invite 按 IP+code 双维度）✓；eslint 基线 192 warn / 0 error 复现、68/68 模块覆盖 ✓；C6 roadmap 落库、docs:links 1011 文件通过 ✓；Round 1 承诺项 C-001 / C-002 均确认关闭 ✓。

Non-blocking advisory：

- **D-001**：限流的 IP 取自 `x-forwarded-for` 首位，多级代理/CDN 下可被伪造。→ 部署拓扑确认后处理（Cloudflare 用 `cf-connecting-ip`；自管 nginx 确认 replace 模式）。纳入生产加固清单，不阻塞 v3.3.0。

**OS 3.3 C 系列（C1-C6）全部完成并通过两轮审计。**
