/**
 * Environment Variable Validation for Frontend
 *
 * Validates required environment variables at build/runtime
 * Provides type-safe access to environment variables
 */

function validateAddress(address: string | undefined, name: string): `0x${string}` {
  if (!address) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  if (!address.startsWith('0x')) {
    throw new Error(`${name} must be a valid Ethereum address (start with 0x)`);
  }
  if (address.length !== 42) {
    throw new Error(`${name} must be a 42-character Ethereum address`);
  }
  return address as `0x${string}`;
}

function validateRequired(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Validate at module load time (fail fast)
export const ENV = {
  // Contract Addresses
  VAULT_ADDRESS: validateAddress(
    process.env.NEXT_PUBLIC_VAULT_ADDR,
    'NEXT_PUBLIC_VAULT_ADDR'
  ),
  NFT_ADDRESS: validateAddress(
    process.env.NEXT_PUBLIC_NFT_ADDR || process.env.NEXT_PUBLIC_RELIC_NFT_ADDR,
    'NEXT_PUBLIC_NFT_ADDR or NEXT_PUBLIC_RELIC_NFT_ADDR'
  ),
  USDC_ADDRESS: validateAddress(
    process.env.NEXT_PUBLIC_USDC_ADDR || '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum USDC
    'NEXT_PUBLIC_USDC_ADDR'
  ),
  YIELD_TOKEN_ADDRESS: validateAddress(
    process.env.NEXT_PUBLIC_YIELD_TOKEN_ADDR || process.env.NEXT_PUBLIC_VAULT_ADDR, // Default to vault address
    'NEXT_PUBLIC_YIELD_TOKEN_ADDR'
  ),

  // API Keys
  WC_PROJECT_ID: validateRequired(
    process.env.NEXT_PUBLIC_WC_PROJECT_ID,
    'NEXT_PUBLIC_WC_PROJECT_ID'
  ),
  ALCHEMY_ID: process.env.NEXT_PUBLIC_ALCHEMY_ID, // Optional

  // Configuration
  NETWORK: (process.env.NEXT_PUBLIC_NETWORK || 'arbitrum-sepolia') as 'arbitrum' | 'arbitrum-sepolia',

  // Optional
  SPLINE_SCENE_ID: process.env.NEXT_PUBLIC_SPLINE_SCENE_ID || '',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
} as const;

// Log validation status (only in development)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('✅ Frontend environment validation passed');
  console.log('📍 Network:', ENV.NETWORK);
  console.log('🔗 Vault:', ENV.VAULT_ADDRESS);
  console.log('💎 NFT:', ENV.NFT_ADDRESS);

  if (!ENV.SPLINE_SCENE_ID) {
    console.warn('⚠️  NEXT_PUBLIC_SPLINE_SCENE_ID not set - 3D hero will not load');
  }
}
