# NextShift OS：迁移至新加坡 VPS 方案与检查单 V1

**状态：** 草案／仅盘点；等待 Fable 复审，PR 保持 open。
**本次执行：** 仅对旧机 `169.58.116.102` 进行只读盘点，并创建本文件。未执行 provisioning、DNS、secret、部署、Supabase 或代码变更。
**迁移目标：** 将 NextShift OS 应用运行位置由 Contabo EU 迁往 Contabo Singapore；Supabase 项目保持原状。

## 裁决原文（逐字记录）

【裁决】新加坡迁移立项,实证如下(逐字记入方案文档)
- Supabase 连接池 aws-1-ap-southeast-1.pooler.supabase.com:6543 TCP 建连:
  旧机(Contabo EU,169.58.116.102):191ms / 199ms / 250ms
  新机(Contabo Singapore,185.227.134.164):11ms / 9ms / 10ms
- Supabase API total:旧 0.218-0.976s(波动大)/ 新 0.041-0.048s(稳定)
- 新机规格与旧机一致:4 核 / 7941MB / Ubuntu 24.04.4 LTS;Mac 密钥登录已通
- 推论:F-38 事务超时预期自动消失;P1 串行链优化降级为"搬迁后重测再定"

以上是立项依据；其中 F-38 为基于网络实测的预期，必须在迁移后的同一业务路径重测后才能关闭，不能在切换前宣告解决。

## 不在本次迁移范围内

- 不动 Supabase：不迁移项目、不改 region、不改连接池、不改 Auth、Storage、Edge Functions 或任何 Supabase 设置。
- 不动代码：不合并功能变更、不重构、不升级依赖、不修改 GitHub workflow 内容。
- 不改 schema：不新增/修改 migration，不执行 schema 变更。
- 不趁机做任何优化：不处理 P1 串行链；迁移只搬位置，变量越少越好。
- 不在本次草案阶段执行 provisioning、DNS、secret、部署或证书签发。

## 只读盘点（旧机实测）

**采集对象：** `root@169.58.116.102`（主机名 `vmi3483086`），应用目录 `/home/deploy/nextshift`。
**采集方式：** 2026-08-05 以 SSH 密钥只读执行配置、状态和元数据查询。`.env.production` 仅以 `KEY=` 左侧提取键名；未读取、记录或传输任何值。

### Nginx 与 TLS

`nginx -T` 语法检查成功。生效站点为 `/etc/nginx/sites-enabled/nextshiftos.com`：

- `server_name`：`nextshiftos.com www.nextshiftos.com`
- 反向代理：`proxy_pass http://127.0.0.1:3000`
- HTTPS 监听：`443` 及 `[::]:443`；HTTP 监听：`80` 及 `[::]:80`
- 证书：`/etc/letsencrypt/live/nextshiftos.com/fullchain.pem`
- 私钥：`/etc/letsencrypt/live/nextshiftos.com/privkey.pem`
- 签发/管理方式：Certbot（配置行明确标有 `managed by Certbot`）；实测版本 `certbot 2.9.0`
- 续期机制：`certbot.timer` 已 `enabled` 且 `active`；systemd timer 每日 00:00 与 12:00 触发，带最长 43200 秒随机延迟、`Persistent=true`。

生效站点配置的业务部分如下：

```nginx
server {
    server_name nextshiftos.com www.nextshiftos.com;

    client_max_body_size 15m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/nextshiftos.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/nextshiftos.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
    if ($host = www.nextshiftos.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = nextshiftos.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    listen [::]:80;
    server_name nextshiftos.com www.nextshiftos.com;
    return 404; # managed by Certbot
}
```

### Docker Compose、镜像与 restart 策略

旧机 `/home/deploy/nextshift/docker-compose.prod.yml` 全文如下（实测内容不含 `.env.production` 值）：

