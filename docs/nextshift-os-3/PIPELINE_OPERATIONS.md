# Pipeline 操作正典(新窗口/新 agent 必读补充)

> 用途: pipeline 的存在、位置与操作规矩。工具脚本本体在 `chore/os-pipeline-tooling` 分支(刻意不并入 main),因此 main 上需要这份指针文档。
> 定稿: 2026-07-31(Fable)

## 它是什么

三角流程的自动化循环:**Step 1 选题(读 Blueprint/工单表)→ Step 2 Codex 执行 → Step 3 本地验证 → Step 4 自动 review → Step 5 合并+标记 → Step 6 周期性 audit**。Step 7/8(RC/tag/部署)已禁用——部署永远走 Final Release 审批链,与 pipeline 无关。

## 边界(哪层自动、哪层不自动)

- **自动**: 圈内的写码、验证、review、合并(普通项)
- **不自动**: 命中 `HUMAN_GATE_ITEMS` 的项(合规/安全类,如 G4/G5/SA1 类)在 Step 3 后自动暂停,PR 留 open 等 Fable 复审
- **永远人肉**: 发布链(request→review→approval→dispatch)、恢复演练、一切生产动作(AGENTS.md 第 5 条)

## ⚠️ 启动方式(同名不同物陷阱)

`scripts/os-pipeline/run-pipeline.sh` 在两处存在且**内容完全不同**:
- main 分支上的版本 = OS 3.8 时代遗留状态机,**不要用**
- 真身在独立 worktree:**必须从 `~/Documents/GitHub/nextshift-pipeline-tools` 启动**

```
cd ~/Documents/GitHub/nextshift-pipeline-tools   # 先确认 git status 干净
DISABLE_RC_TAG=true ./scripts/os-pipeline/run-pipeline.sh
```

脚本运行时会自己 cd 回主仓库对 main 操作。循环模式用 run-loop.sh(3 圈/日上限、连续 2 次 abort 自动停机)。

## 毕业制(新任务形态的接入节奏)

首圈监督(Steven 盯到 Step 5)→ 无人单圈 ×3 → 受限 loop。已毕业形态可直接无人圈;含 schema 迁移或新形态任务建议回退监督圈一次。

## 当前任务源

Blueprint 任务表 + `USER_SHELL_REBUILD_BATCH1_WORKORDERS_V1.md`(W1-W5)。`USER_SHELL_PERFORMANCE_WORKORDER_V1.md`(P1) 与 `SA1_RESET_TRANSACTION_TIMEOUT_WORKORDER_V1.md`(SA1/F-38) 现均暂缓，待新加坡迁移完成后重测再定，不进入调度任务源。调度裁决以 Fable 最新指令为准,记录落仓。

---

## 新增 Prisma 迁移的标准动作清单(2026-08-01 补,W1 撞墙后固化)

新增/修改一次 Prisma 迁移(即改动 `prisma/schema.prisma` 并生成新的
`prisma/migrations/<timestamp>_xxx/`),必须依次完成以下四步,缺一步 CI 会在
`production-readiness fixtures` 这一关拦下(报 `Prisma schema checksum drift`
或类似的 checksum/inventory 不一致错误)——这不是 bug,是"迁移登记制度"生效:

1. **`pnpm prisma migrate dev` 生成迁移文件**——正常 schema 改动流程,不手写 SQL 绕过

2. **`run-os38-production-migrations.sh` 登记**——生产迁移执行器持有一份写死的
   "路径 + sha256"清单(脚本头部),新迁移文件必须:
   - 新增一行路径变量指向该迁移文件
   - 新增一行对应的 sha256 常量(本机 `sha256sum` 现算,不可编造)
   - 若改动了 `schema.prisma` 本身,`schema_sha` 常量也要同步更新为新的真实哈希
   - 在 inventory 数组和校验区分别加一行

3. **`validate-production-readiness-contract.sh` 契约清单同步**——这份脚本独立
   持有一份"清单必须包含哪些路径"的断言(`for inventory_path in ...`),新迁移路径
   也要加进这份数组,否则第 4 步新增的镜像测试不会真正 fail-closed(即使 runner
   本身登记正确,这份 validator 仍会漏检"路径缺失"这个失败模式)

4. **`production-readiness.sh` fixture 镜像 + 计数断言**——为新迁移新增一条
   `missing_xxx_migration_rejected` 镜像测试(参照既有同类用例的写法:
   `new_fixture` → `perl` 替换路径模拟缺失 → `expect_reject`),并同步把文件末尾
   `pass_count` 的期望值 +1(这个数字是"测试用例总数"的自检,不是迁移条数,
   两者是不同维度,不要混淆)。若该迁移改动了会被 disposable fixture 数据库
   感知到的表/字段/类型,还需要在 fixture 的"回退到迁移前状态"那段 SQL 里
   补上对应的 `DROP ... IF EXISTS`,确保 rehearsal 真的从"迁移前状态"跑起,
   而不是空跑。

**这四步都触及部署 control plane 或其测试镜像,按 Fable 裁决走 HUMAN\_GATE**——
改完后 PR 仍需留 open 等 Fable 复审,不适用于普通圈"CI 绿即合并"的豁免
(区别于同一批次里不涉及这四份文件的其他改动,比如纯业务代码工单)。

首次撞这面墙的记录:W1(UserAccount schema + businessStartAt),PR #204,2026-08-01。
