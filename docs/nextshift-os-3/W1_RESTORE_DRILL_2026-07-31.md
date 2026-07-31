# W1 隔离恢复演练记录 — 2026-07-31（首次，备份上线以来首个含 schema 迁移的 release 前置闸门）

> **依据**：`USER_SHELL_REBUILD_SCOPE_V1.md` 修订二——"隔离恢复演练全程做一次即可"的放宽，在这一次真实发生之前不可引用。本记录即该次真实发生的完整证据。
> **执行人**：Steven
> **裁决/编排**：Fable（复审 W1 schema）+ Sonnet 窗口（整理演练清单、逐条核实结果）

---

## 结论

**演练通过。** 备份/恢复链路本身可信，且 W1 schema 迁移（`UserAccount` 表 + enum 类型 + 复合外键 + `businessStartAt` 字段）在一份真实生产快照上完整、干净地应用成功，无数据丢失、无破坏性变更。

**"隔离恢复演练全程做一次即可"的放宽，自本次起生效。**

---

## 演练素材

- **Dump 来源**：VPS cron 备份，文件名 `nextshift-20260730-190001.dump`，产出时间 2026-07-30 19:00:01 UTC
- **说明**：演练执行当天是 2026-07-31，但当日（7月31日）19:00 UTC 的 cron 尚未运行（演练在当天 07:44 UTC 开始），故使用最近一份可用备份（7月30日），如实记录，不写成"当日 dump"
- **Dump 完整性校验**：下载后与 VPS 端 `SHA256SUMS` 清单比对，一致
- **恢复目标**：本机隔离数据库 `nextshift_restore_drill_20260731`（Homebrew PostgreSQL 16，非生产，无网络暴露，socket 连接）

---

## 恢复执行记录

### 第一次尝试：工具版本不匹配（已解决）

```
pg_restore: error: unsupported version (1.16) in file header
```

**根因**：生产备份由 `nextshift-migrations:<sha>` 镜像内的 `postgresql17-client`（`Dockerfile.migrations` 确认版本 17.10-r0）产出，custom-format 归档版本号比本机 PostgreSQL 16 的 `pg_restore` 认识的更新。这是客户端工具版本落后，不是文件损坏。

**解法**：`brew install postgresql@17`，仅用其 `pg_restore` 客户端工具连接现有 PG16 服务端执行恢复（`pg_restore`/`pg_dump` 客户端向下兼容旧服务端，反之不行）。

### 第二次尝试：Supabase 平台基础设施缺口（已核实为预期限制，非数据问题）

```
pg_restore: warning: errors ignored on restore: 34
```

逐条核实 34 处错误的完整清单，构成如下：

| 类别 | 条数 | 说明 |
|---|---|---|
| `transaction_timeout` 配置参数 | 1 | PG17 新增参数，PG16 服务端不认识 |
| `supabase_vault` 扩展相关 | 3 | `CREATE EXTENSION`/`COMMENT ON EXTENSION`/`COPY vault.secrets` —— 裸 PostgreSQL 没有 Supabase Vault 扩展 |
| RLS Policy（`CREATE POLICY ... TO authenticated/anon`） | 30 | `authenticated`/`anon` 角色是 Supabase 平台预置角色，裸 PostgreSQL 不存在 |

**核实结论**：34 处错误**全部**集中在 Supabase 平台专属基础设施（Vault 扩展、RLS 角色体系），**零处**涉及业务表本身。交叉核对 `pg_restore --list` 输出的 dump 内容清单，`public` schema 下全部 34 张业务表（`users`/`tenants`/`funnels`/`brand_profiles` 等）均有完整的 `TABLE DATA` 条目；`restore-stderr-full.log` 中 `grep -i "COPY public\."` 零匹配，确认没有任何业务表的数据拷贝失败。

这一限制是隔离演练环境（裸 PostgreSQL）与生产环境（Supabase 托管）之间的**已知、预期**差异，不是本次恢复的缺陷，也不影响本次演练要验证的核心问题（能否从 dump 完整恢复出可用的业务数据）。

### 第三次尝试：本地环境角色配置差异（已解决，非数据/权限问题）

