# 🎨 Infinite Relic - Frontend

Next.js 14 frontend for the Infinite Relic RWA-backed NFT yield system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in your values

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## 📦 Tech Stack

- **Framework:** Next.js 14.2.5 (App Router)
- **Styling:** Tailwind CSS 3.4
- **Web3:** Wagmi 2.9 + Viem 2.13
- **Wallet:** RainbowKit 2.1
- **Animations:** Framer Motion 11.2
- **3D:** Spline React 3.1

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_WC_PROJECT_ID=          # WalletConnect Cloud ID
NEXT_PUBLIC_VAULT_ADDR=             # RelicVault contract
NEXT_PUBLIC_USDC_ADDR=              # USDC contract
NEXT_PUBLIC_RELIC_NFT_ADDR=         # RelicNFT contract
NEXT_PUBLIC_YIELD_TOKEN_ADDR=       # YieldToken contract
NEXT_PUBLIC_ARB_SEPOLIA_RPC=        # Arbitrum Sepolia RPC
```

### Contract ABIs

Located in `src/lib/abis.ts` - extracted from compiled contracts.

## 📁 Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage (Hero + LockGrid)
│   └── dashboard/
│       └── page.tsx        # User dashboard
├── components/
│   ├── Header.tsx          # Navigation + ConnectButton
│   ├── Footer.tsx          # Footer
│   ├── Hero3D.tsx          # Spline 3D hero section
│   ├── LockCard.tsx        # Individual lock period card
│   └── LockGrid.tsx        # Grid of all lock periods
├── lib/
│   ├── providers.tsx       # Wagmi + RainbowKit setup
│   ├── config.ts           # Constants, lock periods
│   └── abis.ts             # Contract ABIs
└── styles/
    └── globals.css         # Tailwind + custom styles
```

## 🎨 Design System

### Colors

```css
--bg: #0B0C0E          /* Main background */
--bg-light: #1A1B1E    /* Cards/panels */
--primary: #FBBF24     /* Gold/yellow */
--secondary: #22D3EE   /* Cyan */
--accent: #F472B6      /* Pink */
```

### Components

- **`.glass`** - Glassmorphism effect
- **`.btn-primary`** - Primary CTA button
- **`.card`** - Standard card container
- **`.gradient-text`** - Animated gradient text

## 🔌 Web3 Integration

### Wagmi Hooks Used

```typescript
// Read contract data
useReadContract({ address, abi, functionName, args });

// Write to contract
useWriteContract();
useWaitForTransactionReceipt({ hash });

// User account
useAccount();
```

### Mint Flow

1. User enters amount
2. Check USDC allowance
3. If needed: Approve USDC
4. Call `mintRelic(lockDays, amount)`
5. Wait for transaction
6. Display success/error

## 🎭 3D Assets

The Hero section uses Spline for 3D. To add your scene:

1. Create scene at [spline.design](https://spline.design)
2. Export → Get URL
3. Update `Hero3D.tsx`:

```typescript
<Spline scene="https://prod.spline.design/YOUR_ID/scene.splinecode" />
```

**Placeholder:** Currently shows a spinning loader until you add your Spline scene.

## 📱 Pages

### Home (`/`)
- Hero with 3D animation
- Stats overview
- Lock period selection grid
- Mint functionality

### Dashboard (`/dashboard`)
- User stats (Relics owned, Yield balance)
- List of owned Relics
- Claim functionality (TODO)

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git add .
git commit -m "feat: add frontend"
git push

# In Vercel Dashboard:
1. Import repository
2. Framework: Next.js
3. Add environment variables
4. Deploy
```

### Environment Variables on Vercel

Add all variables from `.env.local.example` in:
**Settings → Environment Variables**

## 📊 Performance

- Lighthouse Score Target: 90+
- First Contentful Paint: <2s
- Time to Interactive: <3s

Optimizations:
- Dynamic imports for Spline
- Image optimization
- Route prefetching
- CSS purging via Tailwind

## 🔐 Security

- No private keys in frontend
- All transactions signed by user wallet
- Read-only contract calls for data
- Environment variables never exposed

## 🐛 Known Issues

- **Spline Scene:** Placeholder URL - replace with your scene
- **Contract Addresses:** Update after Phase 1 deployment
- **RPC Rate Limits:** Use Alchemy/Infura for production

## 🎯 Next Steps

- [ ] Add Relic detail pages (`/relic/[tokenId]`)
- [ ] Implement claim functionality in Dashboard
- [ ] Add referral system UI
- [ ] Integrate The Graph for historical data
- [ ] Add wallet disconnect UI
- [ ] Mobile responsive testing
- [ ] Add loading states
- [ ] Error boundary components
- [ ] SEO optimization

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Wagmi Docs](https://wagmi.sh)
- [RainbowKit Docs](https://rainbowkit.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Spline](https://spline.design)

## 🆘 Troubleshooting

### "Module not found: Can't resolve 'wagmi'"

```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

### "window is not defined"

Ensure client components use `'use client'` directive.

### Wallet not connecting

1. Check WalletConnect Project ID
2. Verify chain configuration
3. Clear browser cache

---

**Made with ❤️ for the Infinite Relic community**
