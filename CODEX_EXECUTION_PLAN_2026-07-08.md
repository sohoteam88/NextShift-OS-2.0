# NextShift OS 优化执行计划（Codex 专用）

Version: 1.0
Date: 2026-07-08
Executor: Codex
Approver: Steven
Base Branch: `planning/os-3.3-runtime-platform`

---

## 执行总则（每个 Phase 都必须遵守）

1. **每个 Phase 独立分支、独立 PR**，命名 `fix/plan-phase-{N}-{slug}`。Phase 之间不得混合提交。
2. **完成一个 Phase 后 STOP**，等待 Steven 审批后再进入下一个 Phase。
3. **禁止操作**：
   - 禁止 `git push --force`、禁止删除远端分支（Phase 5 仅输出清单，由 Steven 手动删）
   - 禁止创建或推送任何 release tag
   - 禁止修改 `prisma/`、`.env*`、CI 配置、生产部署文件
   - 禁止删除任何文件——只允许 `git mv` 到 `archive/`
4. **每个 Phase 结束前必须运行验证命令**（见各 Phase 的 Acceptance），任一失败则不得标记完成。
5. 如遇计划未覆盖的情况，停止并报告，不要自行发挥。

---

## Phase 0：基线快照（只读，无风险）

**目标**：留存回滚参照。

Steps:

1. 记录当前 HEAD commit hash 及各分支状态到 `docs/nextshift-os-3/plan-execution/BASELINE_2026-07-08.md`。
2. 运行并记录结果：`pnpm type-check`、`pnpm test`、`pnpm docs:links`。
3. 若基线本身有失败项，如实记录（不修复），后续 Phase 不得让失败数增加。

**Acceptance**：BASELINE 文件存在，包含 commit hash + 三条命令的输出摘要。

---

## Phase 1：状态文档修复（低风险，纯文档）

**目标**：消除 status 漂移，恢复"单一事实来源"。

Steps:

1. 更新 `docs/nextshift-os-3/PROJECT_STATUS.md`：
   - Active Planning Branch 改为 `planning/os-3.3-runtime-platform`
   - Last Updated 改为执行当日
2. 同步更新 `platform/status.md`、`docs/nextshift-os-3/REPOSITORY_STATUS.md`、`docs/nextshift-os-3/NEXT_ACTION.md`、`docs/nextshift-os-3/AI_HANDOVER.md` 中所有指向 `os-3.1-mvp-governance` 的"当前分支"字段。
3. 将根目录 untracked 文件 `🧠 Layer 1：Business Brain（核心大脑）【P0】.md` 移动到 `docs/nextshift-os-3/LAYER_ROADMAP_P0.md`（重命名为 ASCII 文件名），并在 `docs/nextshift-os-3/MASTER_INDEX.md` 中登记。
4. `NEXT_ACTION.md` 的 Current Next Action 更新为：完成 OS 3.2 release audit（Phase 2）。

**Acceptance**：`pnpm docs:links` 与 `pnpm docs:navigation` 通过；`grep -r "os-3.1-mvp-governance" docs/nextshift-os-3/*.md` 仅剩历史记录类引用（不出现在"当前状态"字段）；根目录无 untracked 中文文件名 md。

---

## Phase 2：OS 3.2 收尾（低风险，文档 + 审计）

**目标**：关闭挂起的 release 循环，避免 3.1/3.2/3.3 三线半开。

Steps:

1. 按 `docs/nextshift-os-3/NEXT_ACTION.md` 原清单逐项核对 `releases/OS_3_2_DEVELOPER_PLATFORM/` 包完整性。
2. 更新 `FINAL_VERIFICATION.md` 为当前验证证据。
3. 输出 audit 结论到 `docs/nextshift-os-3/releases/OS_3_2_DEVELOPER_PLATFORM/AUDIT_RESULT.md`：PASS 或 FAIL + 缺陷清单。
4. **不打 tag、不做生产审批**——该决定留给 Steven。

**Acceptance**：AUDIT_RESULT.md 存在且结论明确；无 tag 被创建（`git tag` 输出与基线一致）。

