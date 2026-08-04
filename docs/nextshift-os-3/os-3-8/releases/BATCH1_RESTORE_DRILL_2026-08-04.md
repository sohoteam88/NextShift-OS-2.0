# 隔离恢复演练记录 — 2026-08-04(新 VPS 备份线首次完整演练,批 1 release 前置闸门)

- 执行人:Steven(亲手执行,Fable 全程指导并逐步验证输出)
- Dump 来源:新 VPS 每日 cron,`/var/backups/nextshift/postgres/nextshift-20260803T170002Z.dump`(518,584 bytes,产出 2026-08-03T17:00:02Z)
- Dump 校验:本地 `shasum -a 256` 与 VPS `SHA256SUMS` 逐位一致
  `699cb88b76e27124547deaad2a8cfaa5255fd6ca724741a0ed96c0e0cd693715`(64 hex,已数)
- 恢复目标:本机 Docker 一次性隔离容器 `postgres:17-alpine`(非生产,无网络暴露)
- 恢复命令:`pg_restore --clean --if-exists --no-owner -L <过滤清单> /tmp/backup.dump`
- **恢复结果:exit code = 0**(第三次尝试;前两次非 0 的排障过程见下)
- 抽查表行数:users=9, tenants=4, funnels=0, brand_profiles=3
  - 全部与已知生产状态一致;funnels=0 为 2026-07-28 漏斗清库(28→0)的既载事实,非还原缺失
- 隔离容器已删除:是;dump 已转存本机 NextShift-local-backup(转正为本周异地副本);临时校验文件已删
- **结论:演练通过。"隔离恢复演练全程做一次即可"的放宽自本次起在新备份线生效。**

## 排障记录与清单永久修订(两级台阶,后来者直接踩扶手)

1. 第一次 exit 1(33 errors):全部为 Supabase RLS 策略引用 `authenticated` 等 Supabase 专属角色,白板 Postgres 无此角色 → **修订一:隔离目标恢复前预建三角色**
   `CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;`
2. 第二次 exit 1(3 errors):`supabase_vault` 为 Supabase 私有扩展,白板 Postgres 物理不可安装,连带 vault.secrets 不可还原(该表为 Supabase 自身密钥库,非业务数据,密文离开 Supabase 亦不可解)→ **修订二:显式排除 vault 对象后其余必须干净归零**
   `pg_restore -l dump | grep -vi vault > restore.list` 后用 `-L restore.list` 恢复
3. 纪律注:两次非 0 均未"接受了事",而是定位错误族、修正环境后重跑至 exit 0——"exit 0 硬标准 + 显式记录的排除项"优于"接受带错通过"

## 效力

- 本记录解锁:批 1(含 W1 UserAccount schema 迁移)的 Final Release 发布链
- 后续含 schema 迁移的发布:确认当日 cron dump SUCCESS 即可(放宽已生效);备份线再换宿主/换脚本时须重做完整演练
