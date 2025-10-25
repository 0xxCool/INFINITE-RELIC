import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  // Validate environment variables before starting
  const config = validateEnv();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log']
  });

  // CORS configuration - restrict in production
  app.enableCors({
    origin: config.NODE_ENV === 'production'
      ? [config.MINI_APP_URL, 'https://infiniterelic.xyz']
      : '*',
    credentials: true,
  });

  const port = config.PORT;
  await app.listen(port);

  console.log('='.repeat(60));
  console.log('🚀 INFINITE RELIC BOT API');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${port}`);
  console.log(`📱 Telegram Bot active`);
  console.log(`🌐 Mini-App URL: ${config.MINI_APP_URL}`);
  console.log(`🔗 Vault Address: ${config.VAULT_ADDRESS}`);
  console.log(`⚙️  Environment: ${config.NODE_ENV}`);
  console.log('='.repeat(60));
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
