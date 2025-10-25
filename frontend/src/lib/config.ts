import { arbitrumSepolia, arbitrum } from 'wagmi/chains';
import { ENV } from './env';

export const CONTRACTS = {
  VAULT: ENV.VAULT_ADDRESS,
  USDC: ENV.USDC_ADDRESS,
  RELIC_NFT: ENV.NFT_ADDRESS,
  YIELD_TOKEN: ENV.YIELD_TOKEN_ADDRESS,
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
