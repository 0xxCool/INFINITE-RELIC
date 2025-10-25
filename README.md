# 🔮 Infinite Relic

**On-chain RWA yield, locked in tradeable NFTs**

Earn 5-17% APR on real-world assets (US T-Bills) via Ondo Finance, with your position represented as a tradeable ERC-721 NFT.

---

## 📚 Documentation

- **[Production Status Report](./PRODUCTION_STATUS.md)** - Current implementation status and readiness
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- **[Project Analysis](./PROJECT_ANALYSIS.md)** - Deep technical analysis and architecture
- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Detailed implementation roadmap
- **[Master Guide (German)](./README_DE.md)** - Original German implementation guide

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/0xxCool/INFINITE-RELIC
cd INFINITE-RELIC

# Smart Contracts
cd contracts
npm install
npx hardhat test

# Frontend
cd ../frontend
npm install
npm run dev

# Telegram Bot
cd ../telegram-bot/apps/bot
npm install
npm run prisma:generate
npm run start:dev

# Mini-App
cd ../mini
npm install
npm run dev
```

---

## 🏗️ Architecture

The Infinite Relic protocol consists of 6 integrated components:

### 1. Smart Contracts (`/contracts`)
- **RelicVault.sol** - Main vault managing USDC deposits and RWA investment
- **RelicNFT.sol** - ERC-721 NFTs representing lock positions
- **YieldToken.sol** - ERC-20 yield token distribution
- Built on: Solidity 0.8.24, OpenZeppelin 5.3, Hardhat

### 2. Frontend (`/frontend`)
- **Next.js 14** App Router with TypeScript
- **Wagmi 2.9** + **Viem 2.13** for Web3 integration
- **RainbowKit 2.1** for wallet connection
- **Tailwind CSS 3.4** for styling
- **Spline** for 3D visualization

### 3. Telegram Bot (`/telegram-bot/apps/bot`)
- **NestJS 10** backend with TypeScript
- **Prisma ORM** with PostgreSQL
- **OpenAI API** for AI-powered chat
- **BullMQ** for job queues
- Daily quest system with cron jobs

### 4. Mini-App (`/telegram-bot/apps/mini`)
- **SvelteKit 2.5** for Telegram integration
- **Wagmi Core** for Web3 functionality
- Full mint/portfolio/quests interface
- Optimized for Telegram's WebApp platform

### 5. The Graph Subgraph (`/subgraph`)
- Indexes on-chain events (RelicMinted, YieldClaimed)
- GraphQL API for efficient data queries
- Tracks users, relics, claims, protocol stats

### 6. Monitoring (`/telegram-bot/docker`)
- **Prometheus** metrics collection
- **Grafana** dashboards
- **k6** load testing (10k concurrent users)
- Performance thresholds: p95 < 200ms, error < 1%

---

## 💰 Economics

### Revenue Model
- **1% dev fee** on all USDC deposits (immediate)
- **10% performance fee** on yield above 15% APR

### Lock Periods & APR

| Period | Tier | Base APR | Max Boost APR |
|--------|------|----------|---------------|
| 30 days | Copper | 5% | 7% |
| 90 days | Silver | 5% | 10% |
| 180 days | Gold | 5% | 13% |
| 365 days | Infinite | 5% | 17% |

---

## 🛠️ Tech Stack

**Blockchain:**
- Solidity 0.8.24
- OpenZeppelin Contracts 5.3.0
- Hardhat
- ERC-721 (Enumerable)
- ERC-20
- ERC-4626 (RWA Adapter)

**Frontend:**
- Next.js 14.2.5
- TypeScript 5.5
- Wagmi 2.9.11
- Viem 2.13.8
- RainbowKit 2.1.2
- Tailwind CSS 3.4
- Framer Motion 11.2

**Backend:**
- NestJS 10.3.7
- Prisma ORM 5.13.0
- PostgreSQL 16
- Redis 7
- OpenAI API 4.47.0
- BullMQ 5.7.0

**Infrastructure:**
- Docker + Docker Compose
- Prometheus + Grafana
- k6 Load Testing
- The Graph Protocol
- Arbitrum (Sepolia + One)

---

## 📦 Project Structure

```
INFINITE-RELIC/
├── contracts/              # Solidity smart contracts
│   ├── contracts/
│   │   ├── RelicVault.sol
│   │   ├── RelicNFT.sol
│   │   └── ...
│   ├── test/
│   └── scripts/
│
├── frontend/               # Next.js web application
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── public/
│
├── telegram-bot/          # Backend services
│   ├── apps/
│   │   ├── bot/          # NestJS Telegram bot
│   │   └── mini/         # SvelteKit Mini-App
│   ├── docker/
│   └── tests/
│
├── subgraph/              # The Graph indexer
│   ├── schema.graphql
│   ├── src/mapping.ts
│   └── subgraph.yaml
│
└── docs/                  # Documentation
    ├── DEPLOYMENT_GUIDE.md
    ├── PRODUCTION_STATUS.md
    └── ...
