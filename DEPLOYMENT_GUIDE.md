# Infinite Relic - Complete Deployment Guide

This guide provides step-by-step instructions for deploying all components of the Infinite Relic protocol to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Smart Contracts Deployment](#smart-contracts-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Telegram Bot & Backend](#telegram-bot--backend)
5. [The Graph Subgraph](#the-graph-subgraph)
6. [Production Configuration](#production-configuration)
7. [Monitoring Setup](#monitoring-setup)
8. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### Required Accounts

- [ ] **Vercel Account** (frontend hosting) - https://vercel.com
- [ ] **Railway/DigitalOcean** (backend hosting) - https://railway.app
- [ ] **The Graph Studio** (subgraph indexing) - https://thegraph.com/studio
- [ ] **WalletConnect Project** - https://cloud.walletconnect.com
- [ ] **OpenAI API Key** - https://platform.openai.com
- [ ] **Telegram Bot Token** - https://t.me/BotFather
- [ ] **Alchemy/Infura RPC** - https://www.alchemy.com

### Required Tools

```bash
# Node.js 20+
node --version

# pnpm or npm
npm --version

# Hardhat
npm install -g hardhat

# The Graph CLI
npm install -g @graphprotocol/graph-cli

# Vercel CLI
npm install -g vercel

# Docker (for local testing)
docker --version
```

### Wallet Setup

- [ ] **Deployer Wallet** with ~0.1 ETH on Arbitrum Sepolia (testnet)
- [ ] **Deployer Wallet** with ~0.5 ETH on Arbitrum One (mainnet)
- [ ] **Dev Fee Wallet** (can be same as deployer or separate)
- [ ] **Gnosis Safe** (recommended for mainnet owner)

---

## Smart Contracts Deployment

### Step 1: Environment Setup

```bash
cd contracts
cp .env.example .env
```

Edit `.env`:

```env
PRIVATE_KEY=your_deployer_private_key_here
ARBISCAN_API_KEY=your_arbiscan_api_key
DEV_FEE_ADDRESS=0xYourDevFeeAddress
```

### Step 2: Deploy to Arbitrum Sepolia (Testnet)

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to testnet
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

**Save deployment addresses!** You'll need them for:
- Frontend configuration
- Subgraph configuration
- Backend configuration

Example output:
```
MockUSDC deployed to: 0x1234...
MockRWAAdapter deployed to: 0x5678...
YieldToken deployed to: 0x9abc...
RelicNFT deployed to: 0xdef0...
RelicVault deployed to: 0x1111...
```

### Step 3: Verify Contracts on Arbiscan

```bash
npx hardhat verify --network arbitrumSepolia 0xYOUR_VAULT_ADDRESS
npx hardhat verify --network arbitrumSepolia 0xYOUR_NFT_ADDRESS
# Verify other contracts...
```

### Step 4: Deploy to Arbitrum One (Mainnet)

**⚠️ ONLY after thorough testing on testnet!**

Update `.env` with mainnet RPC:

```env
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
```

Update `hardhat.config.ts` if using real Ondo OUSG:

```typescript
// In deploy script, replace MockRWAAdapter with real Ondo OUSG address
const RWA_ADAPTER = '0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92'; // Ondo OUSG on Arbitrum
```

Deploy:

```bash
npx hardhat run scripts/deploy.ts --network arbitrum
```

### Step 5: Set Up Gnosis Safe (Mainnet Only)

1. Go to https://safe.arbitrum.io
2. Create new Safe with 2-3 signers
3. Transfer ownership:

```bash
npx hardhat run scripts/transfer-ownership.ts --network arbitrum
```

---

## Frontend Deployment

### Step 1: Update Configuration

```bash
cd frontend
```

Edit `src/lib/config.ts`:

```typescript
export const CONTRACTS = {
  VAULT: '0xYOUR_VAULT_ADDRESS',
  NFT: '0xYOUR_NFT_ADDRESS',
  USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum USDC
};
```

### Step 2: Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
NEXT_PUBLIC_NETWORK=arbitrum-sepolia
```

### Step 3: Test Locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 and test:
- [ ] Wallet connection
- [ ] USDC approval
- [ ] Relic minting
- [ ] Portfolio viewing
- [ ] Yield claiming

### Step 4: Deploy to Vercel

```bash
vercel login
vercel --prod
```

Or via Vercel Dashboard:
1. Connect GitHub repository
2. Set environment variables
3. Deploy

**Production URL:** `https://infiniterelic.xyz`

### Step 5: Custom Domain (Optional)

1. Purchase domain (Namecheap, Cloudflare Registrar)
2. Add to Vercel project
3. Configure DNS:

```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

---

## Telegram Bot & Backend

### Step 1: Create Telegram Bot

1. Message @BotFather on Telegram
2. Send `/newbot`
3. Follow prompts
4. Save bot token

### Step 2: Set Up Mini-App

1. Message @BotFather
2. Send `/mybots`
3. Select your bot → Bot Settings → Menu Button
4. Set URL: `https://mini.infiniterelic.xyz` (your mini-app URL)

### Step 3: Environment Configuration

```bash
cd telegram-bot/apps/bot
cp .env.example .env
```

Edit `.env`:

```env
TG_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=sk-your_openai_key
DATABASE_URL=postgresql://user:password@host:5432/relic
REDIS_URL=redis://host:6379
MINI_APP_URL=https://mini.infiniterelic.xyz
RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
VAULT_ADDRESS=0xYOUR_VAULT_ADDRESS
```

### Step 4: Database Setup (Railway)

1. Sign up at https://railway.app
2. Create new project
3. Add PostgreSQL database
4. Add Redis instance
5. Copy connection strings to `.env`

### Step 5: Deploy Backend

**Option A: Docker**

```bash
docker-compose up -d postgres redis
npm run prisma:migrate
npm run start:prod
```

**Option B: Railway**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Step 6: Deploy Mini-App

```bash
cd telegram-bot/apps/mini
cp .env.example .env
```

Edit `.env`:

```env
PUBLIC_API_URL=https://api.infiniterelic.xyz
PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
```

Deploy to Vercel:

```bash
vercel --prod
```

---

## The Graph Subgraph

### Step 1: Update Configuration

```bash
cd subgraph
```

Edit `subgraph.yaml`:

```yaml
source:
  address: "0xYOUR_VAULT_ADDRESS"
  startBlock: 12345678  # Block when vault was deployed
```

### Step 2: Copy ABIs

```bash
cp ../contracts/artifacts/contracts/RelicVault.sol/RelicVault.json abis/
```

### Step 3: Generate Types

```bash
npm install
npm run codegen
```

### Step 4: Build

```bash
npm run build
```

### Step 5: Deploy to The Graph Studio

1. Create account: https://thegraph.com/studio
2. Create new subgraph: `infinite-relic`
3. Get deploy key

```bash
graph auth --studio YOUR_DEPLOY_KEY
npm run deploy
```

### Step 6: Publish

Once synced, publish to The Graph Network:

```bash
graph publish --studio infinite-relic
```

**Subgraph URL:** `https://api.studio.thegraph.com/query/<ID>/infinite-relic/version/latest`

Update frontend to use subgraph for portfolio data.

---

## Production Configuration

### Security Checklist

- [ ] All private keys stored in secure environment variables (never in code)
- [ ] Gnosis Safe configured as contract owner (mainnet)
- [ ] Rate limiting enabled on backend API
- [ ] CORS configured to allow only frontend domain
- [ ] SSL/TLS certificates configured
- [ ] Database backups enabled
- [ ] Monitoring alerts configured

### Contract Configuration

After deployment, configure vault parameters:

```typescript
// If using Hardhat console or Gnosis Safe UI
await vault.setRWAAdapter(ONDO_OUSG_ADDRESS);
await vault.setDevFeeReceiver(DEV_FEE_ADDRESS);
```

### Environment Variables Summary

**Frontend (.env.local):**
```env
NEXT_PUBLIC_WC_PROJECT_ID=
NEXT_PUBLIC_ALCHEMY_ID=
NEXT_PUBLIC_NETWORK=arbitrum
```

**Bot Backend (.env):**
```env
TG_TOKEN=
OPENAI_API_KEY=
DATABASE_URL=
REDIS_URL=
MINI_APP_URL=
RPC_URL=
VAULT_ADDRESS=
```

**Mini-App (.env):**
```env
PUBLIC_API_URL=
PUBLIC_WC_PROJECT_ID=
```

---

## Monitoring Setup

### Prometheus & Grafana

Already configured in `docker-compose.yml`:

```bash
cd telegram-bot
docker-compose up -d prometheus grafana
```

Access:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3030 (admin/relic)

### Load Testing

```bash
cd telegram-bot/tests/load
k6 run quest-claim.js
```

Target metrics:
- p95 response time < 200ms
- Error rate < 1%
- Throughput > 1000 req/s

### Contract Events Monitoring

Monitor these events:
- `RelicMinted` - Track new deposits
- `YieldClaimed` - Track yield claims
- `DevFeeCharged` - Track revenue
- `PerformanceFeeCharged` - Track performance fees

Set up alerts for:
- Large withdrawals (> $100k)
- High error rates
- RWA adapter failures

---

## Post-Deployment Checklist

### Smart Contracts

- [ ] All contracts verified on Arbiscan
- [ ] Ownership transferred to Gnosis Safe (mainnet)
- [ ] Dev fee receiver configured
- [ ] RWA adapter set correctly
- [ ] Test deposit/withdrawal flow
- [ ] Test yield claim
- [ ] Check fee calculations

### Frontend

- [ ] Connect wallet works
- [ ] Lock periods display correctly
- [ ] Approve + Mint flow works
- [ ] Portfolio loads user's Relics
- [ ] Yield claiming works
- [ ] OpenSea link works
- [ ] Mobile responsive
- [ ] 3D visualization loads

### Telegram Bot

- [ ] Bot responds to /start
- [ ] Mini-App button opens correctly
- [ ] Referral tracking works
- [ ] Daily quests distribute
- [ ] AI responses work (if OpenAI configured)
- [ ] Notifications send

### Backend API

- [ ] Health check endpoint responds
- [ ] Database migrations applied
- [ ] Redis connection works
- [ ] CORS configured
- [ ] Rate limiting active
- [ ] Monitoring metrics exposed

### Subgraph

- [ ] Syncing completed
- [ ] Query data matches on-chain state
- [ ] All events indexed
- [ ] Published to The Graph Network

---

## Troubleshooting

### Contract Deployment Fails

```bash
# Check balance
cast balance $DEPLOYER_ADDRESS --rpc-url $RPC_URL

# Check gas price
cast gas-price --rpc-url $RPC_URL

# Increase gas limit in deploy script
const tx = await contract.deploy({ gasLimit: 5000000 });
```

### Frontend Build Errors

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Bot Not Responding

```bash
# Check logs
docker logs telegram-bot-bot-1

# Verify token
curl https://api.telegram.org/bot$TG_TOKEN/getMe
```

### Subgraph Sync Issues

```bash
# Check deployment status
graph status --studio infinite-relic

# Redeploy with different version
graph deploy --studio infinite-relic --version-label v0.0.2
```

---

## Support & Resources

- **Documentation:** https://docs.infiniterelic.xyz
- **Telegram Community:** https://t.me/infiniterelic
- **GitHub Issues:** https://github.com/0xxCool/INFINITE-RELIC/issues
- **Discord:** https://discord.gg/infiniterelic
- **Audit Reports:** https://infiniterelic.xyz/audits

---

## Security Audits

Before mainnet launch:

1. **Smart Contract Audit**
   - Certora: https://www.certora.com
   - Trail of Bits: https://www.trailofbits.com
   - Budget: $20-50k

2. **Bug Bounty Program**
   - Immunefi: https://immunefi.com
   - Rewards: $1k - $100k based on severity

3. **Testnet Testing Period**
   - Minimum 2 weeks on testnet
   - Public beta with real users
   - Load testing with k6

---

## License

MIT License - See LICENSE file for details.

**Made with ❤️ by the Infinite Relic team**
