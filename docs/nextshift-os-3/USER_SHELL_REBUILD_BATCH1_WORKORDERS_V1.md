# 用户面重建 · 批 1 工单拆解 v1

> **定稿日期**：2026-07-31
> **上位文档**：`USER_SHELL_REBUILD_SCOPE_V1.md` 第七章「批 1」
> **裁决记录**：Fable 2026-07-31 对「我的账号」schema 的裁决（见本文 W1 工单）
> **性质**：把批 1 七项交付拆成可独立过 CI + 复审的工单，避免大爆炸合并（护栏第 5 条）
> **执行顺序**：W1 → W2（含备份演练闸门）→ W3 → W4 → W5，W3/W4/W5 在 W1 落地后可并行

## 状态追认（Fable，2026-08-03）

- W1 已完成：PR #204 于 2026-07-31 合并；完整 CI 全绿，production-readiness fixtures 为 59 条，包含迁移登记断言。
- W2 已完成：PR #203 于 2026-07-31 合并；PR 记录的本机 `pnpm lint`、`pnpm type-check`、`pnpm build` 均为 exit code 0。
- W3、W4、W5 为下一批待办；依赖状态以 `OS_3_9_BLUEPRINT.md` 的 pipeline 索引为准。

---

## 工单依赖图

```
W1 Schema 迁移（UserAccount + businessStartAt）
  │
  ├─→ 【闸门】备份+隔离恢复演练（Steven 亲手执行，见下方"演练"章节）
  │     演练通过才能进 request/review/approval/dispatch 发布链
  │
  ├─→ W2 「今天做什么」确定性逻辑 + 底部一句
  ├─→ W3 新首页 `/` 骨架
  ├─→ W4 路由占位（/post /follow /ads）+ 旧路由下线
  └─→ W5（可与 W1 并行起草，落库需等 W1）「我的账号」管理页 UI
```

---

## W1 · Schema 迁移：UserAccount + businessStartAt ⭐ 地基，必须最先落地

### 背景

现有 Prisma schema（`prisma/schema.prisma`）实测确认：`Funnel` 表无 `track` 列，无任何账号/社交账号表，`User` 表无 `businessStartAt`。`src/modules/social-setup` 是内容文案生成器（单份 FB/IG bio 建议，存 `User.metadata.social_setup`），**不是**「我的账号」的数据地基，两者不要混淆、不要合并、不要互相改写。

### Schema 定义（Fable 已裁决，逐字落地）

```prisma
model UserAccount {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  platform   String   // fb / ig / xiaohongshu / tiktok
  track      String   // recruitment / retail
  name       String   // 她填的号名，内容页切换器直接显示这个
  url        String?
  enabled    Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, platform, track])   // Fable 裁决：一个号=一轨，现在加，不等脏数据
  @@index([tenantId, userId])
  @@index([userId, enabled])
  @@map("user_accounts")
}
```

`User` 表新增一列：

```prisma
businessStartAt DateTime? @map("business_start_at") @db.Timestamptz(6)
```

`User` model 需补 `accounts UserAccount[]` 反向关系字段；`Tenant` model 补 `userAccounts UserAccount[]`。

### 为什么是独立表不是 JSON（写进 PR 描述，Fable 会看）

- 账号会被批 3 的名单/跟进事件外键引用（`Lead`/未来的跟进状态机需要知道"这条名单从哪个号进来"）——JSON 字段无法被其他表外键引用，关系数据必须落表
- `User.metadata` 现有的 `social_setup` JSON 用法印证本项目"该建表就建表、该用 JSON 就用 JSON"的既有规矩，此处不是引入新风格
- `@@unique([userId, platform, track])` 把"一个号=一轨"这条已定设计从产品约定变成数据库约束，防止批 2/3 在此地基上继续写脏数据

### 改动范围

- `prisma/schema.prisma`：加 `UserAccount` model + `User.businessStartAt` + 两处反向关系字段
- `prisma/migrations/<timestamp>_add_user_accounts_and_business_start_at/migration.sql`：`prisma migrate dev` 生成，禁止手写 SQL 绕过 Prisma
- 不写任何读写 `UserAccount` 的业务代码——本工单只落地基，消费方是 W2/W5

### 验收标准

- [ ] `pnpm prisma validate` 通过
- [ ] `pnpm prisma migrate dev` 在本地干净生成迁移文件，无警告
- [ ] `pnpm build` 通过（确认新 model 不破坏现有 Prisma Client 生成）
- [ ] `pnpm lint` 通过
- [ ] migration.sql 人工读一遍：只有 `CREATE TABLE user_accounts` + `ALTER TABLE users ADD COLUMN business_start_at` + 相关索引/约束，不含任何 `DROP`/`ALTER COLUMN ... TYPE`
- [ ] PR 描述里贴出完整最终 schema（Fable 要求）