---

## Phase 3：治理瘦身（中风险，只移动不删除）

**目标**：文档/治理开销降到 1/3，降低后续 AI 上下文噪音。

Steps:

1. 新建 `archive/audit-history/`，将 `audit/` 中 **30 天前**（< 2026-06-08）的条目 `git mv` 过去；30 天内的保留。
2. 将 `governance/`、`platform/`、`releases/` 三个目录中的 4 件套（COMPATIBILITY_MAP / MIGRATION_MANIFEST / ROLLBACK_CHECKLIST / VALIDATION_CHECKLIST）每组合并为单份 `MIGRATION_RECORD.md`（保留全部内容，只做合并），原文件 `git mv` 到 `archive/governance-history/`。
3. 在 `docs/nextshift-os-3/README.md` 声明新规则：活文档仅 PROJECT_STATUS / NEXT_ACTION / CAPABILITY_STATUS 三份；audit 粒度从 per-feature 改为 per-release。
4. 修复因移动产生的断链。

**Acceptance**：`pnpm docs:links` 通过；`git log --diff-filter=D` 无新增删除（全部是 rename/move）；audit/ 条目数明显下降且被移条目可在 archive/ 找到。

---

## Phase 4：架构接线试点（最高价值，中高风险）

**目标**：让 `@nextshift/decision-brain` 第一次跑进真实产品，打通 packages → src 的通路。**这是本计划最重要的 Phase。**

范围锁定：**只接一个点**——CAP-005 Revenue 相关模块调用 recommendation-engine。

Steps:

1. 阅读 `packages/decision-brain/src/recommendation-engine/` 的公开 API 与其测试，确认输入输出契约。
2. 在根 `package.json` 或 tsconfig path（已存在 `@nextshift/decision-brain` 映射）基础上，确认 Next.js 可解析该包（必要时在 `next.config.mjs` 加 `transpilePackages`）。
3. 在 `src/modules/` 中选择 CAP-005 对应模块（优先 `business-intelligence` 或 revenue 相关模块），新建一个 thin adapter：`src/modules/{module}/services/decision-brain-adapter.ts`，调用 recommendation-engine 生成推荐，并透出 confidence score 与 explain 字段。
4. 在该模块现有 UI 中新增一个最小展示位（一个卡片或面板即可），feature flag 控制：`NEXT_PUBLIC_ENABLE_DECISION_BRAIN`（默认 off）。
5. 为 adapter 写单元测试。
6. **禁止**在本 Phase 重构 src 现有代码、禁止接入其他包（business-brain、runtime 等留待后续）。

**Acceptance**：`pnpm type-check`、`pnpm test`、`pnpm build` 全部通过；flag off 时产品行为与基线完全一致；flag on 时 adapter 测试证明调用链真实走通；`grep -r "@nextshift/decision-brain" src` 至少 1 处命中。

---

## Phase 5：分支清理（仅报告，零风险）

**目标**：给 Steven 一份可执行的清理清单，Codex 不执行删除。

Steps:

1. 对每条本地/远端分支输出：最后 commit 日期、与 main 的 ahead/behind、是否已合并。
2. 生成 `docs/nextshift-os-3/plan-execution/BRANCH_CLEANUP_PROPOSAL.md`，分三类：可安全删除 / 建议保留 / 需 Steven 判断。
3. 附上每条分支对应的删除命令（供 Steven 手动复制执行）。

**Acceptance**：报告存在；`git branch -a` 输出与 Phase 开始时一致（未删任何分支）。

---

## Phase 顺序与依赖

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

- Phase 1/2 可在同一天完成；Phase 3、4 各自独立 PR。
- Phase 4 若受阻（如包 API 与产品需求不匹配），输出阻塞报告后可先做 Phase 5，不要强行接线。

## 回滚策略

- 每个 Phase 一个 PR ⇒ 回滚 = revert 该 PR。
- Phase 3 全部为 move 操作 ⇒ 回滚 = `git mv` 反向移回。
- Phase 4 有 feature flag ⇒ 生产回滚 = flag off，无需改代码。
