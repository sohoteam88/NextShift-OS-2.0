# 新加坡迁移完成记录 — 2026-08-05

**状态：完成（保留迁移后实测确认项）**

本记录归档本次应用宿主从 Contabo EU 迁移至 Contabo Singapore 的完成事实。迁移只改变应用部署位置；不改动 Supabase、应用代码、Prisma 或数据库 schema。

## 备份与恢复前置证据

备份线换宿主后的完整恢复演练已完成，详见
[SG_MIGRATION_RESTORE_DRILL_2026-08-05.md](SG_MIGRATION_RESTORE_DRILL_2026-08-05.md)。该演练满足「备份线换宿主须重做完整演练」的要求，并作为本次控制面切换与发布链执行的前置证据。

迁移方案、旧机盘点、DNS 切换与双机保留约束见
[VPS_MIGRATION_TO_SINGAPORE_PLAN_V1.md](../../VPS_MIGRATION_TO_SINGAPORE_PLAN_V1.md)。

## TLS 续期通道验证

- DNS 切换后，Certbot renewal configuration 使用 `nginx` authenticator 与 installer。
- 在新机执行 `certbot renew --dry-run`，结果为 `exit=0`，并输出：
  `Congratulations, all simulated renewals succeeded`。
- 当前证书到期日为 2026-11-01；自动续期通道已验证可用。

## 施工坑补充

本次补记第 ②、③ 条施工坑；本节不重述既有第 ① 条。

② `pkill -f <关键字>` 会匹配包含该关键字的 SSH 远端命令本身，导致会话自杀。应使用 `[c]ertbot` 这类避免匹配自身的写法，或先确认目标 PID 后按 PID 结束进程。

③ 打包迁移 `/etc/letsencrypt` 会同时带上 `.certbot.lock`。新机首次运行 Certbot 可能因此报错 `Another instance is already running`；确认没有实际运行中的 Certbot 后，清除遗留锁文件再重试。

## 结论与迁移后确认项

- F-37 的地理延迟债已清偿。
- F-38 以及 `tenant-service.ts:createTenantUsing` 的事务超时风险预期随迁移消失。
- 以上 F-38 / `createTenantUsing` 结论仍须以新环境实测确认；确认后再决定 P1 与 SA1 是否仍需执行。在完成该实测前，P1 与 SA1 继续暂缓。

本记录不授权也不包含任何 Supabase、代码、schema、DNS、secret 或部署配置变更。