---

## 备份 + 隔离恢复演练 ⚠️ W1 与后续发布之间的强制闸门

> **这不是一个 Codex 工单，是 Steven 亲手执行的操作**。Codex/Sonnet 不得代跑，理由见 AGENTS.md 第 5 条 + Fable 宪章执行边界。本节只提供 Steven 可复制执行的步骤与证据记录格式。

### 为什么现在必须做（不是走个流程）

现行放宽——"隔离恢复演练全程做一次即可，此后每次发布只需确认当日 cron dump 正常"——**在这一次真实发生之前不可引用**（USER_SHELL_REBUILD_SCOPE_V1.md 修订二）。W1 是备份上线以来第一个含 schema 迁移的 release，这次不做，后面所有"确认 cron dump 正常"就没有依据。

### Fable 补充约束：演练必须在迁移上产前，不是上产后

正确顺序：

```
① 当日 cron dump 完成（VPS 上 backup-production-db.sh 产出的 .dump 文件）
       ↓
② 用该 dump 在隔离环境恢复并验证可用（本节步骤）
       ↓
③ 演练记录写入 readiness evidence
       ↓
④ 才能开始 W1 的 request → review → approval → dispatch 发布链
```

事后演练 = 事故发生后才发现备份不可用，失去演练的意义。

### 执行步骤（据 `docs/nextshift-os-3/RUNBOOK_DB_BACKUP.md`）

```bash
# 1. 确认当日 cron dump 存在（VPS 上，19:00 UTC = 03:00 马来西亚时间跑的那份）
ssh deploy@<vps-host> "tail -n 20 /home/deploy/backups/backup.log && ls -lt /home/deploy/backups/nextshift-*.dump | head -1"

# 2. 下载当日最新 dump 到本机
scp deploy@<vps-host>:/home/deploy/backups/nextshift-YYYYMMDD-HHMMSS.dump ./

# 3. 建一个一次性隔离 PostgreSQL 数据库（本机或独立测试实例，绝不能指向生产）
#    例如本机 Postgres: createdb nextshift_restore_drill_20260731

# 4. 恢复
pg_restore --clean --if-exists --no-owner \
  --dbname "postgresql://localhost:5432/nextshift_restore_drill_20260731" \
  ./nextshift-YYYYMMDD-HHMMSS.dump

# 5. 验证（至少这三项）
#    a) 恢复过程 exit code = 0，无 FATAL 级别报错
#    b) 关键表行数与生产大致对应（users / tenants / funnels / brand_profiles 等抽查）
#    c) 能用该隔离库跑一次 `pnpm prisma studio` 或简单 SELECT，确认 schema 完整可查询

# 6. 演练完成后清理隔离库，不留生产数据副本在本机
dropdb nextshift_restore_drill_20260731
```

### readiness evidence 记录格式（写入 `docs/nextshift-os-3/os-3-8/releases/` 对应目录，或本次专开一份）

```markdown
## 隔离恢复演练记录 — 2026-07-31（首次，W1 release）

- 执行人：Steven
- Dump 来源：VPS cron，文件名 nextshift-YYYYMMDD-HHMMSS.dump，产出时间 <UTC 时间戳>
- 恢复目标：本机隔离数据库 nextshift_restore_drill_20260731（非生产，无网络暴露）
- 恢复命令：<粘贴实际执行的 pg_restore 命令>
- 结果：exit code = 0 / 有报错（贴具体报错）
- 抽查表行数：users=<N>, tenants=<N>, funnels=<N>, brand_profiles=<N>
- Schema 完整性验证：<pnpm prisma studio 截图 或 SELECT 结果摘要>
- 隔离库已清理：是/否
- 结论：演练通过，放宽规则自本次起生效 / 演练未通过，问题：<描述>
```

演练通过后，此记录本身要落仓（护栏"定稿一律落仓当天不过夜"），随 W1 PR 一并提交或另开一个 `docs(release): ...` 提交。

---

## W2 · 「今天做什么」确定性逻辑 + 底部一句

### 依赖

W1 落地（需要 `businessStartAt` 判断两态）。

### 范围（USER_SHELL_REBUILD_SCOPE_V1.md 第三、四章）

**决策逻辑**（全确定性，不过 LLM）：

```ts
function getTodayTask(user: { businessStartAt: Date | null }, followupQueue: FollowupItem[]) {
  const hasOverdueFollowup = followupQueue.some(
    (item) => Date.now() - item.waitingSince.getTime() > 24 * 60 * 60 * 1000
  );
  if (hasOverdueFollowup) {
    return { type: 'followup', ... };  // (c) 插队
  }
  return { type: 'schedule', day: computeDayIndex(user.businessStartAt), ... };  // (a) 节奏表打底
}
```