Prisma Studio 首次连接报 `User was denied access on the database "(not available)"`。核查确认：`psql` 直连使用的角色 `stevenmacmini`（Superuser）能正常查询，问题出在连接串未显式指定用户名导致 Prisma 驱动连接层行为与 `psql` 默认行为不同。补全连接串用户名后此问题消失。

### 第四次尝试：schema 版本不匹配（关键发现，已解决）

补全连接串后，Prisma Studio 报：

```
The column `users.business_start_at` does not exist in the current database.
```

**根因（本次演练最重要的发现）**：隔离库此时的表结构 = 生产当前状态（W1 尚未部署，无 `business_start_at` 列），但本地 `schema.prisma` 已经是 Fable 复审通过后、含 W1 新增字段的版本——验证环境本身存在版本不一致，不是恢复链路的问题，是这次演练步骤设计的疏漏（清单编写时遗漏了"隔离库需先应用目标迁移才能用当前 schema 验证"这一步）。

**解法与额外收获**：在隔离库上执行 `pnpm prisma migrate deploy`，将 W1 迁移（`20260731072936_add_user_accounts_and_business_start_at`）应用到这份真实生产数据快照上。

```
Applying migration `20260731072936_add_user_accounts_and_business_start_at`
All migrations have been successfully applied.
```

只读验证确认复合外键约束精确落地：

```
conname                              | definition
user_accounts_tenant_id_user_id_fkey | FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE
```

**这意味着本次演练不只验证了备份/恢复链路可信，还额外验证了 W1 schema 迁移（含 Fable 复审要求的 enum 类型与复合外键两处修正）能在真实生产数据快照上干净应用，比单纯在空库上跑一次迁移更有说服力。**

---

## 最终验证（三项，全部通过）

**a) 恢复退出码**：1（`pg_restore: warning: errors ignored on restore: 34`——`pg_restore` 只要有任何错误被忽略就返回非 0，即使是已核实的预期限制，退出码也不会是 0；34 处错误均已逐项核实为裸 PostgreSQL 缺少的 Supabase 平台对象，零处涉及业务表本身；业务表数据恢复及 W1 迁移验证通过）

**b) 关键表行数抽查**：

| 表 | 行数 | 备注 |
|---|---|---|
| users | 9 | |
| tenants | 4 | |
| funnels | 0 | 已用项目记忆核实：2026-07-27 Fable 改判后漏斗清库完成（28→0），此为预期状态，非恢复遗漏 |
| brand_profiles | 4 | |

**c) Schema 完整可查询**：应用 W1 迁移后，Prisma Studio 正常显示全部 9 行用户数据（`email`/`name`/`role`/`status` 等字段读取正常，角色分布含 `operator`/`member`/`platform_admin`，状态含 `active`/`suspended`），无报错。

---

## 清理确认

- [x] 隔离数据库 `nextshift_restore_drill_20260731` 已删除（`dropdb`，不可从废纸篓恢复）
- [x] 下载的 dump 文件（`nextshift-20260730-190001.dump`）已删除，本机与仓库目录均确认清除
- [x] 下载的 `SHA256SUMS` 清单副本已删除
- [x] 临时日志目录 `tmp-restore-drill/` 已删除
- [x] 本机不留任何生产数据副本

---

## 本次演练暴露的清单/流程改进点（记录在案，供下次参考）

1. **恢复演练清单需明确"素材版本对齐"步骤**：验证环境的表结构版本必须先对齐到验证时使用的 schema.prisma 版本（即先跑目标迁移），否则会误判为恢复失败。本次因清单遗漏此步导致中途排查耗时，已在实际执行中补上，下次演练清单应直接包含这一步。
2. **本机验证环境需要预先确认 PostgreSQL 客户端工具版本**：与生产迁移镜像使用的 `pg_dump`/`pg_restore` 版本（PG17）保持一致或更高，避免归档格式不兼容。
3. **Supabase 专属基础设施（Vault 扩展、`authenticated`/`anon` 角色体系）在裸 PostgreSQL 隔离环境中天然缺失**，属已知、可接受的限制，不影响业务数据完整性验证，未来演练无需为此额外配置，但应在 evidence 中照实记录，不能略去不提。

---

*W1 隔离恢复演练记录 v1 — 2026-07-31，Steven 亲手执行，Sonnet 窗口整理记录*