```

---

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npx hardhat test
npx hardhat coverage
```

**Coverage Target:** 100% (35+ tests covering all functions)

### Frontend
```bash
cd frontend
npm run build
npm run lint
```

### Backend
```bash
cd telegram-bot/apps/bot
npm run test
npm run test:e2e
```

### Load Testing
```bash
cd telegram-bot/tests/load
k6 run quest-claim.js
```

**Targets:** p95 < 200ms, error rate < 1%, throughput > 1000 req/s

---

## 🚢 Deployment

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete deployment instructions.

### Quick Deploy (Testnet)

```bash
# 1. Deploy contracts
cd contracts
npx hardhat run scripts/deploy.ts --network arbitrumSepolia

# 2. Deploy frontend
cd ../frontend
vercel --prod

# 3. Deploy backend
cd ../telegram-bot/apps/bot
railway up

# 4. Deploy subgraph
cd ../../subgraph
graph deploy --studio infinite-relic
```

---

## 🔒 Security

- ✅ ReentrancyGuard on all external functions
- ✅ Pausable emergency stop mechanism
- ✅ Ownable access control
- ✅ SafeERC20 for token transfers
- ✅ Custom errors for gas efficiency
- ✅ Comprehensive test coverage

**Before Mainnet:**
- ⏳ Professional security audit required
- ⏳ Immunefi bug bounty program
- ⏳ Gnosis Safe multisig ownership
- ⏳ Gradual TVL cap increases

---

## 📈 Roadmap

**Phase 1: Testnet Launch** (Weeks 1-2)
- Deploy all contracts to Arbitrum Sepolia
- Public beta testing with mock USDC
- Frontend deployment to staging
- Collect user feedback

**Phase 2: Security** (Weeks 3-4)
- Smart contract audit (Certora/Trail of Bits)
- Fix audit findings
- Bug bounty program setup
- Penetration testing

**Phase 3: Mainnet Launch** (Week 5-7)
- Deploy audited contracts to Arbitrum One
- Production frontend deployment
- Conservative TVL cap ($100k)
- Launch marketing campaign

**Phase 4: Growth** (Month 2-3)
- Increase TVL caps to $1M
- Partnership announcements
- List on DeFi aggregators
- Mobile app development

**Phase 5: Expansion** (Month 4+)
- Multi-chain deployment (Optimism, Base)
- Additional RWA integrations
- Institutional partnerships
- DAO governance

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) (coming soon).

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🌐 Links

- **Website:** https://infiniterelic.xyz (coming soon)
- **Telegram:** https://t.me/infiniterelic (coming soon)
- **Twitter:** https://twitter.com/infiniterelic (coming soon)
- **Discord:** https://discord.gg/infiniterelic (coming soon)
- **Docs:** https://docs.infiniterelic.xyz (coming soon)

---

## 💬 Support

- **GitHub Issues:** https://github.com/0xxCool/INFINITE-RELIC/issues
- **Telegram Support:** https://t.me/infiniterelic_support (coming soon)
- **Email:** support@infiniterelic.xyz (coming soon)

---

**Built with ❤️ for the DeFi community**

---

# 🏛️ MASTER IMPLEMENTATION GUIDE (GERMAN)
**Von 0 zu Production in 12 Phasen**

---

## 📋 VORAUSSETZUNGEN (Vor Start)

### Hardware & Accounts
- [ ] Ubuntu 22.04 Server (4GB RAM minimum) – DigitalOcean/Hetzner
- [ ] Lokaler PC mit Node 20+, Git, Docker
- [ ] MetaMask: 2 Wallets (Dev + Treasury) mit je 0.1 ETH Sepolia
- [ ] Domain bei Namecheap gekauft (z.B. `relic-chain.io`)
- [ ] Cloudflare-Account (kostenlos)
- [ ] WalletConnect Project-ID (cloud.walletconnect.com)
- [ ] Infura/Alchemy API-Key
- [ ] Telegram-Account (@BotFather)
- [ ] OpenAI API-Key
- [ ] The Graph Studio-Account
- [ ] Chainlink VRF-Subscription (25 LINK prefunded)

---

