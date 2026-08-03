# Phase8 收编前置：和解地图（只读）

> 状态：**不合并、不 cherry-pick、不部署**。本文件仅供 Fable 按域裁决收编策略。
>
> 生成日期：2026-08-03
>
> 比对对象：`origin/codex/phase8-security-launch` 与 `origin/main`

## 0. 裁决前的 Git 事实

| 项目 | 可复核结果 |
| --- | --- |
| phase8 HEAD（生产身份） | `6456c7609ef3f18699bfa92c2549a0939b702729` — `fix voice profile status constraint`（2026-06-08 14:17:12 +08:00） |
| 当前 main HEAD | `f9c8f7c8522dc9ec301b978ab9af4aeda3327a4f` |
| merge-base | `6456c7609ef3f18699bfa92c2549a0939b702729`（等于 phase8 HEAD） |
| phase8-only 提交 | **0** |
| main-only 提交 | **843** |
| 祖先关系 | `codex/phase8-security-launch` 是当前 `main` 的祖先；当前 Git 图中没有可“收编回 main”的 phase8 独有提交。 |

### 关于工单中的“356 提交”

当前远端 refs 无法复现“phase8 比 main 多 356 提交”这一前提。可复核的当前结果是 phase8-only=`0`、main-only=`843`。

为保留历史内容审计价值，以下“phase8 载荷”采用 `ec45c30^..6456c76`（第一条题为 `phase 8 security launch` 的提交至 phase8 HEAD）的连续范围：**12 提交、359 文件、33,606 additions / 477 deletions**。这不是当前待合并差集，而是生产正在运行的旧代码世代。

## 1. phase8 载荷按域分组

下表是对 359 个变更文件的互斥路径分类；一个提交可跨多个域，因此不把文件数伪装成提交数。

| 域 | 文件数 | 内容摘要 | 风险/收编含义 |
| --- | ---: | --- | --- |
| 用户面 | 206 | 认证后页面、布局、导航、CRM/AI/成员/漏斗/团队等组件与服务、三语 message | 这是旧壳与旧业务面；只能作为行为参考，不能覆盖 main 的当前用户面重建。 |
| API | 79 | `/api/v1/**` 的 auth、CRM、AI、member、tenant、voice、funnel、analytics routes | 鉴权与 tenant 边界必须以 main 的现行实现及测试为准。 |
| Auth / security | 13 | Supabase client/server/middleware、rate limit、request guards、API handler、auth module | 旧安全层早于现行 G4/G5 与后续授权审计，不能倒灌。 |
| 部署 | 13 | 旧 CI/deploy workflow、Dockerfile、Compose、预发布检查/审计 scripts | **高危控制面；main 的门禁版无条件胜出。** |
| Schema | 3 | `prisma/schema.prisma` 与两条 phase8 新增的 Supabase SQL migration | Prisma schema 是共享高危文件；SQL migration 不等同于 Prisma migration。 |
| 测试 / 质量 | 15 | isolation/security/responsive tests、Vitest/Playwright config | 覆盖面早于现行 release/readiness fixture 契约。 |
| 其他 | 30 | package/config、字体、i18n config、styles、seed 等 | 逐项只在 main 缺失且有独立验收时考虑。 |

### 12 条 phase8 系列提交

1. `ec45c30` phase 8 security launch
2. `6bfe855` fix docker pnpm build approvals
3. `2e03421` fix docker healthcheck and pnpm workspace
4. `b92b5e1` fix csp for next inline scripts
5. `fc9cf6d` fix settings account page
6. `2fcec5d` fix production supabase build args
7. `6078f71` fix onboarding dashboard redirect
8. `53913fb` fix platform admin user visibility
9. `0662f79` fix dashboard database retry handling
10. `cb4b09f` fix invite link public url
11. `ac4f01e` Fix CI Node and pnpm versions
12. `6456c76` fix voice profile status constraint

## 2. 冲突高危区与铁律

### 2.1 Deploy control plane — **main 无条件胜出**

phase8 的 `.github/workflows/deploy.yml` 是简易自动部署：`push` 到 `main` 后，先跑 test，再构建/上传 Docker image，并由 SSH 在 VPS 上 `docker compose up -d app`。它没有现行的手动 request、精确 release SHA、production Environment 审批、迁移 artifact、readiness evidence 或 rollback 契约。

phase8 也完全没有 `scripts/deployment/**`。当前 main 另有迁移执行器、manual-gate/health-readiness/production-readiness fixtures、artifact integrity validators 及 final-release request/review/approval scripts。

**裁决（铁律）**：

