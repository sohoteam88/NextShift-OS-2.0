# 用户面热路由串行链优化 · P1 工单 v1

> 性质：**普通 pipeline 项**，不是 HUMAN_GATE。唯一调度入口为
> `OS_3_9_BLUEPRINT.md` 的 P1；本文件是其实现规格，补充
> `USER_SHELL_REBUILD_SCOPE_V1.md` §8.3 与 `DOGFOOD_DIARY_2026-07.md` F-37。
> 定稿：2026-08-05。

## 背景与边界

生产常驻容器曾错误使用 `connection_limit=1`，造成并发请求阶梯排队；现已在运行中容器实测
`connection_limit=5`，该配置**不属于本工单改动范围**。F-37 记录了修复前后的实测值与尚存的
二级竞争。本工单只缩短热路由自身不必要的串行等待，不能把应用端性能问题归因为单一数据库
SQL，也不能借此放松认证、租户隔离或发布门禁。

## 目标

- 首页 `/` 的 loopback TTFB **≤ 1 秒**；基线约 **2–3 秒**，PR 必须给出可复现实测数字、
  方法与环境。
- 首页、`/settings/accounts` 与相关认证路径只保留完成授权所需的读取；可以独立进行的读取
  不得人为串行排队。
- 合并后仍须通过一次完整发布链才可上生产；本工单的普通 pipeline 合并不等于部署。
- P1 合并后，紧接着完成 SA1/F-38 的 HUMAN_GATE 返修；两项均合并后才共用一次完整发布链，
  不为本工单单独部署。

## 范围

### 1. 首页 `/` 的服务器读取

现状入口为 `src/app/(auth)/page.tsx`：`getAuthUser()` 后读取用户资料，再计算首页任务与进度。

- 逐项确认认证结果、onboarding、tenant 与首页所需用户资料之间的真实数据依赖。
- 仅当输入不依赖前一项结果时，使用 `Promise.all` 或等效组合并发加载；保留必须先完成的
  授权/重定向判断，不能为并发而读取未授权数据。
- 保持首页行为、platform admin 的 `/superadmin` 重定向、租户范围及「一个主行动」UI 不变。

### 2. `/settings/accounts` 的账号读取

- 沿 `src/app/(auth)/settings/accounts/page.tsx` →
  `src/app/api/v1/user-shell/accounts/route.ts` → service/auth 路径实测并标出当前五个 Prisma
  串行读取的调用点；不得把推测当成计数。
- 合并为能一次完成的查询，或对彼此独立的读取并发执行；每个 Prisma 查询仍须带原有
  `tenantId` + `userId` 作用域，更新/启停前的归属校验不得因优化被删弱。
- 保持新用户账号列表为空、开号引导及账号名展示的 W5 已定契约。

### 3. middleware 与 SSR 的认证去重

- 盘点每条目标页面请求中 middleware、authenticated layout、page 和 API 路由的
  `supabase.auth.getUser()` 调用次数，并在 PR 写出修改前后计数。
- 每个请求只保留安全授权所必需的一次远程 `getUser()`；SSR 内复用已存在的
  `getAuthUser` request cache 或安全等价的已验证身份数据。
- `getSession()` 仅可用于不承担授权判断的本地会话读取；不得以它替代需要服务端验证的
  `getUser()`，不得改变登出、禁用用户、删除租户、兼容路由或 API 的拒绝语义。

## 明确禁止

- 不改 `.env*`、`DATABASE_URL`、connection limit、Prisma schema/migrations、Supabase 配置或
  deploy/control-plane 文件。
- 不新增遥测、轮询、定时任务或生产监控；F-37 的残余竞争先以零成本实测判断。
- 不移除 `withPrismaRetry`、认证、角色、tenant scope 或任何 fail-closed 行为来“换速度”。
- 不触发部署、迁移、回滚或 Final Release 动作。

## 验收与交付

- [ ] 首页 loopback TTFB ≤ 1 秒，PR 记录至少三次实测、命令/方法、运行环境与基线对比。
- [ ] `/`、`/settings/accounts`、对应 API 的 Prisma 往返次数与最大串行深度分别列出修改前后；
      不存在可证明独立却仍串行的热路径读取。
- [ ] 目标页面的 `getUser()` 次数按实际请求链给出修改前后证据；安全授权语义不回退。
- [ ] 覆盖首页重定向/用户态、账号 tenant+user scope 与认证去重边界的定向测试；现有测试不回归。
- [ ] `pnpm db:generate`、`pnpm type-check`、定向测试、`pnpm lint`、`pnpm build` 均通过。
- [ ] 由 `~/Documents/GitHub/nextshift-pipeline-tools` 的正常 pipeline 执行；CI/普通复审通过后才合并。
      合并后另起完整发布链，不能把普通 PR 的合并当作上产。
