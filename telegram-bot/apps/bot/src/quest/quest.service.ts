import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BotService } from '../bot/bot.service';

@Injectable()
export class QuestService {
  constructor(
    private prisma: PrismaService,
    private bot: BotService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async distributeDailyQuests() {
    console.log('📅 Distributing daily quests...');

    const users = await this.prisma.user.findMany();
    const now = new Date();
    const cooldownEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    for (const user of users) {
      // Create daily quest
      await this.prisma.quest.create({
        data: {
          userId: user.id,
          type: 'DAILY_CHECKIN',
          reward: 0.5,
          cooldownEnd,
        },
      });

      // Notify user
      try {
        await this.bot.sendMessage(
          parseInt(user.id),
          `🎁 *Daily Quest Available!*\n\nClaim 0.5 $YIELD tokens\n\nOpen the app to claim →`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🎁 Claim Quest',
                    web_app: { url: process.env.MINI_APP_URL || 'https://relic-chain.io' },
                  },
                ],
              ],
            },
          }
        );
      } catch (error) {
        console.error(`Failed to notify user ${user.id}:`, error.message);
      }
    }

    console.log(`✅ Distributed quests to ${users.length} users`);
  }

  async claimQuest(userId: string, questId: number) {
    const quest = await this.prisma.quest.findFirst({
      where: {
        id: questId,
        userId,
        status: 'AVAILABLE',
      },
    });

    if (!quest) {
      throw new Error('Quest not found or already claimed');
    }

    if (new Date() > quest.cooldownEnd) {
      await this.prisma.quest.update({
        where: { id: questId },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Quest expired');
    }

    // Mark as claimed
    await this.prisma.quest.update({
      where: { id: questId },
      data: {
        status: 'CLAIMED',
        claimedAt: new Date(),
      },
    });

    // Record claim
    await this.prisma.claim.create({
      data: {
        userId,
        amount: quest.reward,
      },
    });

    return { reward: quest.reward };
  }
}