```yaml
services:
  app:
    image: nextshift-app:latest
    build:
      context: .
      dockerfile: Dockerfile
      target: production
      args:
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
        NEXT_PUBLIC_BASE_DOMAIN: ${NEXT_PUBLIC_BASE_DOMAIN}
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}
        NEXT_PUBLIC_SENTRY_DSN: ${NEXT_PUBLIC_SENTRY_DSN:-}
        NEXT_PUBLIC_POSTHOG_KEY: ${NEXT_PUBLIC_POSTHOG_KEY:-}
        NEXT_PUBLIC_POSTHOG_HOST: ${NEXT_PUBLIC_POSTHOG_HOST:-}
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}
        NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6: ${NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6:-false}
        NEXT_PUBLIC_ENABLE_RUNTIME_MISSION: ${NEXT_PUBLIC_ENABLE_RUNTIME_MISSION:-true}
        NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE: ${NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE:-true}
        NEXT_PUBLIC_ENABLE_RUNTIME_CRM: ${NEXT_PUBLIC_ENABLE_RUNTIME_CRM:-true}
        NEXT_PUBLIC_ENABLE_COMMAND_CENTER: ${NEXT_PUBLIC_ENABLE_COMMAND_CENTER:-true}
        NEXT_PUBLIC_ENABLE_AI_DISCUSSION: ${NEXT_PUBLIC_ENABLE_AI_DISCUSSION:-false}
        SENTRY_AUTH_TOKEN: ${SENTRY_AUTH_TOKEN:-}
        SENTRY_ORG: ${SENTRY_ORG:-}
        SENTRY_PROJECT: ${SENTRY_PROJECT:-}
        NEXT_PUBLIC_COMMIT_SHA: ${NEXT_PUBLIC_COMMIT_SHA:-unknown}
        NEXT_PUBLIC_BUILD_TIME: ${NEXT_PUBLIC_BUILD_TIME:-unknown}
    container_name: nextshift-app
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    env_file: .env.production
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    container_name: nextshift-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  redis_data:
```

实测镜像清单：

| 镜像 | Image ID | 大小 |
|---|---|---:|
| `nextshift-app:8f8c231b177349436f8a204ded0c7da5cdb80248` | `7920738a4ba9` | 1.26GB |
| `nextshift-app:latest` | `7920738a4ba9` | 1.26GB |
| `nextshift-migrations:8f8c231b177349436f8a204ded0c7da5cdb80248` | `8512d11db3fe` | 3.16GB |
| `nextshift-app:pre-batch1-rollback` | `8e126f2f9c57` | 620MB |
| `nextshift-app:previous` | `8e126f2f9c57` | 620MB |
| `redis:7-alpine` | `e7723ff73d96` | 57.8MB |
| `postgres:17-alpine` | `742f40ea20b9` | 424MB |

运行中的容器及 restart 策略：

| 容器 | 镜像 | 实测状态 | restart |
|---|---|---|---|
| `nextshift-app` | `nextshift-app:latest` | `Up ... (healthy)` | `unless-stopped` |
| `nextshift-redis` | `redis:7-alpine` | `Up ...` | `unless-stopped` |

### 数据库备份脚本与调度

`/usr/local/sbin/nextshift-db-backup`（权限 `0700 root:root`）全文如下。脚本从 `.env.production` 内部读取 `DIRECT_URL` 来运行 `pg_dump`；本盘点未读取该 URL 的值。

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/deploy/nextshift
BACKUP_DIR=/var/backups/nextshift/postgres
LOG_DIR=/var/log/nextshift
ENV_FILE="$APP_DIR/.env.production"
POSTGRES_IMAGE=postgres:17-alpine

umask 077
install -d -m 0700 "$BACKUP_DIR"
install -d -m 0700 "$LOG_DIR"

DATABASE_URL=$(sed -n 's/^DIRECT_URL=//p' "$ENV_FILE" | tail -n 1)
if [[ -z "$DATABASE_URL" ]]; then
  echo "missing DIRECT_URL in production environment" >&2
  exit 1
fi

started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
backup_id="nextshift-$(date -u +%Y%m%dT%H%M%SZ)"
temporary_file="$BACKUP_DIR/$backup_id.dump.tmp"
backup_file="$BACKUP_DIR/$backup_id.dump"
manifest_file="$BACKUP_DIR/$backup_id.sha256"
summary_manifest="$BACKUP_DIR/SHA256SUMS"
runtime_env=$(mktemp /run/nextshift-db-backup.XXXXXX)

trap 'rm -f "$temporary_file" "$runtime_env"' EXIT
printf %s "$DATABASE_URL" | python3 -c '
import sys
from urllib.parse import parse_qs, unquote, urlsplit

