import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        quests: true,
        claims: true,
        referrals: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Calculate stats
    const completedQuests = user.quests.filter((q) => q.status === 'CLAIMED').length;
    const totalEarned = user.claims.reduce((sum, claim) => sum + claim.amount, 0);
    const referralCount = user.referrals.length;

    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      createdAt: user.createdAt,
      stats: {
        totalQuests: user.quests.length,
        completedQuests,
        totalEarned,
        referralCount,
        referralCode: user.referralCode,
      },
    };
  }

  async getReferralLink(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const botUsername = process.env.TG_BOT_USERNAME || 'infiniterelic_bot';
    const referralLink = `https://t.me/${botUsername}?start=${user.referralCode}`;

    return {
      referralCode: user.referralCode,
      referralLink,
    };
  }
}