- 不复制、恢复或 cherry-pick phase8 的 `deploy.yml`、Docker/Compose 部署语义或旧 CI 触发方式。
- 合并候选必须保留当前 main 的 gated `deploy.yml` 与全部 `scripts/deployment/**`；任何 deployment control-plane 改动都是 HUMAN_GATE。
- phase8 缺失 readiness suite 本身即是旧生产世代不能直接作为发布候选的证据，不是允许简化门禁的理由。

### 2.2 `prisma/migrations/**` — phase8 没有新增项

phase8 tree 中 **没有 `prisma/migrations/**`**。因此 phase8 没有任何 Prisma migration 可以直接登记，更没有可跳过的“迁移登记四步”。

当前 main 的 Prisma migrations（均为 main-side 历史，不是 phase8-only 载荷）是：

1. `20260612110000_mission_engine_core`
2. `20260612130000_video_project_engine`
3. `20260612190000_brand_profile_canonical`
4. `20260619154500_feedback`
5. `20260621180939_add_invite_codes_updated_at`
6. `20260625045100_lock_down_public_rls`
7. `20260715220949_add_content_updated_at`
8. `20260731072936_add_user_accounts_and_business_start_at`（W1，commit `2b9b1fe`）

`prisma/schema.prisma` 在 phase8 和 main 均存在且已大幅演进；任何试图把 phase8 版本写回 main 的操作都必须拒绝。未来若有真正新增 Prisma migration，必须完整走 `PIPELINE_OPERATIONS.md` 所定义的四步：

1. `pnpm prisma migrate dev` 生成迁移；
2. 登记 `run-os38-production-migrations.sh` 的路径、checksum、schema hash 与 inventory；
3. 同步 `validate-production-readiness-contract.sh` 的 inventory assertion；
4. 新增 `production-readiness.sh` fixture、更新 pass count，必要时补 migration 前状态回退 SQL。

四步涉及 deployment control plane，均为 HUMAN_GATE。

### 2.3 Supabase SQL migration inventory（不混同 Prisma）

phase8 持有三条 `supabase/migrations/**`，当前 main 均保留，且没有 phase8-only 文件：

| 文件 | phase8 系列归属 | 处理结论 |
| --- | --- | --- |
| `202606060001_initial_nextshift_schema.sql` | phase8 的继承基线 | 已在 main；不得重跑或重写。 |
| `202606060002_add_lead_score_reasons.sql` | phase8 系列新增 | 已在 main；不得重复执行。 |
| `202606080001_fix_voice_profile_status_check.sql` | phase8 系列新增 | 已在 main；不得重复执行。 |

这些 SQL 文件不能被误登记到 Prisma 的四步机制中；真正收编时应只验证其历史存在性与生产 schema 状态，不能把旧文件当成待执行迁移。

## 3. 与批 1、O 轨、G4 合规层的重叠图

### 批 1 W1–W5

| 工单 | phase8 直接实现 | 重叠/冲突判断 | 收编规则 |
| --- | --- | --- |
| W1：`UserAccount` + `businessStartAt` | 无。phase8 schema 不含 `UserAccount` 或 `businessStartAt`。 | 共享 `prisma/schema.prisma`，因此若把旧 schema 覆盖回来是**高危回退**。 | 保留 main 的 W1 schema 与 `20260731072936...` migration；不从 phase8 取 schema。 |
| W2：today task / progress line | 无 `src/modules/user-shell/**`。 | phase8 有旧 dashboard/member 业务面，但不实现 W2 的确定性 resolver。 | W2 独立在 main 上推进；不复用 phase8 dashboard 逻辑替代 W2。 |
| W3：新首页 `/` | 无 `src/app/(auth)/page.tsx`、无 `HomePage`。 | phase8 的 `AppShell`、`Sidebar`、`TopBar`、authenticated layout 是旧壳；会影响新首页挂载，但不是 W3 的实现。 | 新首页从 main 的 user-shell 契约出发；旧 shell 只可作行为回归样本。 |
| W4：`/post`、`/follow`、`/ads` 与旧路由下线 | 三个新路由均不存在。 | phase8 仍携带需要在 W4 下线/降级的旧导航与旧页面语义。 | 不以 phase8 的导航/路由状态作为目标状态。 |
| W5：`/settings/accounts` | 无该页面、无 `userAccountService`/`AccountSwitcher`。 | phase8 有旧 settings 页，仅构成路径附近的低层 UI 接点。 | W5 新建独立路由与服务，保持 social-setup 边界。 |

**“新中文登录页/新壳”核查结论**：phase8 的 `/login` 是 103 行的旧 Supabase 登录表单，标题为 `NextShift OS`，使用翻译 key；它不是批 1 W3 的新首页，也没有 user-shell 模块。它与当前 main 的 login、authenticated layout 和四个 layout component 有历史差异，但批 1 的 W1–W5 没有把 login 列为交付目标。结论是：**直接文件撞车低，产品壳语义冲突中高**；不能把 phase8 的 AppShell/Sidebar 当成“新壳”收回。

