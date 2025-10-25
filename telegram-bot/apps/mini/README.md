# Infinite Relic - Telegram Mini App

SvelteKit-based Telegram Mini App for Infinite Relic protocol.

## Features

- **Dashboard**: User stats, quick actions
- **Mint**: Lock USDC and mint Relic NFTs
- **Portfolio**: View and manage your Relics, claim yield
- **Quests**: Complete daily quests for rewards
- **Referrals**: Invite friends and earn

## Tech Stack

- **Framework**: SvelteKit 2.5
- **Web3**: Wagmi 2.9, Viem 2.13
- **Telegram**: @telegram-apps/sdk
- **Styling**: Tailwind CSS 3.4
- **Network**: Arbitrum Sepolia / Arbitrum One

## Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

```env
PUBLIC_API_URL=http://localhost:3001
PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
PORT=3002
```

## Integration with Telegram Bot

The bot (`apps/bot`) launches this Mini App via a button:

```typescript
const keyboard = {
  inline_keyboard: [
    [{
      text: '🚀 Open App',
      web_app: { url: 'https://mini.infiniterelic.xyz' }
    }]
  ]
};
```

## Deployment

### Docker

```bash
docker build -t relic-mini .
docker run -p 3002:3002 --env-file .env relic-mini
```

### Vercel

```bash
npm install -g vercel
vercel --prod
```

Update bot service with deployed URL.

## Authentication

All API requests include Telegram init data for authentication:

```typescript
headers: {
  'X-Telegram-Init-Data': window.Telegram.WebApp.initData
}
```

Backend validates this using Telegram's crypto algorithm.

## Testing in Telegram

1. Set Mini App URL in BotFather
2. Open bot, click "Open App"
3. Test on both mobile and desktop

## Structure

```
src/
├── routes/
│   ├── +page.svelte          # Dashboard
│   ├── mint/+page.svelte     # Mint Relic
│   ├── portfolio/+page.svelte # Portfolio
│   ├── quests/+page.svelte   # Quests
│   └── referrals/+page.svelte # Referrals
├── lib/
│   ├── telegram.ts           # Telegram SDK utils
│   ├── wagmi.ts              # Web3 config
│   └── api.ts                # Backend API client
├── app.html                  # HTML template
└── app.css                   # Global styles
```

## UI/UX Guidelines

- **Haptic Feedback**: Used on all interactions
- **Back Button**: Shown on inner pages
- **Main Button**: Used for primary actions
- **Safe Areas**: Handled with safe-top/safe-bottom
- **Loading States**: Skeletons for better UX
- **Error Handling**: User-friendly alerts

## License

MIT