- 节奏表内容源 = 事业包首周带法（体验期 Day 1-4 已有内容，事业期第一周待补，事业期第二周起**待 Steven 口述**——本工单先把体验期 Day 1-4 硬编码进节奏表，事业期部分留 TODO 注释，不假造内容）
- **明确不接现有 mission 引擎**（第四章 4.3），新写一个轻量的确定性函数，不复用 `src/modules/mission-engine`

**底部一句**（第三章）：

```
体验期（businessStartAt === null）：体验第 X 天 · 今天的奶昔喝了吗？
事业期（businessStartAt !== null）：第 X 天 · 已发 X 条 · 今天做 X
```

- "已发 X 条"诚实降级：有「发好了✓」记录 → "已发"；只生成未确认 → "已准备"；都没有 → 该句不渲染。**批 1 阶段"发好了✓"计数机制还不存在（批 2 才做），所以本工单先把"已发/已准备"两个分支的判断函数写好，当前必然走"该句不渲染"分支——这是预期行为，不是 bug**
- 一行封顶，不换行、不加卡片、不加百分比

### 改动范围

- 新建 `src/modules/user-shell/`（新模块，不进任何旧目录，避免和 mission-engine/dashboard 混在一起）
  - `services/todayTaskResolver.ts`
  - `services/progressLineResolver.ts`
  - `services/scheduleTable.ts`（节奏表数据，体验期 Day 1-4 硬编码，事业期留 TODO）

### 验收标准

- [ ] 单元测试覆盖：`hasOverdueFollowup=true` 时插队；`businessStartAt=null` 走体验期文案；`businessStartAt` 有值时按天数索引节奏表
- [ ] "已发/已准备/不渲染"三分支各有一条测试
- [ ] 零 LLM 调用（这条逻辑必须快且不出错，代码里不出现任何 AI provider 引用）
- [ ] `pnpm lint` / `pnpm build` 通过

---

## W3 · 新首页 `/` 骨架

### 依赖

W1（读 `businessStartAt`）、W2（today task + 底部一句的数据源）。

### 范围（第二章 2.1）

- 新建 `src/app/(auth)/page.tsx`：新首页路由，四层结构（今天先做这一件事 / 任务标题+可折叠原因 / 主按钮 / 底部一句），完成前只有一个主行动，完成后浮出两个次级入口
- 现有 `src/app/(auth)/dashboard/page.tsx`（渲染 `DashboardV4`，即 F-04/F-25 信息墙）**不删代码**，按 §6.1/§6.3 处置——本工单只负责把 `/` 的入口切到新壳，`/dashboard` 的路由下线动作在 W4 一并处理，避免这个工单同时改两件事
- 零内部字段名、零英文标签、零 mission 机件（复审时按此逐条 grep）

### 改动范围

- `src/app/(auth)/page.tsx`（新建）
- `src/modules/user-shell/components/HomePage.tsx`（新建，四层结构组件）
- 不改 `src/modules/dashboard/`、不改 `src/modules/mission-workspace/`

### 验收标准（对照第八章 8.1 三问 + 8.3 性能指标）

- [ ] 打开首页 3 秒内知道今天做什么（人工判断）
- [ ] **首页可交互 ≤ 3 秒，实测数字**（手机 4G 模拟，新账号，Lighthouse 或 Chrome DevTools Network Throttling 出具体秒数，写进 PR 描述，不接受"明显变快"）
- [ ] grep 检查：页面源码不含 `businessProfile.exists` / `aiInterview.completed` 等内部字段名字符串
- [ ] grep 检查：不含未走 i18n 的英文用户可见文案
- [ ] 页面上只有一个主行动按钮（完成前）

---

## W4 · 路由占位 + 旧路由下线

### 依赖

W3（新首页需先存在，占位路由的"完成后浮出"逻辑才有依附对象）。

### 范围（第二章 2.0/2.4 + 第六章 6.3 + 第七章批1）

**新建占位路由**（路由结构本批定死，无底部 tab 导航）：
- `src/app/(auth)/post/page.tsx` → 「马上就好」占位（批 2 实现）
- `src/app/(auth)/follow/page.tsx` → 「马上就好」占位（批 3 实现）
- `src/app/(auth)/ads/page.tsx` → 「即将开放」占位（W4/T5 实现）

**旧路由下线**（§6.3 清单，代码不删，路由不渲染——即在路由文件里改成 redirect 到新首页 `/`，或加 feature flag 判断，具体机制由 Codex 选型但要在 PR 描述说明选了哪种）：
- 增长页七卡
- 客户关系
- Mission Workspace
- Business Goal / Agent / Completion Verification / Helper Team（随 Mission Workspace 一并下线）
- 收入驱动中心 Hub 页（其下视频/广告生成工具本身挪 admin 属于批 4，本工单只下线 Hub 页路由，不动其子工具的代码位置）

