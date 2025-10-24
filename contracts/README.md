# 🏛️ Infinite Relic - Smart Contracts

Real-World-Asset-backed, AI-gamified NFT yield system on Arbitrum.

## 📦 Contracts

| Contract | Description | Status |
|----------|-------------|--------|
| `RelicVault.sol` | Main vault: handles deposits, RWA investment, yield distribution | ✅ Complete |
| `RelicNFT.sol` | ERC-721 NFT with lock period metadata | ✅ Complete |
| `YieldToken.sol` | ERC-20 yield token ($YIELD) | ✅ Complete |
| `MockUSDC.sol` | 6-decimal USDC for testing | ✅ Complete |
| `MockRWAAdapter.sol` | ERC-4626 vault simulating Ondo OUSG | ✅ Complete |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Run coverage
npm run coverage

# Deploy to Arbitrum Sepolia
cp .env.example .env
# Fill in PRIVATE_KEY and other vars
npm run deploy:sepolia
```

## 🧪 Tests

```bash
npm run test

# Expected output:
#   RelicVault
#     Deployment
#       ✓ Should set the correct owner
#       ✓ Should have correct token addresses
#       ...
#   35 passing (4s)

npm run coverage
# Target: 100% Statements, Branches, Functions, Lines
```

## 📝 .env Configuration

```bash
PRIVATE_KEY=0x...                                      # Your wallet private key
ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARB_MAINNET_RPC=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=...                                  # From arbiscan.io
```

## 🔐 Security Features

- ✅ ReentrancyGuard on all external value-handling functions
- ✅ Pausable for emergency stops
- ✅ Ownable for admin functions
- ✅ SafeERC20 for token transfers
- ✅ Custom errors for gas efficiency
- ✅ Events for all state changes

## 📊 Economics

- **Dev Fee**: 1% on principal (taken immediately on mint)
- **Performance Fee**: 10% on yield above 15% APR
- **Baseline Yield**: 5% APR (daily claimable)
- **Lock Periods**: 30, 90, 180, 365 days
- **Minimum Deposit**: 10 USDC

## 🔍 Verification

After deployment:

```bash
npx hardhat verify --network arbSepolia <VAULT_ADDR> <USDC> <NFT> <YIELD> <RWA>
```

## 📚 Documentation

- [Infinite_Relic.md](../Infinite_Relic.md) - Complete technical specification
- [relic_master_guide.md](../relic_master_guide.md) - 12-phase implementation guide
- [PROJECT_ANALYSIS.md](../PROJECT_ANALYSIS.md) - Deep analysis & completeness check

## 🏗️ Architecture

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ mintRelic(lockDays, usdcAmount)
       ▼
┌─────────────────┐
│  RelicVault.sol │
├─────────────────┤
│ 1% dev fee      │
│ 99% → RWA       │
│ Mint NFT        │
│ Track yield     │
└────────┬────────┘
         │
         ├──→ RelicNFT (ERC-721)
         ├──→ YieldToken (ERC-20)
         └──→ RWA Adapter (ERC-4626)
```

## ⚠️ Known Limitations

- **Testnet Only**: MockRWAAdapter simulates 5% APR, real Ondo integration needed for mainnet
- **No Upgradability**: Contracts are immutable (use proxy pattern for production)
- **No Access Control**: Only basic Ownable, consider multi-sig for mainnet
- **No Chainlink VRF**: Mystery-Relic feature not yet implemented

## 🔜 Next Steps

1. ✅ Security Audit (Certora / Trail of Bits)
2. ✅ Integrate real Ondo OUSG adapter
3. ✅ Add Chainlink VRF for Mystery Relics
4. ✅ Implement ERC-1967 proxy for upgradability
5. ✅ Multi-sig setup for production

## 📄 License

MIT
