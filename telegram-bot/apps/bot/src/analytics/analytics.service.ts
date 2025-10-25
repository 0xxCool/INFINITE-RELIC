import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPublicClient, http, formatUnits } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

/**
 * Analytics Service
 *
 * Advanced analytics engine providing:
 * - Real-time protocol metrics
 * - User performance tracking
 * - Market trend analysis
 * - Social trading signals
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private publicClient;

  constructor(private prisma: PrismaService) {
    // Initialize blockchain client
    this.publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(process.env.RPC_URL)
    });
  }

  /**
   * Get comprehensive protocol statistics
   */
  async getProtocolStats() {
    try {
      // Aggregate data from database and blockchain
      const [
        totalUsers,
        totalRelics,
        totalQuests,
        avgYield
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.aggregate({ _sum: { relicCount: true } }),
        this.prisma.quest.count({ where: { status: 'COMPLETED' } }),
        this.calculateAverageYield()
      ]);

      // Calculate growth metrics (7-day)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newUsersThisWeek = await this.prisma.user.count({
        where: { createdAt: { gte: weekAgo } }
      });

      return {
        protocol: {
          totalUsers,
          totalRelics: totalRelics._sum.relicCount || 0,
          totalQuests,
          avgYield: avgYield || 0
        },
        growth: {
          newUsers7d: newUsersThisWeek,
          growthRate: totalUsers > 0 ? (newUsersThisWeek / totalUsers * 100).toFixed(2) : 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get protocol stats:', error);
      throw error;
    }
  }

  /**
   * Get user-specific performance metrics
   */
  async getUserStats(address: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: address },
        include: {
          quests: {
            where: { status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' }
          },
          claims: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });

      if (!user) {
        return {
          exists: false,
          message: 'User not found'
        };
      }

      // Calculate total earnings
      const totalEarnings = user.claims.reduce((sum, claim) => sum + claim.amount, 0);

      // Calculate rank
      const rank = await this.calculateUserRank(address, totalEarnings);

      return {
        exists: true,
        address,
        stats: {
          totalEarned: totalEarnings,
          questsCompleted: user.quests.length,
          referrals: user.referralCount || 0,
          rank,
          tier: this.getTier(totalEarnings)
        },
        recentActivity: user.claims.slice(0, 5).map(claim => ({
          amount: claim.amount,
          timestamp: claim.timestamp,
          questId: claim.questId
        })),
        achievements: this.calculateAchievements(user)
      };
    } catch (error) {
      this.logger.error('Failed to get user stats:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard of top performers
   */
  async getLeaderboard(timeframe: '7d' | '30d' | 'all' = 'all', limit: number = 100) {
    try {
      let dateFilter = {};

      if (timeframe !== 'all') {
        const days = timeframe === '7d' ? 7 : 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        dateFilter = { timestamp: { gte: since } };
      }

      // Get users with most earnings
      const users = await this.prisma.user.findMany({
        include: {
          claims: {
            where: dateFilter
          }
        },
        take: limit
      });

      // Calculate and sort by earnings
      const leaderboard = users
        .map(user => ({
          address: user.id,
          username: user.username || 'Anonymous',
          totalEarned: user.claims.reduce((sum, claim) => sum + claim.amount, 0),
          questsCompleted: user.claims.length,
          tier: this.getTier(user.claims.reduce((sum, claim) => sum + claim.amount, 0))
        }))
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, limit)
        .map((user, index) => ({
          rank: index + 1,
          ...user
        }));

      return {
        timeframe,
        leaderboard,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get market trends and insights
   */
  async getMarketTrends(period: '24h' | '7d' | '30d' = '7d') {
    try {
      const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Aggregate activity over time
      const claims = await this.prisma.claim.findMany({
        where: {
          timestamp: { gte: since }
        },
        orderBy: { timestamp: 'asc' }
      });

      // Group by day
      const dailyData = this.groupByDay(claims);

      // Calculate trends
      const totalVolume = claims.reduce((sum, claim) => sum + claim.amount, 0);
      const avgDailyVolume = totalVolume / days;

      // Predict next period (simple moving average)
      const prediction = this.predictNextPeriod(dailyData);

      return {
        period,
        metrics: {
          totalVolume,
          avgDailyVolume,
          totalTransactions: claims.length,
          avgTransactionSize: claims.length > 0 ? totalVolume / claims.length : 0
        },
        dailyData,
        prediction,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get market trends:', error);
      throw error;
    }
  }

  /**
   * Get APR history for a specific lock period
   */
  async getAPRHistory(lockDays: number, days: number = 30) {
    try {
      // This would ideally pull from DynamicAPROracle events
      // For now, simulate historical data

      const history = [];
      const now = Date.now();

      for (let i = days; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);

        // Simulated APR (would be real data in production)
        const baseAPR = this.getBaseAPR(lockDays);
        const variance = Math.random() * 2 - 1; // -1% to +1% variance
        const apr = baseAPR + variance;

        history.push({
          date: date.toISOString().split('T')[0],
          apr: apr.toFixed(2),
          multiplier: (1 + variance / baseAPR).toFixed(4)
        });
      }

      return {
        lockDays,
        period: `${days} days`,
        history,
        current: history[history.length - 1],
        average: (history.reduce((sum, h) => sum + parseFloat(h.apr), 0) / history.length).toFixed(2),
        high: Math.max(...history.map(h => parseFloat(h.apr))).toFixed(2),
        low: Math.min(...history.map(h => parseFloat(h.apr))).toFixed(2)
      };
    } catch (error) {
      this.logger.error('Failed to get APR history:', error);
      throw error;
    }
  }

  /**
   * Get real-time marketplace activity
   */
  async getMarketplaceActivity() {
    try {
      // This would pull from RelicMarketplace contract events
      // Simulated for now

      return {
        activeListings: 0, // Would query marketplace contract
        last24hVolume: 0,
        last24hTrades: 0,
        avgPrice: 0,
        priceChange24h: 0,
        topSale: null,
        recentTrades: [] // Last 10 trades
      };
    } catch (error) {
      this.logger.error('Failed to get marketplace activity:', error);
      throw error;
    }
  }

  /**
   * Get social trading signals
   */
  async getTradingSignals() {
    try {
      // Analyze top performers' recent actions
      const topUsers = await this.getLeaderboard('7d', 10);

      const signals = [];

      // Signal: High activity in specific lock period
      const lockPeriodActivity = await this.analyzeLockPeriodPreferences();
      if (lockPeriodActivity.trending) {
        signals.push({
          type: 'LOCK_PERIOD_TREND',
          confidence: 'high',
          message: `Top performers are favoring ${lockPeriodActivity.period}-day locks`,
          data: lockPeriodActivity
        });
      }

      // Signal: Unusual APR spike
      const aprAnalysis = await this.analyzeAPRTrends();
      if (aprAnalysis.spike) {
        signals.push({
          type: 'APR_SPIKE',
          confidence: 'medium',
          message: `${aprAnalysis.lockDays}-day APR is ${aprAnalysis.change}% above average`,
          data: aprAnalysis
        });
      }

      return {
        signals,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get trading signals:', error);
      throw error;
    }
  }

  /**
   * Get portfolio composition insights
   */
  async getPortfolioComposition() {
    try {
      // Aggregate lock periods across all users
      // This would query blockchain for actual data

      return {
        byLockPeriod: {
          '30days': { count: 0, totalValue: 0, percentage: 0 },
          '90days': { count: 0, totalValue: 0, percentage: 0 },
          '180days': { count: 0, totalValue: 0, percentage: 0 },
          '365days': { count: 0, totalValue: 0, percentage: 0 }
        },
        totalValue: 0,
        totalCount: 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get portfolio composition:', error);
      throw error;
    }
  }

  // Helper methods

  private async calculateAverageYield(): Promise<number> {
    const claims = await this.prisma.claim.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' }
    });

    if (claims.length === 0) return 0;

    const total = claims.reduce((sum, claim) => sum + claim.amount, 0);
    return total / claims.length;
  }

  private async calculateUserRank(address: string, earnings: number): Promise<number> {
    const usersWithMoreEarnings = await this.prisma.user.count({
      where: {
        claims: {
          some: {}
        }
      }
    });

    // This is simplified - would need proper ranking logic
    return usersWithMoreEarnings + 1;
  }

  private getTier(earnings: number): string {
    if (earnings >= 10000) return 'Infinite';
    if (earnings >= 5000) return 'Gold';
    if (earnings >= 1000) return 'Silver';
    if (earnings >= 100) return 'Copper';
    return 'Bronze';
  }

  private calculateAchievements(user: any): string[] {
    const achievements = [];

    if (user.claims.length >= 100) achievements.push('Century Club');
    if (user.claims.length >= 10) achievements.push('Active Trader');
    if (user.referralCount >= 10) achievements.push('Social Butterfly');
    if (user.quests.length >= 30) achievements.push('Quest Master');

    return achievements;
  }

  private groupByDay(claims: any[]): any[] {
    const groups = new Map();

    claims.forEach(claim => {
      const day = claim.timestamp.toISOString().split('T')[0];
      if (!groups.has(day)) {
        groups.set(day, { date: day, volume: 0, count: 0 });
      }
      const group = groups.get(day);
      group.volume += claim.amount;
      group.count += 1;
    });

    return Array.from(groups.values());
  }

  private predictNextPeriod(dailyData: any[]): any {
    if (dailyData.length < 3) return null;

    // Simple moving average prediction
    const recent = dailyData.slice(-7);
    const avgVolume = recent.reduce((sum, d) => sum + d.volume, 0) / recent.length;
    const avgCount = recent.reduce((sum, d) => sum + d.count, 0) / recent.length;

    return {
      predictedVolume: avgVolume.toFixed(2),
      predictedCount: Math.round(avgCount),
      confidence: 'medium'
    };
  }

  private getBaseAPR(lockDays: number): number {
    const rates = {
      30: 6,
      90: 8,
      180: 11,
      365: 15
    };
    return rates[lockDays] || 5;
  }

  private async analyzeLockPeriodPreferences(): Promise<any> {
    // Simplified - would analyze actual user behavior
    return {
      trending: false,
      period: 90
    };
  }

  private async analyzeAPRTrends(): Promise<any> {
    // Simplified - would analyze actual APR data
    return {
      spike: false,
      lockDays: 90,
      change: 0
    };
  }
}
