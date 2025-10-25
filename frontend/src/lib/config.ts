import { arbitrumSepolia, arbitrum } from 'wagmi/chains';

export const CONTRACTS = {
  VAULT: process.env.NEXT_PUBLIC_VAULT_ADDR as `0x${string}`,
  USDC: process.env.NEXT_PUBLIC_USDC_ADDR as `0x${string}`,
  RELIC_NFT: process.env.NEXT_PUBLIC_RELIC_NFT_ADDR as `0x${string}`,
  YIELD_TOKEN: process.env.NEXT_PUBLIC_YIELD_TOKEN_ADDR as `0x${string}`,
} as const;

export const CHAINS = {
  TESTNET: arbitrumSepolia,
  MAINNET: arbitrum,
} as const;

export const LOCK_PERIODS = [
  {
    days: 30,
    label: '30 Days',
    trait: 'Copper',
    baseAPR: 5,
    boostCap: 2,
    color: 'from-orange-600 to-orange-400',
    description: 'Flexible entry point',
  },
  {
    days: 90,
    label: '90 Days',
    trait: 'Silver',
    baseAPR: 5,
    boostCap: 5,
    color: 'from-gray-400 to-gray-200',
    description: 'Best value sweet spot',
  },
  {
    days: 180,
    label: '180 Days',
    trait: 'Gold',
    baseAPR: 5,
    boostCap: 8,
    color: 'from-yellow-400 to-yellow-200',
    description: 'Premium returns',
  },
  {
    days: 365,
    label: '365 Days',
    trait: 'Infinite',
    baseAPR: 5,
    boostCap: 12,
    color: 'from-purple-500 to-pink-500',
    description: 'Maximum yield potential',
  },
] as const;

export const MIN_DEPOSIT = 10; // USDC
export const USDC_DECIMALS = 6;