## PHASE 0: LOKALE ENTWICKLUNGSUMGEBUNG

### 0.1 Server-Basis
```bash
# Auf Cloud-Server via SSH
apt update && apt upgrade -y
apt install curl git vim ufw docker.io docker-compose -y
usermod -aG docker $USER
ufw allow 22,80,443/tcp && ufw enable
```

### 0.2 Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install nodejs -y
node -v  # sollte v20.x.x zeigen
```

### 0.3 SSH-Key (lokal)
```bash
ssh-keygen -t ed25519 -C "relic@local"
cat ~/.ssh/id_ed25519.pub
# → Ins Cloud-Panel kopieren
```

---

## PHASE 1: SMART CONTRACTS (Testnet)

### 1.1 Repo klonen & Setup
```bash
mkdir -p ~/relic && cd ~/relic
git clone https://github.com/YOUR_USER/relic-contracts.git
cd relic-contracts
npm install
cp .env.example .env
```

### 1.2 .env konfigurieren
```bash
# Editieren mit vim/nano
PRIVATE_KEY=0x...  # Dev-Wallet Private-Key
INFURA_ID=...      # Von infura.io
ETHERSCAN_API=...  # Von arbiscan.io
```

### 1.3 Compile & Test
```bash
npm run compile
npm run coverage
# Ziel: 100% Statements, 0 Fehler
```

### 1.4 Testnet-Deploy (Arbitrum Sepolia)
```bash
npm run deploy:sepolia
# Notiere alle Adressen:
# - MockUSDC: 0x...
# - MockRWA: 0x...
# - YieldToken: 0x...
# - RelicNFT: 0x...
# - RelicVault: 0x...
# - TraitBridge: 0x...
# - Mystery: 0x...
# - MAV: 0x...
```

### 1.5 Etherscan-Verify
```bash
npx hardhat verify --network arbSepolia <VAULT_ADDR> <USDC> <NFT> <YIELD> <RWA>
# Für jeden Contract wiederholen
```

✅ **Checkpoint**: Alle Contracts auf Etherscan verifiziert & grün

---

## PHASE 2: SUBGRAPH (The Graph)

### 2.1 Subgraph initialisieren
```bash
cd ~/relic
git clone https://github.com/YOUR_USER/relic-subgraph.git
cd relic-subgraph
npm install
```

### 2.2 Config anpassen
```yaml
# subgraph.yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: RelicVault
    network: arbitrum-sepolia
    source:
      address: "0x..." # VAULT_ADDR aus Phase 1
      abi: RelicVault
      startBlock: 12345678
```

### 2.3 Deploy
```bash
npm run codegen
npm run build
npm run deploy-studio
# Wähle: relic-chain-io
# Notiere Endpoint: https://api.studio.thegraph.com/query/.../relic/v0.0.1
```

✅ **Checkpoint**: GraphQL-Playground zeigt Daten

---

## PHASE 3: FRONTEND (Vercel)

### 3.1 Repo & Install
```bash
cd ~/relic
git clone https://github.com/YOUR_USER/relic-frontend.git
cd relic-frontend
npm install
cp .env.local.example .env.local
```

### 3.2 .env.local konfigurieren
```bash
NEXT_PUBLIC_WC_PROJECT_ID=...       # WalletConnect
NEXT_PUBLIC_VAULT_ADDR=0x...        # Aus Phase 1
NEXT_PUBLIC_USDC_ADDR=0x...
NEXT_PUBLIC_RPC_ARBSEP=https://...  # Alchemy/Infura
NEXT_PUBLIC_GRAPHQL=https://...     # Aus Phase 2
```

### 3.3 Lokaler Test
```bash
npm run dev
# Browser: http://localhost:3000
# Teste: Wallet-Connect, Mint-Button (Testnet)
```

### 3.4 Vercel-Deploy
```bash
# GitHub-Push
git remote add origin https://github.com/YOUR_USER/relic-frontend.git
git add . && git commit -m "init" && git push -u origin main