url = urlsplit(sys.stdin.read().strip())
query = parse_qs(url.query)
values = {
    "PGHOST": url.hostname or "",
    "PGPORT": str(url.port or 5432),
    "PGUSER": unquote(url.username or ""),
    "PGPASSWORD": unquote(url.password or ""),
    "PGDATABASE": unquote(url.path.lstrip("/") or "postgres"),
    "PGSSLMODE": query.get("sslmode", ["require"])[0],
}
for key, value in values.items():
    if "\n" in value or "\r" in value:
        raise SystemExit(f"invalid newline in {key}")
    print(f"{key}={value}")
' > "$runtime_env"
unset DATABASE_URL
docker run --rm --network host --pull=missing \
  --env-file "$runtime_env" \
  --env BACKUP_PATH="/backup/${temporary_file##*/}" \
  --volume "$BACKUP_DIR:/backup" \
  "$POSTGRES_IMAGE" \
  sh -lc 'PGCONNECT_TIMEOUT=30 pg_dump --format=custom --no-owner --no-acl --file "$BACKUP_PATH"'

test -s "$temporary_file"
mv "$temporary_file" "$backup_file"
chmod 0600 "$backup_file"
sha256sum "$backup_file" > "$manifest_file"
chmod 0600 "$manifest_file"
checksum=$(awk '{print $1}' "$manifest_file")
printf '%s  %s\n' "$checksum" "${backup_file##*/}" >> "$summary_manifest"
chmod 0600 "$summary_manifest"

size_bytes=$(stat -c %s "$backup_file")
completed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
printf '{"backupId":"%s","startedAt":"%s","completedAt":"%s","method":"pg_dump-custom","sizeBytes":%s,"checksumFile":"%s","operator":"cron","storageLocationLabel":"new-vps-root-restricted-disk","restoreTested":false}\n' \
  "$backup_id" "$started_at" "$completed_at" "$size_bytes" "${manifest_file##*/}" \
  >> "$LOG_DIR/nextshift-db-backup.jsonl"

# Keep daily artifacts and their individual checksums for 84 days.
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'nextshift-*.dump' -o -name 'nextshift-*.sha256' \) -mtime +84 -delete
```

调度实测：

- root 的个人 crontab：`no crontab for root`。
- 实际系统 cron 文件：`/etc/cron.d/nextshift-db-backup`（权限 `0644 root:root`）：

  ```cron
  CRON_TZ=UTC
  0 19 * * * root /usr/local/sbin/nextshift-db-backup
  ```

- `cron` 服务为 `active`；journal 记录 2026-08-03 重新加载该文件，及 2026-08-03、2026-08-04 的 root 执行记录。
- `/var/backups/nextshift/postgres` 存在 2026-08-03 至 2026-08-04 的 custom dumps、逐文件 SHA-256 与 `SHA256SUMS`；最新实测 dump 约 507KB。备份 JSONL 的 `restoreTested` 均为 `false`，因此**尚不能把现有备份视为已验证可恢复**。

### 主机防护

**UFW**：`active`，规则为 OpenSSH（IPv4/IPv6）ALLOW、Nginx Full（IPv4/IPv6）ALLOW、`22/tcp`（IPv4/IPv6）LIMIT。未记录其它入站 allow 规则。

**Fail2ban**：运行中，共 1 个 jail：`sshd`。当前失败 2、累计失败 369、当前封禁 0、累计封禁 17。`/etc/fail2ban/jail.d/defaults-debian.conf` 实测为：

```ini
[DEFAULT]
banaction = nftables
banaction_allports = nftables[type=allports]
backend = systemd

