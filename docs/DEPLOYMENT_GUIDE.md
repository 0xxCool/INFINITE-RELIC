# INFINITE RELIC - Deployment Guide

Complete guide for deploying INFINITE RELIC to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Database Setup](#database-setup)
- [Security Checklist](#security-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🔧 Prerequisites

### Required Software
- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **PostgreSQL**: >= 14.x
- **Redis**: >= 7.x
- **Git**: Latest version

### Required Accounts
- **Arbitrum Sepolia/Mainnet**: RPC access
- **Vercel/Netlify**: Frontend hosting
- **Railway/Render**: Backend hosting
- **Telegram**: Bot API token
- **PostgreSQL Database**: Hosted instance

### Required Tools
- **Hardhat**: Smart contract deployment
- **Prisma**: Database ORM
- **PM2**: Process management (optional)

---

## 🌍 Environment Setup

### 1. Smart Contracts (.env)

Create `contracts/.env`:

```bash
# Network Configuration
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_MAINNET_RPC_URL=https://arb1.arbitrum.io/rpc

# Deployer Wallet
PRIVATE_KEY=your_private_key_here

# Etherscan (for verification)
ARBISCAN_API_KEY=your_arbiscan_api_key

# Contract Addresses (after deployment)
USDC_ADDRESS=0x...
RELIC_NFT_ADDRESS=0x...
YIELD_TOKEN_ADDRESS=0x...
VAULT_ADDRESS=0x...
ORACLE_ADDRESS=0x...
MARKETPLACE_ADDRESS=0x...
INSURANCE_POOL_ADDRESS=0x...
```

### 2. Backend (.env)

Create `telegram-bot/apps/bot/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/infinite_relic?schema=public

# Redis
REDIS_URL=redis://default:password@host:6379

# Telegram Bot
TG_BOT_TOKEN=your_telegram_bot_token
TG_BOT_USERNAME=infiniterelic_bot
MINI_APP_URL=https://app.relic-chain.io

# Smart Contracts
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
VAULT_CONTRACT_ADDRESS=0x...
NFT_CONTRACT_ADDRESS=0x...

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_api_key

# Security
JWT_SECRET=your_jwt_secret_here
RATE_LIMIT_TTL=900000
RATE_LIMIT_MAX=100

# API
PORT=3000
NODE_ENV=production
```

### 3. Frontend (.env.local)

Create `frontend/.env.local`:

```bash
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=42161
NEXT_PUBLIC_RPC_URL=https://arb1.arbitrum.io/rpc

# Contract Addresses
NEXT_PUBLIC_RELIC_NFT_ADDRESS=0x...
NEXT_PUBLIC_YIELD_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...

# API
NEXT_PUBLIC_API_URL=https://api.relic-chain.io

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🚀 Smart Contract Deployment

### Step 1: Compile Contracts

```bash
cd contracts
npm install
npx hardhat compile
```

### Step 2: Deploy to Arbitrum Sepolia (Testnet)

```bash
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

**Output Example**:
```
Deploying contracts to Arbitrum Sepolia...
✓ USDC Mock: 0x1234...
✓ Yield Token: 0x2345...
✓ Relic NFT: 0x3456...
✓ Dynamic APR Oracle: 0x4567...
✓ Relic Vault: 0x5678...
✓ Relic Marketplace: 0x6789...
✓ Insurance Pool: 0x7890...

Deployment complete! Save these addresses to .env files.
```

### Step 3: Verify Contracts on Arbiscan

```bash
npx hardhat run scripts/verify-all.ts --network arbitrumSepolia
```

### Step 4: Transfer Ownership to Multisig

```bash
# Update MULTISIG_ADDRESS in transfer-ownership.ts
npx hardhat run scripts/transfer-ownership.ts --network arbitrumSepolia
```

**⚠️ Critical**: Always transfer ownership to a multi-signature wallet for production!

### Step 5: Deploy to Mainnet

**Pre-Deployment Checklist**:
- [ ] All contracts audited
- [ ] Test coverage > 95%
- [ ] Multisig wallet prepared
- [ ] Sufficient ETH for gas
- [ ] All addresses verified

```bash
npx hardhat run scripts/deploy.ts --network arbitrumMainnet
```

---

## 💾 Database Setup

### Step 1: Create PostgreSQL Database

**Option A: Railway**
1. Create new project
2. Add PostgreSQL
3. Copy `DATABASE_URL`

**Option B: Supabase**
1. Create new project
2. Get connection string
3. Enable RLS policies

**Option C: Self-Hosted**
```bash
# Create database
createdb infinite_relic

# Create user
psql -c "CREATE USER relic_user WITH PASSWORD 'secure_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE infinite_relic TO relic_user;"
```

### Step 2: Run Prisma Migrations

```bash
cd telegram-bot/apps/bot
npm install
npx prisma generate
npx prisma migrate deploy
```

### Step 3: Seed Initial Data (Optional)

```bash
npx prisma db seed
```

---

## 🤖 Backend Deployment

### Option 1: Railway

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select `INFINITE-RELIC` repo

2. **Configure Service**
   - Root Directory: `telegram-bot/apps/bot`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

3. **Add Environment Variables**
   - Add all variables from `.env` template
   - Use Railway's PostgreSQL and Redis add-ons

4. **Deploy**
   - Push to main branch
   - Railway auto-deploys

### Option 2: Render

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - New Web Service
   - Connect GitHub repo

2. **Configure**
   - Build Command: `cd telegram-bot/apps/bot && npm install && npm run build`
   - Start Command: `cd telegram-bot/apps/bot && npm run start:prod`
   - Environment: Node

3. **Environment Variables**
   - Add all from `.env` template

4. **Add PostgreSQL Database**
   - New PostgreSQL instance
   - Copy `DATABASE_URL` to web service

### Option 3: VPS (Self-Hosted)

```bash
# Clone repository
git clone https://github.com/0xxCool/INFINITE-RELIC.git
cd INFINITE-RELIC/telegram-bot/apps/bot

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/main.js --name infinite-relic-api

# Setup auto-restart
pm2 startup
pm2 save

# Monitor
pm2 logs infinite-relic-api
```

### Configure Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.relic-chain.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL Certificate

```bash
sudo certbot --nginx -d api.relic-chain.io
```

---

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import Git Repository
   - Select `INFINITE-RELIC`

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Environment Variables**
   - Add all from `.env.local` template
   - Production values only

4. **Deploy**
   - Click "Deploy"
   - Vercel auto-deploys on push

5. **Custom Domain**
   - Add domain: `app.relic-chain.io`
   - Configure DNS:
     ```
     A    @    76.76.21.21
     AAAA @    2606:2800:220:1:248:1893:25c8:1946
     ```

### Option 2: Netlify

1. **Connect Repository**
2. **Build Settings**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Environment Variables**: Add from template
4. **Deploy**

### Option 3: Self-Hosted

```bash
cd frontend
npm install
npm run build

# Serve with PM2
pm2 start npm --name "relic-frontend" -- start
```

---

## 🔒 Security Checklist

### Smart Contracts
- [ ] Audited by reputable firm
- [ ] Test coverage > 95%
- [ ] Ownership transferred to multisig
- [ ] Time locks implemented
- [ ] Pausable mechanisms tested
- [ ] ReentrancyGuard on all external calls
- [ ] Access control verified

### Backend
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Telegram auth validated
- [ ] SQL injection prevented (Prisma ORM)
- [ ] Secrets in environment variables
- [ ] Database backups automated

### Frontend
- [ ] CSP headers configured
- [ ] XSS prevention enabled
- [ ] Wallet connection secure
- [ ] No sensitive data in client
- [ ] HTTPS enforced

### Infrastructure
- [ ] SSL certificates valid
- [ ] Firewall configured
- [ ] Fail2ban installed (VPS)
- [ ] Automatic updates enabled
- [ ] Monitoring alerts setup

---

## 📊 Monitoring & Maintenance

### Application Monitoring

**Option 1: Sentry**
```bash
npm install @sentry/node @sentry/nextjs

# Add to backend
Sentry.init({ dsn: process.env.SENTRY_DSN });

# Add to frontend
Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
```

**Option 2: LogRocket**
```bash
npm install logrocket

# Frontend
LogRocket.init('your-app-id');
```

### Server Monitoring

**PM2 Monitoring**
```bash
pm2 monitor
pm2 install pm2-logrotate
```

**Uptime Monitoring**
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)

### Database Backup

**Automated Backups**
```bash
# Cron job for daily backups
0 2 * * * pg_dump infinite_relic > /backups/relic_$(date +\%Y\%m\%d).sql
```

### Contract Monitoring

**Etherscan API**
- Monitor contract events
- Track TVL changes
- Alert on anomalies

---

## 🔄 Update Process

### 1. Smart Contracts

**⚠️ Immutable**: Contracts cannot be updated. Deploy new versions and migrate.

### 2. Backend Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Build
npm run build

# Restart
pm2 restart infinite-relic-api
```

### 3. Frontend Updates

**Vercel**: Auto-deploys on push to main

**Self-Hosted**:
```bash
git pull origin main
npm install
npm run build
pm2 restart relic-frontend
```

---

## 🆘 Troubleshooting

### Smart Contract Issues

**Gas Estimation Failed**
- Check RPC URL
- Verify wallet has ETH
- Increase gas limit manually

**Verification Failed**
- Verify Solidity version matches
- Check constructor args
- Use correct Arbiscan API key

### Backend Issues

**Database Connection Failed**
- Check `DATABASE_URL` format
- Verify firewall allows connection
- Test with `psql` directly

**Redis Connection Failed**
- Verify `REDIS_URL`
- Check Redis is running
- Test with `redis-cli`

### Frontend Issues

**Wallet Not Connecting**
- Check `NEXT_PUBLIC_CHAIN_ID`
- Verify RPC URL accessible
- Clear browser cache

**API Requests Failing**
- Check `NEXT_PUBLIC_API_URL`
- Verify CORS configuration
- Check rate limits

---

## 📞 Support

**Documentation**: https://docs.relic-chain.io
**GitHub Issues**: https://github.com/0xxCool/INFINITE-RELIC/issues
**Discord**: https://discord.gg/infiniterelic
**Email**: support@relic-chain.io

---

## 📄 License

MIT License - See [LICENSE](../LICENSE)

---

**Last Updated**: 2024-10-29
**Version**: 1.0.0
