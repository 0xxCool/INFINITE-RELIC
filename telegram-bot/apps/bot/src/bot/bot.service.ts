import { Injectable, OnModuleInit } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class BotService implements OnModuleInit {
  private bot: TelegramBot;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const token = process.env.TG_TOKEN;
    if (!token) {
      console.error('❌ TG_TOKEN not set');
      return;
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.setupCommands();
    console.log('✅ Telegram Bot initialized');
  }

  private setupCommands() {
    // /start command
    this.bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const userId = msg.from.id.toString();
      const firstName = msg.from.first_name;
      const username = msg.from.username;
      const referralCode = match?.[1]; // From /start REF_CODE

      // Create or update user
      let user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        const newReferralCode = this.generateReferralCode();
        user = await this.prisma.user.create({
          data: {
            id: userId,
            username,
            firstName,
            referralCode: newReferralCode,
            referredBy: referralCode || undefined,
          },
        });
      }

      const miniAppUrl = process.env.MINI_APP_URL || 'https://relic-chain.io';
      const refLink = `https://t.me/${this.bot.options.username}?start=${user.referralCode}`;

      await this.bot.sendMessage(
        msg.chat.id,
        `🏛️ *Welcome to Infinite Relic!*\n\n` +
        `Earn 5-25% APR on RWA-backed NFTs.\n\n` +
        `🎁 Your Referral Link:\n\`${refLink}\`\n\n` +
        `Open the app to start earning:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Open Relic App',
                  web_app: { url: miniAppUrl },
                },
              ],
              [
                {
                  text: '📊 My Stats',
                  callback_data: 'stats',
                },
                {
                  text: '🎁 Quests',
                  callback_data: 'quests',
                },
              ],
            ],
          },
        }
      );
    });

    // /balance command
    this.bot.onText(/\/balance/, async (msg) => {
      await this.bot.sendMessage(
        msg.chat.id,
        `💰 *Your Balance*\n\nYield Tokens: — $YIELD\nRelics Owned: —\nTotal Value: — USDC`,
        { parse_mode: 'Markdown' }
      );
    });

    // /help command
    this.bot.onText(/\/help/, async (msg) => {
      await this.bot.sendMessage(
        msg.chat.id,
        `📖 *Relic Bot Commands*\n\n` +
        `/start - Welcome message\n` +
        `/balance - Check your balance\n` +
        `/quest - View available quests\n` +
        `/referral - Get your referral link\n` +
        `/help - Show this help`,
        { parse_mode: 'Markdown' }
      );
    });

    // Callback queries
    this.bot.on('callback_query', async (query) => {
      const data = query.data;

      if (data === 'stats') {
        await this.bot.answerCallbackQuery(query.id, {
          text: 'Opening stats...',
        });
        // Implement stats view
      } else if (data === 'quests') {
        await this.bot.answerCallbackQuery(query.id, {
          text: 'Loading quests...',
        });
        // Implement quests view
      }
    });
  }

  private generateReferralCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  async sendMessage(chatId: number, text: string, options?: any) {
    return this.bot.sendMessage(chatId, text, options);
  }
}