[sshd]
enabled = true
```

**SSH**：`/etc/ssh/sshd_config` 设置 `PermitRootLogin yes`、`KbdInteractiveAuthentication no`、`UsePAM yes`、`X11Forwarding yes`；两个 drop-in（`50-cloud-init.conf`、`60-cloudimg-settings.conf`）均设置 `PasswordAuthentication no`。`sshd -T` 的关键生效值为：

```text
port 22
addressfamily any
listenaddress [::]:22
listenaddress 0.0.0.0:22
permitrootlogin yes
pubkeyauthentication yes
passwordauthentication no
kbdinteractiveauthentication no
usepam yes
x11forwarding yes
maxauthtries 6
clientaliveinterval 0
clientalivecountmax 3
authenticationmethods any
loglevel INFO
```

### `.env.production` 键名清单（仅键名）

```text
ANTHROPIC_API_KEY
DEEPSEEK_API_KEY
MINIMAX_API_KEY
N8N_WEBHOOK_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
OPENAI_API_KEY
NEXT_PUBLIC_APP_URL
NEXTAUTH_URL
REDIS_URL
DATABASE_URL
DIRECT_URL
```

## 迁移执行检查单（未来执行；本次不执行）

下列顺序中，原工单称“六步”，但箭头明确列出了 **7 个不可跳过的操作关口**；本方案按该 7 个关口原顺序编号。所有命令在实际执行前须由 Steven 确认目标 IP、当前 GitHub run、备份文件名和 DNS 记录。命令不包含 secret 值；任何 `.env.production` 内容或 DNS API token 只由 Steven 在目标主机/控制面直接输入。

### 1. 备新机

**执行者：** Steven 亲手完成 provisioning、账户与 secret 注入；Codex 可代做命令编排、非敏感配置同步和只读验收。
**执行内容：** 在 `185.227.134.164` 准备与旧机等规格的 Ubuntu 24.04.4 LTS、`deploy` 发布账户、Docker/Compose、Nginx、UFW、Fail2ban、应用目录、Redis volume 和备份目录。只复制已盘点的运行形态，不引入优化或代码变更；`.env.production` 由 Steven 安全录入且权限设为 `0600`。

**验证命令：**

```bash
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes deploy@185.227.134.164 \
  'hostnamectl; nproc; free -m; docker --version; docker compose version'
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes deploy@185.227.134.164 \
  'cd /home/deploy/nextshift && test -r .env.production && test "$(stat -c %a .env.production)" = 600 && docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet'
```

**失败回退：** 尚未改变生产流量；停止新机准备工作，修正新机后重验。旧机 `169.58.116.102` 不动。

### 2. 备份线先行并实测恢复

**执行者：** Steven 亲手批准并保管备份副本；Codex 可代执行经批准的校验和隔离恢复命令。
**执行内容：** 在旧机先生成一份新的 custom-format dump，校验 SHA-256，把 dump、同名 `.sha256` 和 `SHA256SUMS` 复制到新机 root 限制目录；随后只恢复到新机的**隔离、无公开端口、未被应用使用**的临时 Postgres 容器。严禁将恢复测试指向生产 Supabase。

**验证命令：**

```bash
# 旧机：生成并校验新的备份；执行后以实际生成的文件名替换 <backup-id>
sudo /usr/local/sbin/nextshift-db-backup
cd /var/backups/nextshift/postgres
sha256sum -c <backup-id>.sha256
pg_restore --list <backup-id>.dump >/dev/null

# 新机：仅在隔离容器中恢复，不发布任何端口
docker run -d --name nextshift-restore-check -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine
docker exec nextshift-restore-check createdb -U postgres nextshift_restore
docker run --rm --network container:nextshift-restore-check \
  -v /var/backups/nextshift/postgres:/backup:ro postgres:17-alpine \
  sh -lc 'pg_restore --host=127.0.0.1 --username=postgres --dbname=nextshift_restore --no-owner --no-acl /backup/<backup-id>.dump'
