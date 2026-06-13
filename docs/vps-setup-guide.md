# NextShift OS VPS Staging Setup Guide

This guide prepares a staging VPS for NextShift OS 2.0. Use Ubuntu 22.04 or 24.04.

## 1. Install System Packages

```bash
sudo apt update
sudo apt install -y git curl nginx certbot python3-certbot-nginx
```

## 2. Install Node.js LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 3. Enable pnpm

```bash
sudo corepack enable
corepack prepare pnpm@10.24.0 --activate
pnpm -v
```

## 4. Install PM2

```bash
sudo npm install -g pm2
pm2 -v
```

## 5. Clone Repository

```bash
git clone https://github.com/sohoteam88/NextShift-OS-2.0.git
cd NextShift-OS-2.0
```

## 6. Configure Environment

```bash
cp .env.production.example .env.production
nano .env.production
```

Set all required staging values:

- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- AI provider keys used by the app

Do not commit `.env.production`.

## 7. Install, Generate, Migrate, And Build

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm build
```

## 8. Start With PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup` if prompted.

## 9. Configure Nginx

```bash
sudo cp deploy/nginx/nextshift-os.conf /etc/nginx/sites-available/nextshift-os
sudo ln -s /etc/nginx/sites-available/nextshift-os /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Configure SSL

```bash
sudo certbot --nginx -d staging.nextshiftos.com
```

## 11. Validate

```bash
pm2 status
curl -I http://127.0.0.1:3000/api/health
curl -I https://staging.nextshiftos.com/api/health
```

Expected health response:

```json
{
  "status": "ok",
  "app": "NextShift OS",
  "environment": "production",
  "timestamp": "..."
}
```

## 12. Future Deployments

```bash
./scripts/deploy-vps.sh
```

If the script is not executable:

```bash
chmod +x scripts/deploy-vps.sh
```