### O 轨与 G4

phase8 完全早于 main 的 G0/G1/O1/G4/G5/G2/O2/O3/O4/O5 体系：它没有 `src/modules/ai/compliance/hardFilter.ts`、没有统一 generation gateway、没有业务包的 track/visibility 切片，也没有 O 轨的 Brand DNA 流程。

| 层 | phase8 状态 | 风险 | 裁决 |
| --- | --- | --- | --- |
| O1–O5 | 不存在 | 旧生成/访谈/默认值/就地追问行为会绕开后续产品与合规设计。 | main 的 O 轨实现胜出；不从 phase8 回填 AI/Brand DNA 流程。 |
| G4 hard filter | 不存在 | phase8 的 AI generation 和 public output 不具备当前 `income_promise`、`medical_claim`、`weight_claim`、`public_price` 拒绝码与重生成契约。 | G4 是 HUMAN_GATE 合规层；保留 main 的 hardFilter 与测试，禁止降级。 |
| G5 failure visibility | 不存在 | 旧模板 fallback 可能不满足“失败可见 + 可重试”契约。 | 保留 main 的 gateway/G5 行为与测试。 |

## 4. phase8 CI 与 readiness fixtures 实测

执行环境：独立 detached worktree、精确 phase8 HEAD、一次性 `node:22-bookworm` 容器、pnpm `10.24.0`（与 phase8 CI 对齐）。没有使用生产数据库或任何 secret。

| 检查 | 结果 | 证据/解释 |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | PASS | 安装成功。 |
| `pnpm db:generate` | PASS | Prisma Client 生成成功。 |
| `pnpm lint` | PASS（4 warnings） | 不阻断；warnings 在旧 AI components 的 hook dependencies。 |
| `pnpm type-check` | PASS | `tsc --noEmit` 成功。 |
| `pnpm audit --audit-level=high` | **FAIL** | 19 vulnerabilities：1 low、6 moderate、**12 high**；包含 `brace-expansion` DoS advisory。 |
| isolation tests | **无法判定 / 环境阻断** | 旧 CI 需要 `TEST_DATABASE_URL` secret。为避免接触生产库，本次只提供无效本地测试 URL；6 个 test files 在创建 tenant 时失败、20 tests skipped。这不能被解释为 phase8 业务逻辑失败，必须在隔离测试数据库重跑。 |
| `pnpm build` | PASS | Next production build 成功。 |
| `scripts/deployment/tests/production-readiness.sh` | **FAIL（缺失，exit 127）** | phase8 不含该文件。 |
| `manual-gate.sh`、`health-readiness-contract.sh`、`run-os38-production-migrations.sh` | **全部缺失** | 因而 phase8 无法通过当前 production-readiness fixture 契约。 |

### 收编工作量清单（按门禁碰撞）

1. **P0 — 禁止旧 deploy control plane 入 main**：不引入 phase8 自动 push deploy，保留 main 的 manual request + `production` environment + final release 链。
2. **P0 — readiness 不是可选项**：phase8 缺少四个关键 release/readiness 入口；任何候选 release 必须在 main control plane 下通过 fixtures，而非移除 fixtures。
3. **P0 — 依赖审计修复**：先处理/裁决 12 个 high severity audit findings，再宣称 phase8 可通过完整 CI。
4. **P1 — 隔离测试证据**：在专用、非生产 `TEST_DATABASE_URL` 重跑 6 个 isolation test files；本地图不能用生产凭据补齐这个结果。
5. **P0 — 合规与 O 轨保持 main**：G4/G5/O1–O5 是 phase8 后的 main-only 保护层；不得以旧 branch 覆盖。
6. **P0 — Prisma 迁移纪律**：phase8 无 Prisma migration 可收编；任何未来 migration 都按四步登记并进入 HUMAN_GATE。

## 5. 建议给 Fable 的收编裁决选项

由于 phase8 已是 main 的祖先，正确动作不是 merge 或 cherry-pick。可裁决的是生产身份如何追平：

1. **推荐：生产从 phase8 受控升级到当前 main 的精确 release SHA**，完整走 main 的 gated release/readiness 链，并将本地图作为变更背景；
2. 若暂不升级，明确把生产标为“冻结的旧祖先 SHA `6456c76`”，并禁止它接收独立功能修补；
3. 不允许把 phase8 反向合并到 main，也不允许恢复其旧 deploy workflow、旧 schema 或旧 AI/合规行为。

本文件不构成发布批准、迁移批准或合并批准。
