# NextShift OS Staging Launch Checklist

## VPS

- [ ] VPS firewall enabled
- [ ] SSH access verified
- [ ] Nginx active
- [ ] SSL active
- [ ] PM2 process running
- [ ] PM2 process saved

## Application

- [ ] `.env.production` created on VPS
- [ ] No secrets committed
- [ ] Prisma generated
- [ ] Database connected
- [ ] Migrations applied
- [ ] Build passed
- [ ] Health endpoint working

## Product Smoke Test

- [ ] Auth login working
- [ ] Dashboard loading
- [ ] Admin route protected
- [ ] Mission Engine working
- [ ] Brand Discovery working

## URLs

- [ ] `https://staging.nextshiftos.com/api/health`
- [ ] `https://staging.nextshiftos.com/login`
- [ ] `https://staging.nextshiftos.com/dashboard`