**旧首页路由处置**：`/dashboard` 保留代码，路由不再是登录后默认落点（默认落点改为 W3 的 `/`），若用户直接访问 `/dashboard` URL，可选择直接展示旧壳（暂不强制跳转，因为 admin 未来可能还要引用）或 redirect 到 `/`——由 Codex 按现有认证/角色判断逻辑（`getAuthUser`/`role === 'platform_admin'`）就近处理，保持 `platform_admin` 仍导向 `/superadmin` 的既有行为不变。

### 改动范围

- `src/app/(auth)/post/page.tsx`、`follow/page.tsx`、`ads/page.tsx`（新建，纯占位组件）
- 涉及 §6.3 五类页面的路由文件（只改路由渲染逻辑或加下线判断，不改其下業務组件代码，不删除任何文件）
- `src/app/(auth)/dashboard/page.tsx`（默认落点让给新首页，保留可访问）

### 验收标准

- [ ] `/post` `/follow` `/ads` 三路由可访问，展示对应占位文案，无报错
- [ ] §6.3 五类页面路由不再对普通用户渲染（人工用测试账号走查确认）
- [ ] 底部 tab 导航确认不存在于任何新路由
- [ ] 旧路由对应的源代码文件确认仍在仓库中（`git status` 无删除记录）
- [ ] 新用户登录后默认落点是 `/` 不是 `/dashboard`

---

## W5 ·「我的账号」管理页 UI

### 依赖

W1（`UserAccount` 表落地）。可与 W2/W3/W4 并行起草，但涉及数据读写的部分必须等 W1 迁移落库。

### 范围（第二章 2.5）

- 新人默认状态：只有一个招募号，系统在她开零售号之前不显示任何零售相关内容——**这是默认状态，不是例外分支**，UI 不应有"零售/招募"两个 tab 常驻，只在 `enabled=true` 的账号数≥2 时才出现切换器
- 切换器显示号名，不显示"零售/招募"内部词（例：`[ Steven｜20年在家工作 ] [ 每天一杯，慢慢变好 ]`）——这条是本工单最容易被简化犯错的地方，PR 里要专门截图证明没有出现"招募"/"零售"字样
- 开号引导落点：账号新建表单的字段与文案参照 `business-pack/ACCOUNT_SETUP_AND_BIO_TEMPLATES_V1.md` 第二、三章（Steven 本人两个号的定稿文案可作为示例/占位参考，不是让新用户照抄）
- 本批**只做数据结构 + 基础管理 UI**（新建/编辑/启用停用账号），不实现"发内容到哪个号"的判定逻辑（批 2）、不实现广告/跟进的账号关联消费（W4-T5/批3）

### 改动范围

- `src/modules/user-shell/services/userAccountService.ts`（新建，`UserAccount` 的 CRUD，注意与 `social-setup` 模块的职责边界——不改 `src/modules/social-setup/*`）
- `src/modules/user-shell/components/AccountSwitcher.tsx`（新建，供 W3 首页/未来内容页复用的切换器组件，本批只需支持"账号数≥2 时渲染"的基础展示，不用在首页出现）
- `src/app/(auth)/settings/accounts/page.tsx`（新建，账号管理页，挂在现有 `settings` 路由下）

### 验收标准

- [ ] 新账号注册后系统自动创建一个 `track=recruitment` 的默认账号记录（还是留空由用户主动开号，需 Steven 在工单执行前二选一——本工单默认写成"留空，引导她主动开号"，若 Steven 要改自动创建，Codex 执行前先确认）
- [ ] `enabled` 账号数 = 1 时，任何页面不出现账号切换 UI，也不出现"招募/零售"字样
- [ ] `enabled` 账号数 ≥ 2 时切换器显示号名文字，grep 确认源码和渲染文案都不含"招募"/"零售"硬编码字符串
- [ ] `@@unique([userId, platform, track])` 约束生效：同用户同平台同轨道二次新建应报错并给出人话提示，不是数据库原始错误堆栈
- [ ] `pnpm lint` / `pnpm build` 通过

---

## 待 Steven 口述/拍板才能解锁的已知缺口（不阻塞批 1，记录在案）

- W2 节奏表"事业期第二周起"内容——事业包待补
- W5 "新账号是否自动创建默认招募号"——本工单默认"留空引导"，Steven 若有不同判断需在执行前改
- 首页任务标题的中文表述、「发好了✓」的夸语——USER_SHELL_REBUILD_SCOPE_V1.md 待补清单已列，批 2 会用到，不阻塞批 1

---

*批 1 工单拆解 v1 — 2026-07-31，五工单待 Steven 转发 Codex 执行*