# Vercel-Dashboard:
# 1. Import Git → relic-frontend
# 2. Environment-Variables aus .env.local kopieren
# 3. Deploy
# Notiere: https://relic-frontend.vercel.app
```

✅ **Checkpoint**: Frontend live, Testnet-Mint funktioniert

---

## PHASE 4: DOMAIN & SSL (Cloudflare)

### 4.1 Nameserver umstellen
```
# Namecheap → Domain-Management → Nameservers:
amy.ns.cloudflare.com
raj.ns.cloudflare.com
```

### 4.2 Cloudflare-DNS
```
A     @       <SERVER-IP>     Proxy: ON
A     api     <SERVER-IP>     Proxy: ON
CNAME www     relic-chain.io  Proxy: ON
```

### 4.3 SSL/TLS-Modus
```
Cloudflare → SSL/TLS → Full (strict)
Origin-Certificate erstellen → Herunterladen:
- cert.pem
- key.pem
→ Auf Server: /etc/nginx/ssl/
```

✅ **Checkpoint**: https://relic-chain.io zeigt Cloudflare-Seite

---

## PHASE 5: NGINX (Reverse-Proxy)

### 5.1 Nginx installieren
```bash
apt install nginx certbot python3-certbot-nginx -y
```

### 5.2 Config erstellen
```nginx
# /etc/nginx/sites-available/relic
server {
    listen 443 ssl http2;
    server_name relic-chain.io www.relic-chain.io;
    
    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Frontend (Vercel)
    location / {
        proxy_pass https://relic-frontend.vercel.app;
        proxy_set_header Host relic-frontend.vercel.app;
        proxy_ssl_server_name on;
    }
    
    # Backend (lokal)
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5.3 Aktivieren
```bash
ln -s /etc/nginx/sites-available/relic /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

✅ **Checkpoint**: https://relic-chain.io zeigt Frontend

---

## PHASE 6: TELEGRAM-BOT

### 6.1 BotFather-Setup
```
# Telegram: @BotFather
/newbot
Name: Infinite Relic
Username: @RelicChainBot
→ Notiere Token: 123456:ABC-DEF...
```

### 6.2 Repo & Docker
```bash
cd ~/relic
git clone https://github.com/YOUR_USER/relic-ai-bot.git
cd relic-ai-bot
```

### 6.3 .env konfigurieren
```bash
# apps/bot/.env
TG_TOKEN=123456:ABC-DEF...
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://relic:relic@postgres:5432/relic
REDIS_URL=redis://redis:6379
MINI_APP_URL=https://relic-chain.io
PORT=3001
```

### 6.4 Starten
```bash
docker-compose up -d
docker-compose logs -f bot
# Test: Telegram → @RelicChainBot → /start
```

✅ **Checkpoint**: Bot antwortet, Mini-App öffnet sich

---

## PHASE 7: MONITORING (Grafana)

### 7.1 Prometheus-Config
```yaml
# metrics/prometheus.yml
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'bot'
    static_configs:
      - targets: ['bot:3001']
```

### 7.2 Docker-Compose-Erweiterung
```yaml
# Bereits in docker-compose.yml enthalten
# Einfach starten:
docker-compose up -d prometheus grafana
```

### 7.3 Grafana-Zugriff
```
Browser: http://<SERVER-IP>:3030
Login: admin / relic
Dashboard: Relic-Overview (auto-provisioned)
```

✅ **Checkpoint**: Grafana zeigt Metriken

---

## PHASE 8: LOAD-TEST (k6)

### 8.1 Lokal testen
```bash
cd relic-ai-bot/tests/load
chmod +x run-local.sh
./run-local.sh
```

### 8.2 Ergebnis prüfen
```
✓ http_req_duration p(95) < 200ms
✓ http_req_failed < 1%
```

✅ **Checkpoint**: System hält 10k concurrent Users

---

## PHASE 9: SECURITY-AUDIT

### 9.1 Slither (Static-Analysis)
```bash
cd ~/relic/relic-contracts
slither contracts/ --exclude-informational --json security/slither-report.json
# Ziel: 0 High-Severity
```

### 9.2 Certora (Optional, kostenpflichtig)
```bash
# Specs schreiben: specs/RelicVault.spec
certoraRun contracts/RelicVault.sol --verify RelicVault:specs/RelicVault.spec
```

### 9.3 Immunefi-Listing
```
1. https://immunefi.com → Submit Program
2. Scope: RelicVault, RelicNFT, YieldToken
3. Rewards: 50k USDC (Critical)
4. Response-SLA: 24h
```

✅ **Checkpoint**: Audit-Reports veröffentlicht

---

## PHASE 10: MAINNET-VORBEREITUNG

### 10.1 Multi-Sig erstellen
```
1. Gnosis-Safe → safe.global
2. Arbitrum-Mainnet → 3/5-Signer
3. Notiere: 0x... (TREASURY_ADDR)
```

### 10.2 Mainnet-.env
```bash
# relic-contracts/.env
PRIVATE_KEY=0x...  # Multi-Sig-Signer-1
RPC_URL=https://arb-mainnet.g.alchemy.com/v2/...
CHAIN_ID=42161
TREASURY_ADDR=0x...  # Gnosis-Safe
```

### 10.3 LINK-Tank (Chainlink VRF)
```
1. vrf.chain.link → Create Subscription
2. Fund: 25 LINK (~$450)
3. Add Consumer: <MYSTERY_CONTRACT_ADDR>
```

✅ **Checkpoint**: Multi-Sig-Test-TX durchgeführt

---

## PHASE 11: MAINNET-DEPLOY

### 11.1 Deploy-Checkliste
- [ ] USDC-Adresse: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 (Arbitrum)
- [ ] Ondo OUSG: 0x... (Mainnet-Adapter statt Mock)
- [ ] Treasury-Wallet: Multi-Sig aus Phase 10

### 11.2 Deploy
```bash
npm run deploy:mainnet
# Notiere ALLE Adressen
```

### 11.3 Verify
```bash
npx hardhat verify --network arbitrum <VAULT_ADDR> ...
```

### 11.4 Ownership → Multi-Sig
```bash
npx hardhat run scripts/transfer-ownership.js --network arbitrum
# Transferiert zu Gnosis-Safe
```

✅ **Checkpoint**: Alle Contracts live & verifiziert

---

## PHASE 12: LAUNCH-KAMPAGNE

### 12.1 Gleam-Setup (T-14)
```
1. gleam.io → New Campaign
2. Actions:
   - Join Telegram
   - Follow Twitter
   - Retweet Announcement
   - Submit Wallet (Airdrop-Snapshot)
3. Prize: 10x 1k USDC
```

### 12.2 KOL-Outreach (T-10)
```
- Blockchain-Ben (YouTube)
- Crypto-Twitter-Influencer (>50k Follower)
- Budget: 5k USDC für 3 Videos
```

### 12.3 Launch-Day (T-0, 18:00 UTC)
```
1. Twitter-Space live
2. Gleam-Draw live
3. Contract-Unpause via Multi-Sig
4. First 100 Mints = "Launch-Relic"-Trait
```

### 12.4 Post-Launch (T+1)
```
- CoinTelegraph-Artikel (bezahlt, 2k USDC)
- Reddit r/CryptoCurrency-Post
- Dune-Dashboard live
```

✅ **Checkpoint**: TVL >$1M in ersten 24h

---

## 🚨 NOTFALL-PLAYBOOK

### Contract-Bug entdeckt
1. Multi-Sig → `pause()` (sofort)
2. Telegram-Announcement
3. Immunefi-Channel aktivieren
4. Fix → Audit → Upgrade (ERC-1967-Proxy)

### Server-Down
1. Cloudflare → Maintenance-Mode
2. Docker-Compose restart
3. Backup-Server aktivieren (falls vorhanden)

### Domain-Hijack
1. Cloudflare → DNS-Lock
2. Registrar kontaktieren
3. Notfall-Domain aktivieren (relic-chain.com)

---

## 📊 SUCCESS-METRICS (Monat 1)

| KPI | Ziel | Tracking |
|-----|------|----------|
| TVL | $5M | Dune-Dashboard |
| Unique-Wallets | 2000 | Subgraph |
| Telegram-Bot-Users | 5000 | PostgreSQL |
| Avg-Mint-Size | $500 | Smart-Contract-Events |
| Referral-Rate | 30% | TraitBridge-Data |

---

## 📚 WARTUNG & UPDATES

### Wöchentlich
- [ ] Grafana-Alerts prüfen
- [ ] Subgraph-Sync-Status
- [ ] Telegram-Bot-Error-Rate

### Monatlich
- [ ] Dependencies aktualisieren (npm audit)
- [ ] Backup-Test (DB-Restore)
- [ ] Multi-Sig-Rotation (Signer-Wechsel)

### Quartalsweise
- [ ] Security-Re-Audit
- [ ] Performance-Optimierung
- [ ] Feature-Roadmap-Review

---

## ✅ FINAL-CHECK vor Launch

- [ ] Alle Contracts verifiziert (Etherscan)
- [ ] Multi-Sig 3/5 aktiv
- [ ] Immunefi-Bounty live (50k USDC)
- [ ] Frontend SSL (A+-Rating)
- [ ] Bot-Uptime >99.9% (letzte 7 Tage)
- [ ] Monitoring-Alerts konfiguriert
- [ ] Legal-Opinion vorhanden
- [ ] Team-LinkedIn öffentlich
- [ ] Whitepaper 5 Sprachen online
- [ ] Emergency-Contacts 24/7 erreichbar

---

**🎉 Bereit für Mainnet? → GO!**