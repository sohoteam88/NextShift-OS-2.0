# 新加坡迁移备份线隔离恢复演练记录 — 2026-08-05

**状态：PASS**
**执行人：Steven（亲手执行）**
**目标：** 新加坡新机 `185.227.134.164` 上的一次性隔离容器 `postgres:17-alpine`；非生产、不得供应用连接或暴露为生产端口。

## 备份与宿主迁移事实

- Dump：`nextshift-20260805T100403Z.dump`，`522,290 B`。
- 备份脚本：`/usr/local/sbin/nextshift-db-backup`，权限 `0700`、属主 `root`；本次脚本执行 `exit=0`。
- 完整性：`sha256sum -c` 返回 **OK**。
- 定时备份：`/etc/cron.d/nextshift-db-backup`，内容为：

  ```cron
  CRON_TZ=UTC
  0 19 * * * root /usr/local/sbin/nextshift-db-backup
  ```

- 新机应用环境文件：`.env.production`，权限 `0600`、属主 `deploy`。本记录不读取、记录或传输其中任何值。

## 恢复演练结果

恢复目标为新加坡新机的一次性隔离 `postgres:17-alpine` 容器。恢复及业务表计数抽查结果：

```text
RESTORE_EXIT=0
users=9
tenants=4
funnels=0
brand_profiles=3
```

四项计数与 2026-08-04 旧机演练逐项一致。`RESTORE_EXIT=0` 是本次完整演练的硬通过条件；本记录不以“dump 文件存在”替代可恢复性证据。

## 沿用的既有修订

本次按既有恢复演练的两项已验证修订执行：

1. 在 `pg_restore` 前预建 Supabase RLS 所需的隔离角色：

   ```sql
   CREATE ROLE anon NOLOGIN;
   CREATE ROLE authenticated NOLOGIN;
   CREATE ROLE service_role NOLOGIN;
   ```

2. 显式排除裸 PostgreSQL 不能恢复的 Supabase Vault 对象：

   ```bash
   pg_restore -l dump | grep -vi vault > restore.list
   ```

   随后以 `-L restore.list` 进行恢复。该排除只针对 Vault；其余对象仍以 `RESTORE_EXIT=0` 为验收标准。

## 观察项（非阻断）

恢复库 `users=9`，而超管后台显示 7。该差异在 2026-08-04 与本次两次独立演练中均一致，当前疑为后台展示的过滤条件差异。它不阻断本次备份线恢复结论，但应在后续产品走查中核实后台筛选、状态和租户范围逻辑；不得据此修改恢复数据或补造数据。

## 效力与边界

本记录满足“**备份线换宿主须重做完整演练**”铁律：新加坡新机上的备份脚本、cron、权限和隔离恢复链均已有一次 `exit=0` 的实测证据。因此，新机控制面变更与完整发布链的**备份恢复前置条件已解锁**。

本记录本身不执行、也不单独批准 provisioning、DNS、secret、控制面变更、发布、Supabase 变更或旧机下线；其余迁移门槛仍须依 `VPS_MIGRATION_TO_SINGAPORE_PLAN_V1.md` 逐项满足。
