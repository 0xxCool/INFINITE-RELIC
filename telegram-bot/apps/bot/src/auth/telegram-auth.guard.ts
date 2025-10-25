import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const initData = request.headers['x-telegram-init-data'];

    if (!initData) {
      throw new UnauthorizedException('Missing Telegram init data');
    }

    const botToken = process.env.TG_TOKEN;
    if (!botToken) {
      throw new Error('TG_TOKEN environment variable not set');
    }

    if (!this.verifyTelegramAuth(initData, botToken)) {
      throw new UnauthorizedException('Invalid Telegram init data');
    }

    // Parse user data from initData
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    if (userParam) {
      try {
        request.telegramUser = JSON.parse(userParam);
      } catch (error) {
        throw new UnauthorizedException('Invalid user data');
      }
    }

    return true;
  }

  private verifyTelegramAuth(initData: string, botToken: string): boolean {
    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');

      if (!hash) {
        return false;
      }

      // Remove hash from params
      params.delete('hash');

      // Create data-check-string
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Calculate secret key
      const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Calculate hash
      const calculatedHash = createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      return calculatedHash === hash;
    } catch (error) {
      console.error('Error verifying Telegram auth:', error);
      return false;
    }
  }
}
