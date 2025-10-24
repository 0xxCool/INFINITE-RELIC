# 🤖 Infinite Relic - Telegram Bot

AI-gamified Telegram bot with Mini-App for Infinite Relic.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cd apps/bot
cp .env.example .env
# Fill in your values

# Start with Docker
docker-compose up -d

# Or run locally:
npm run bot:dev
```

## 📦 Architecture

```
telegram-bot/
├── apps/
│   ├── bot/              # NestJS backend
│   │   ├── src/
│   │   │   ├── bot/      # Telegram bot logic
│   │   │   ├── quest/    # Quest system
│   │   │   └── prisma/   # Database service
│   │   └── prisma/
│   │       └── schema.prisma
│   └── mini/             # SvelteKit Mini-App (TODO)
└── docker-compose.yml
```

## 🔧 Configuration

### Environment Variables

```bash
# .env
TG_TOKEN=                 # From @BotFather
OPENAI_API_KEY=           # From OpenAI
DATABASE_URL=             # PostgreSQL connection
REDIS_URL=                # Redis connection
MINI_APP_URL=             # Frontend URL
PORT=3001
```

### Telegram Bot Setup

1. Open Telegram
2. Search for `@BotFather`
3. Send `/newbot`
4. Follow instructions
5. Copy token to `.env`

### Mini-App Setup

```bash
# In @BotFather:
/newapp
# Select your bot
# Provide title, description, photo
# Set Web App URL: https://relic-chain.io
```

## 💾 Database

### Prisma Schema

- **User:** Telegram users, referral codes
- **Quest:** Daily quests, rewards
- **Claim:** Yield claim history

### Migrations

```bash
cd apps/bot
npx prisma migrate dev --name init
npx prisma generate
```

## 🎮 Features

### Bot Commands

- `/start [ref_code]` - Welcome + referral tracking
- `/balance` - Check YIELD balance
- `/quest` - View available quests
- `/referral` - Get referral link
- `/help` - Command list

### Quest System

**Daily Quest:** Check-in for 0.5 $YIELD
- Distributed at 9 AM UTC daily
- 24-hour cooldown
- Cron job automated

**Future Quests:**
- Share on Twitter
- Refer 3 friends
- Compound 3 times
- Exit warnings

### Referral System

- Unique code per user (8 chars)
- Track referral tree
- Bonus rewards for referrers

## 🐳 Docker

### Start Services

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f bot
```

### Stop Services

```bash
docker-compose down
```

## 📊 Monitoring

### Grafana Dashboard

Access: `http://localhost:3030`
- Username: `admin`
- Password: `relic`

### Prometheus Metrics

Access: `http://localhost:9090`

Metrics tracked:
- Bot uptime
- Quest distribution rate
- User growth
- Error rates

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🔐 Security

- No private keys stored
- User IDs hashed
- Rate limiting via Redis
- GDPR-compliant data handling

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
bot:
  deploy:
    replicas: 3
```

### Queue System (BullMQ)

For high-load scenarios:
- Quest distribution
- Notifications
- Batch operations

## 🚀 Deployment

### Production Checklist

- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Enable Redis persistence
- [ ] Configure log rotation
- [ ] Set up backup strategy
- [ ] Enable Prometheus alerts
- [ ] Configure rate limits

### Fly.io Deployment

```bash
fly launch --name relic-bot
fly secrets set TG_TOKEN=...
fly secrets set OPENAI_API_KEY=...
fly deploy
```

## 🐛 Troubleshooting

**Bot not responding:**
```bash
docker-compose logs bot
# Check TG_TOKEN is set
# Verify bot is running: /status in Telegram
```

**Database connection failed:**
```bash
docker-compose ps
# Ensure postgres is healthy
# Check DATABASE_URL format
```

**Quest not distributing:**
```bash
# Check cron logs
docker-compose exec bot npm run logs
```

## 📚 Next Steps

- [ ] Implement SvelteKit Mini-App
- [ ] Add OpenAI integration for smart responses
- [ ] Implement exit warnings (24h before unlock)
- [ ] Add on-chain data fetching (viem)
- [ ] Create admin dashboard
- [ ] Add i18n support

## 🔗 Resources

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)

---

**Made with ❤️ for the Infinite Relic community**