docker exec nextshift-restore-check psql -U postgres -d nextshift_restore -c '\\dt'
```

**失败回退：** 不进入第 3 步；保留旧机和原始备份，删除失败的隔离容器/测试库，重新生成并校验备份。不得以“dump 文件存在”代替恢复成功。

### 3. 控制面改 known_hosts 与 `VPS_HOST`

**执行者：** Steven 亲手核对 SSH 主机指纹并更新 GitHub secret；Codex 可代准备命令及核对发布控制面引用。
**执行内容：** 先在 Contabo 控制台取得新机 SSH 指纹，再与新机扫描结果逐项比对；确认无误后更新操作者 Mac 的 `known_hosts`，并把 GitHub Actions secret `VPS_HOST` 改为 `185.227.134.164`。现有 workflow 中 `VPS_SSH_KEY` 以 `deploy` 身份连接，必须先验证该 key 能登录新机；仅当不能登录时才由 Steven 轮换该 secret。

**验证命令：**

```bash
ssh-keyscan -t ed25519 185.227.134.164 2>/dev/null | ssh-keygen -lf -
# 先与 Contabo 控制台指纹人工比对，再写入；不得盲目信任扫描结果。
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes deploy@185.227.134.164 'id; hostname'
gh secret list --repo sohoteam88/NextShift-OS-2.0 | rg '^VPS_(HOST|SSH_KEY)\b'
```

**失败回退：** 保持或恢复旧的 `known_hosts` 可信条目和 GitHub `VPS_HOST=169.58.116.102`，不触发发布。因 DNS 尚未切换，用户流量无影响。

### 4. 走完整发布链

**执行者：** Steven 亲手批准触发与观察 GitHub Actions；Codex 可代跟踪 run、读取日志和执行新机只读健康验证。
**执行内容：** 不创建代码提交、不执行 migration。使用既有 `CI` 成功后触发的 `Deploy to Production` workflow 完整路径：构建 `nextshift-app:<sha>`、传输 `image.tar.gz` 与 `docker-compose.prod.yml`、新机 `docker load`、tag 为 `latest`、`docker compose ... up -d app`。此链路不会传输 `.env.production`，故第 1 步必须先由 Steven 安全准备该文件。

**验证命令：**

```bash
gh run list --repo sohoteam88/NextShift-OS-2.0 --workflow CI --branch main --limit 1
# Steven 选定已验证的 main CI run 后才 rerun；以实际 run ID 替换 <ci-run-id>
gh run rerun <ci-run-id> --repo sohoteam88/NextShift-OS-2.0
gh run watch <ci-run-id> --repo sohoteam88/NextShift-OS-2.0 --exit-status
gh run list --repo sohoteam88/NextShift-OS-2.0 --workflow 'Deploy to Production' --branch main --limit 1
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes deploy@185.227.134.164 \
  'cd /home/deploy/nextshift && docker compose --env-file .env.production -f docker-compose.prod.yml ps && curl -fsS http://127.0.0.1:3000/api/v1/health'
```

**失败回退：** 停止在新机排错；把 GitHub `VPS_HOST` 恢复到旧机，在旧机对同一已知镜像恢复 `nextshift-app:latest`（或保留旧机既有运行态）。不改 DNS。

### 5. 双机并存验证

**执行者：** Steven 亲手决定测试窗口及测试账号权限；Codex 可代执行无写入 smoke check、收集健康/延迟结果。
**执行内容：** 旧机继续提供正式 DNS 流量，新机只接受指定验证请求。确认两台的 app/Redis 健康、Nginx 代理、实际 HTTPS、健康端点，以及关键只读业务路径。对 F-38 使用同一事务路径/相同请求量重新测量并记录；只有实测不再超时才可关闭 F-38。P1 串行链在此阶段只测量、不优化。

**验证命令：**

```bash
# 已按“TLS”一节取得正式域名证书后，强制把本机请求定向至新机而不改公共 DNS。
curl --resolve nextshiftos.com:443:185.227.134.164 \
  --fail --silent --show-error https://nextshiftos.com/api/v1/health
for i in {1..10}; do
  curl --resolve nextshiftos.com:443:185.227.134.164 -o /dev/null -sS \
    -w '%{http_code} %{time_total}\\n' https://nextshiftos.com/api/v1/health
done
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes deploy@185.227.134.164 \
  'cd /home/deploy/nextshift && docker compose --env-file .env.production -f docker-compose.prod.yml ps && docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 app'
```

**失败回退：** 新机停止接收验证流量并修复；旧机仍为唯一正式路径。保留新机日志和测量结果，不进行 DNS 切换。

### 6. DNS 切换

**执行者：** Steven 亲手在 DNS 提供商控制面执行记录变更；Codex 可代执行切换后的多解析器验证。
**执行内容：** 切换窗口前记录当前 `A`、`AAAA`、`CNAME` 和 TTL；仅将为 `nextshiftos.com`/`www.nextshiftos.com` 提供流量的记录改至 `185.227.134.164`，并处理任何现存 IPv6 记录，避免 IPv4/IPv6 分流到不同机器。DNS 仅在第 5 步通过后才改。

**验证命令：**

```bash
dig +short A nextshiftos.com @1.1.1.1
dig +short A nextshiftos.com @8.8.8.8
dig +short AAAA nextshiftos.com @1.1.1.1
curl --fail --silent --show-error https://nextshiftos.com/api/v1/health
openssl s_client -connect nextshiftos.com:443 -servername nextshiftos.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

