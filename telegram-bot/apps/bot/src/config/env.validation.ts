/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup
 * Fails fast with clear error messages if any are missing
 */

interface EnvConfig {
  // Telegram Bot
  TG_TOKEN: string;

  // Database
  DATABASE_URL: string;
  REDIS_URL: string;

  // Mini App
  MINI_APP_URL: string;

  // Blockchain
  RPC_URL: string;
  VAULT_ADDRESS: string;

  // Optional
  OPENAI_API_KEY?: string;
  NODE_ENV?: string;
  PORT?: string;
}

export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required variables
  const requiredVars = [
    'TG_TOKEN',
    'DATABASE_URL',
    'REDIS_URL',
    'MINI_APP_URL',
    'RPC_URL',
    'VAULT_ADDRESS'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate formats
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must start with postgresql://');
  }

  if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('redis://')) {
    errors.push('REDIS_URL must start with redis://');
  }

  if (process.env.VAULT_ADDRESS && !process.env.VAULT_ADDRESS.startsWith('0x')) {
    errors.push('VAULT_ADDRESS must be a valid Ethereum address (start with 0x)');
  }

  if (process.env.MINI_APP_URL && !process.env.MINI_APP_URL.startsWith('https://')) {
    errors.push('MINI_APP_URL must use HTTPS');
  }

  // If there are errors, fail fast
  if (errors.length > 0) {
    console.error('❌ ENVIRONMENT VALIDATION FAILED\n');
    console.error('The following issues were found:\n');
    errors.forEach((error, i) => {
      console.error(`${i + 1}. ${error}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('See .env.example for reference.\n');
    process.exit(1);
  }

  // Warnings for optional variables
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set - AI features will use fallback messages');
  }

  console.log('✅ Environment validation passed');

  return {
    TG_TOKEN: process.env.TG_TOKEN!,
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL!,
    MINI_APP_URL: process.env.MINI_APP_URL!,
    RPC_URL: process.env.RPC_URL!,
    VAULT_ADDRESS: process.env.VAULT_ADDRESS!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3001'
  };
}