**失败回退：** 在 DNS 控制面把所有已更改记录恢复为切换前已记录的值，等待原 TTL；旧机继续完整运行。不要删除新机或旧机证书作为回退动作。

### 7. 旧机保留 ≥2 周

**执行者：** Steven 亲手批准最终下线；Codex 可代进行只读监控、记录 14 天观察期和整理下线建议。
**执行内容：** DNS 切换成功后至少保留旧机 14 个完整自然日，保持配置、镜像、Nginx、证书和可回退运行态；停止对旧机进行常规发布，避免双机版本漂移。每日确认新机健康、错误日志、F-38 相关测量及备份恢复线。期满前不销毁旧机、volume、备份或凭据。

**验证命令：**

```bash
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes deploy@185.227.134.164 \
  'cd /home/deploy/nextshift && docker compose --env-file .env.production -f docker-compose.prod.yml ps && curl -fsS http://127.0.0.1:3000/api/v1/health'
curl --fail --silent --show-error https://nextshiftos.com/api/v1/health
```

**失败回退：** 在观察期内按第 6 步恢复 DNS 到旧机，并把 GitHub `VPS_HOST` 恢复为旧机后再走完整发布链。满 14 天后的删除/销毁需另开工单、经 Fable 复审和 Steven 明确批准；不属于本方案的自动动作。

## TLS：HTTP-01 的顺序冲突与明确解法

HTTP-01 必须由 Let’s Encrypt 从公网访问 `nextshiftos.com` 的 80 端口；若 A/AAAA 仍指向旧机，则新机不能用 HTTP-01 为该正式域名签发证书。因此它与“先在新机验证、后切 DNS”存在真实顺序冲突。

**推荐解法：DNS-01，为正式域名在新机预先签发证书。** Steven 在 DNS 提供商控制面为 `_acme-challenge.nextshiftos.com`（及需要时 `www`）添加 ACME TXT 记录；该操作不改变 A/AAAA 流量。通过 DNS-01 为 `nextshiftos.com` 和 `www.nextshiftos.com` 获得新证书，装载到新机 Nginx 后，即可使用第 5 步的 `curl --resolve` 对新机做真实 HTTPS 验证，最后才切 A/AAAA。

- **取舍：** 保持“先验证、后切 DNS”，且可提前验证正式域名与正式 TLS；代价是必须安全管理 DNS challenge。推荐使用 DNS 提供商的最小权限 API token 供 Certbot 自动续期；token 由 Steven 直接写入权限 `0600` 的新机文件，绝不进入仓库、workflow 日志或本文档。若只能人工加 TXT，则每次约 90 天续期都要人工介入，风险较高。

**备选 A：临时子域验证。** 将 `migration.nextshiftos.com` 指向新机并用 HTTP-01 签发，仅验证 Nginx、反向代理和该子域 TLS。它不影响正式流量，但不能替代 `nextshiftos.com` 的证书；正式域名仍须在切换窗口完成 DNS-01 或 HTTP-01。

**备选 B：切换窗口 HTTP-01。** 在短窗口先把 A/AAAA 指向新机、立即用 HTTP-01 签发并验证；若失败则恢复 DNS。它最简单，但违背“先验证再切 DNS”，把正式流量和证书风险集中到窗口内，故不推荐为默认方案。

无论选择哪种，旧机的 `/etc/letsencrypt/live/nextshiftos.com/` 私钥不应作为迁移材料复制到新机；新机应独立签发并建立独立续期机制。

## 发布控制面与复审门槛

已只读核对仓库 `.github/workflows/deploy.yml`：成功的 `CI`（`main`）完成后触发 `Deploy to Production`；该 workflow 使用 `VPS_HOST`、`VPS_SSH_KEY` 和用户 `deploy`，传输 `image.tar.gz,docker-compose.prod.yml` 到 `/home/deploy/nextshift`。它不传输 `.env.production`。

本方案对应的 PR 必须保持 **open**，等待 Fable 复审。复审至少确认：

- 盘点事实、完整 compose/备份脚本和 `.env` 仅键名记录均正确；
- DNS-01 方案及自动续期凭据范围被接受；
- 第 2 步出现成功的隔离恢复证据；
- 第 5 步出现新机健康、TLS、延迟与 F-38 重测证据；
- Steven 对 provisioning、secret、部署及 DNS 切换逐项重新授权。

在这些门槛达成前，本文档不是执行授权。
