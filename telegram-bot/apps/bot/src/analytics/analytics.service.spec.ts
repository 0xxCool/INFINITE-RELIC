/**
 * Analytics Service Unit Tests
 *
 * Required packages (add to package.json devDependencies):
 * - @nestjs/testing: ^10.3.7
 * - jest: ^29.7.0
 * - @types/jest: ^29.5.0
 * - ts-jest: ^29.1.0
 *
 * Run with: npm test analytics.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

  // Mock data
  const mockUser = {
    id: '123456',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    relicCount: 5,
    referralCount: 3,
    createdAt: new Date(),
    quests: [
      { id: 1, status: 'COMPLETED', completedAt: new Date(), reward: 0.5 },
      { id: 2, status: 'COMPLETED', completedAt: new Date(), reward: 1.0 },
    ],
    claims: [
      { id: 1, amount: 10, timestamp: new Date(), questId: 1 },
      { id: 2, amount: 20, timestamp: new Date(), questId: 2 },
      { id: 3, amount: 30, timestamp: new Date(), questId: 3 },
    ],
  };

  const mockClaims = [
    { id: 1, userId: '123', amount: 10, timestamp: new Date('2024-01-01') },
    { id: 2, userId: '456', amount: 20, timestamp: new Date('2024-01-01') },
    { id: 3, userId: '789', amount: 15, timestamp: new Date('2024-01-02') },
  ];

  // Mock PrismaService
  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    quest: {
      count: jest.fn(),
    },
    claim: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();

    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProtocolStats', () => {
    it('should return comprehensive protocol statistics', async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      mockPrismaService.user.count
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(10); // new users this week
      mockPrismaService.user.aggregate.mockResolvedValue({ _sum: { relicCount: 250 } });
      mockPrismaService.quest.count.mockResolvedValue(500);
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getProtocolStats();

      expect(result).toHaveProperty('protocol');
      expect(result).toHaveProperty('growth');
      expect(result).toHaveProperty('timestamp');
      expect(result.protocol.totalUsers).toBe(100);
      expect(result.protocol.totalRelics).toBe(250);
      expect(result.protocol.totalQuests).toBe(500);
      expect(result.growth.newUsers7d).toBe(10);
    });

    it('should calculate growth rate correctly', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(10);
      mockPrismaService.user.aggregate.mockResolvedValue({ _sum: { relicCount: 250 } });
      mockPrismaService.quest.count.mockResolvedValue(500);
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getProtocolStats();

      expect(result.growth.growthRate).toBe('10.00'); // 10/100 * 100 = 10%
    });

    it('should handle zero total users', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.user.aggregate.mockResolvedValue({ _sum: { relicCount: null } });
      mockPrismaService.quest.count.mockResolvedValue(0);
      mockPrismaService.claim.findMany.mockResolvedValue([]);

      const result = await service.getProtocolStats();

      expect(result.protocol.totalUsers).toBe(0);
      expect(result.protocol.totalRelics).toBe(0);
      expect(result.growth.growthRate).toBe(0);
    });

    it('should handle null relicCount aggregate', async () => {
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.user.aggregate.mockResolvedValue({ _sum: { relicCount: null } });
      mockPrismaService.quest.count.mockResolvedValue(500);
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getProtocolStats();

      expect(result.protocol.totalRelics).toBe(0);
    });

    it('should calculate average yield from recent claims', async () => {
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.user.aggregate.mockResolvedValue({ _sum: { relicCount: 250 } });
      mockPrismaService.quest.count.mockResolvedValue(500);
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getProtocolStats();

      const expectedAvg = (10 + 20 + 15) / 3;
      expect(result.protocol.avgYield).toBe(expectedAvg);
    });

    it('should handle database errors', async () => {
      mockPrismaService.user.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getProtocolStats()).rejects.toThrow('Database error');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.count.mockResolvedValue(5); // For rank calculation

      const result = await service.getUserStats('123456');

      expect(result.exists).toBe(true);
      expect(result.address).toBe('123456');
      expect(result.stats).toBeDefined();
      expect(result.recentActivity).toBeDefined();
      expect(result.achievements).toBeDefined();
    });

    it('should calculate total earnings correctly', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.count.mockResolvedValue(5);

      const result = await service.getUserStats('123456');

      const expectedEarnings = 10 + 20 + 30;
      expect(result.stats.totalEarned).toBe(expectedEarnings);
    });

    it('should return exists: false if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserStats('999999');

      expect(result.exists).toBe(false);
      expect(result.message).toBe('User not found');
    });

    it('should calculate quests completed correctly', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.count.mockResolvedValue(5);

      const result = await service.getUserStats('123456');

      expect(result.stats.questsCompleted).toBe(2); // mockUser has 2 completed quests
    });

    it('should include referral count', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.count.mockResolvedValue(5);

      const result = await service.getUserStats('123456');

      expect(result.stats.referrals).toBe(3);
    });

    it('should return only 5 recent activities', async () => {
      const userWithManyClaims = {
        ...mockUser,
        claims: Array(20).fill({ id: 1, amount: 10, timestamp: new Date(), questId: 1 }),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithManyClaims);
      mockPrismaService.user.count.mockResolvedValue(5);

      const result = await service.getUserStats('123456');

      expect(result.recentActivity.length).toBe(5);
    });

    it('should calculate tier correctly', async () => {
      const highEarningUser = {
        ...mockUser,
        claims: [{ id: 1, amount: 15000, timestamp: new Date(), questId: 1 }],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(highEarningUser);
      mockPrismaService.user.count.mockResolvedValue(5);

      const result = await service.getUserStats('123456');

      expect(result.stats.tier).toBe('Infinite'); // >= 10000
    });

    it('should calculate achievements', async () => {
      const achievementUser = {
        ...mockUser,
        claims: Array(100).fill({ id: 1, amount: 10, timestamp: new Date(), questId: 1 }),
        referralCount: 15,
        quests: Array(35).fill({ id: 1, status: 'COMPLETED' }),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(achievementUser);
      mockPrismaService.user.count.mockResolvedValue(5);

      const result = await service.getUserStats('123456');

      expect(result.achievements).toContain('Century Club');
      expect(result.achievements).toContain('Active Trader');
      expect(result.achievements).toContain('Social Butterfly');
      expect(result.achievements).toContain('Quest Master');
    });

    it('should handle database errors', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.getUserStats('123456')).rejects.toThrow('Database error');
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard with rankings', async () => {
      const users = [
        {
          id: '1',
          username: 'user1',
          claims: [{ amount: 100 }],
        },
        {
          id: '2',
          username: 'user2',
          claims: [{ amount: 50 }],
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.getLeaderboard('all', 100);

      expect(result.leaderboard).toBeDefined();
      expect(result.leaderboard[0].rank).toBe(1);
      expect(result.leaderboard[0].totalEarned).toBe(100);
      expect(result.leaderboard[1].rank).toBe(2);
      expect(result.leaderboard[1].totalEarned).toBe(50);
    });

    it('should sort by earnings descending', async () => {
      const users = [
        { id: '1', username: 'user1', claims: [{ amount: 50 }] },
        { id: '2', username: 'user2', claims: [{ amount: 100 }] },
        { id: '3', username: 'user3', claims: [{ amount: 75 }] },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.getLeaderboard('all', 100);

      expect(result.leaderboard[0].totalEarned).toBe(100);
      expect(result.leaderboard[1].totalEarned).toBe(75);
      expect(result.leaderboard[2].totalEarned).toBe(50);
    });

    it('should respect limit parameter', async () => {
      const users = Array(20).fill(null).map((_, i) => ({
        id: `${i}`,
        username: `user${i}`,
        claims: [{ amount: 10 }],
      }));

      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.getLeaderboard('all', 5);

      expect(result.leaderboard.length).toBeLessThanOrEqual(5);
    });

    it('should handle 7d timeframe', async () => {
      const users = [{ id: '1', username: 'user1', claims: [{ amount: 100, timestamp: new Date() }] }];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.getLeaderboard('7d', 100);

      expect(result.timeframe).toBe('7d');
    });

    it('should handle 30d timeframe', async () => {
      const users = [{ id: '1', username: 'user1', claims: [{ amount: 100, timestamp: new Date() }] }];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.getLeaderboard('30d', 100);

      expect(result.timeframe).toBe('30d');
    });

    it('should show Anonymous for users without username', async () => {
      const users = [
        { id: '1', username: null, claims: [{ amount: 100 }] },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.getLeaderboard('all', 100);

      expect(result.leaderboard[0].username).toBe('Anonymous');
    });

    it('should calculate tier for leaderboard entries', async () => {
      const users = [
        { id: '1', username: 'user1', claims: [{ amount: 15000 }] },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.getLeaderboard('all', 100);

      expect(result.leaderboard[0].tier).toBe('Infinite');
    });

    it('should handle database errors', async () => {
      mockPrismaService.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getLeaderboard('all', 100)).rejects.toThrow('Database error');
    });
  });

  describe('getMarketTrends', () => {
    it('should return market trends for 7d period', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getMarketTrends('7d');

      expect(result.period).toBe('7d');
      expect(result.metrics).toBeDefined();
      expect(result.dailyData).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should calculate total volume correctly', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getMarketTrends('7d');

      const expectedVolume = 10 + 20 + 15;
      expect(result.metrics.totalVolume).toBe(expectedVolume);
    });

    it('should calculate average daily volume', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getMarketTrends('7d');

      const totalVolume = 10 + 20 + 15;
      const avgDailyVolume = totalVolume / 7;
      expect(result.metrics.avgDailyVolume).toBeCloseTo(avgDailyVolume, 2);
    });

    it('should handle 24h period', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getMarketTrends('24h');

      expect(result.period).toBe('24h');
      expect(result.metrics.avgDailyVolume).toBe(45); // 45 / 1
    });

    it('should handle 30d period', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getMarketTrends('30d');

      expect(result.period).toBe('30d');
      expect(result.metrics.avgDailyVolume).toBeCloseTo(1.5, 2); // 45 / 30
    });

    it('should group claims by day', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getMarketTrends('7d');

      expect(result.dailyData).toBeInstanceOf(Array);
      expect(result.dailyData.length).toBeGreaterThan(0);
    });

    it('should provide prediction if enough data', async () => {
      const manyClaims = Array(10).fill(null).map((_, i) => ({
        id: i,
        userId: `${i}`,
        amount: 10,
        timestamp: new Date(`2024-01-${i + 1}`),
      }));

      mockPrismaService.claim.findMany.mockResolvedValue(manyClaims);

      const result = await service.getMarketTrends('7d');

      expect(result.prediction).toBeDefined();
      if (result.prediction) {
        expect(result.prediction).toHaveProperty('predictedVolume');
        expect(result.prediction).toHaveProperty('predictedCount');
        expect(result.prediction).toHaveProperty('confidence');
      }
    });

    it('should handle empty claims array', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue([]);

      const result = await service.getMarketTrends('7d');

      expect(result.metrics.totalVolume).toBe(0);
      expect(result.metrics.avgDailyVolume).toBe(0);
      expect(result.metrics.totalTransactions).toBe(0);
      expect(result.metrics.avgTransactionSize).toBe(0);
    });

    it('should handle database errors', async () => {
      mockPrismaService.claim.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getMarketTrends('7d')).rejects.toThrow('Database error');
    });
  });

  describe('getAPRHistory', () => {
    it('should return APR history for specified lock period', async () => {
      const result = await service.getAPRHistory(30, 7);

      expect(result.lockDays).toBe(30);
      expect(result.period).toBe('7 days');
      expect(result.history).toBeInstanceOf(Array);
      expect(result.history.length).toBe(8); // 7 days + current day
    });

    it('should calculate statistics correctly', async () => {
      const result = await service.getAPRHistory(90, 7);

      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('average');
      expect(result).toHaveProperty('high');
      expect(result).toHaveProperty('low');
    });

    it('should handle different lock periods', async () => {
      const periods = [30, 90, 180, 365];

      for (const period of periods) {
        const result = await service.getAPRHistory(period, 7);
        expect(result.lockDays).toBe(period);
      }
    });

    it('should generate correct number of history entries', async () => {
      const result = await service.getAPRHistory(30, 30);

      expect(result.history.length).toBe(31); // 30 days + current
    });
  });

  describe('Helper Methods', () => {
    describe('getTier', () => {
      it('should return Bronze for low earnings', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getTier'](50)).toBe('Bronze');
      });

      it('should return Copper for 100+ earnings', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getTier'](150)).toBe('Copper');
      });

      it('should return Silver for 1000+ earnings', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getTier'](1500)).toBe('Silver');
      });

      it('should return Gold for 5000+ earnings', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getTier'](7500)).toBe('Gold');
      });

      it('should return Infinite for 10000+ earnings', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getTier'](15000)).toBe('Infinite');
      });

      it('should handle exact tier boundaries', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getTier'](100)).toBe('Copper');
        expect(service['getTier'](1000)).toBe('Silver');
        expect(service['getTier'](5000)).toBe('Gold');
        expect(service['getTier'](10000)).toBe('Infinite');
      });
    });

    describe('calculateAchievements', () => {
      it('should return Century Club for 100+ claims', () => {
        const service = new AnalyticsService(prismaService);
        const user = {
          claims: Array(100).fill({}),
          referralCount: 0,
          quests: [],
        };

        const achievements = service['calculateAchievements'](user);
        expect(achievements).toContain('Century Club');
      });

      it('should return Active Trader for 10+ claims', () => {
        const service = new AnalyticsService(prismaService);
        const user = {
          claims: Array(15).fill({}),
          referralCount: 0,
          quests: [],
        };

        const achievements = service['calculateAchievements'](user);
        expect(achievements).toContain('Active Trader');
      });

      it('should return Social Butterfly for 10+ referrals', () => {
        const service = new AnalyticsService(prismaService);
        const user = {
          claims: [],
          referralCount: 15,
          quests: [],
        };

        const achievements = service['calculateAchievements'](user);
        expect(achievements).toContain('Social Butterfly');
      });

      it('should return Quest Master for 30+ quests', () => {
        const service = new AnalyticsService(prismaService);
        const user = {
          claims: [],
          referralCount: 0,
          quests: Array(35).fill({}),
        };

        const achievements = service['calculateAchievements'](user);
        expect(achievements).toContain('Quest Master');
      });

      it('should return multiple achievements', () => {
        const service = new AnalyticsService(prismaService);
        const user = {
          claims: Array(100).fill({}),
          referralCount: 15,
          quests: Array(35).fill({}),
        };

        const achievements = service['calculateAchievements'](user);
        expect(achievements.length).toBe(4);
      });

      it('should return empty array for no achievements', () => {
        const service = new AnalyticsService(prismaService);
        const user = {
          claims: [],
          referralCount: 0,
          quests: [],
        };

        const achievements = service['calculateAchievements'](user);
        expect(achievements).toEqual([]);
      });
    });

    describe('getBaseAPR', () => {
      it('should return correct APR for 30 days', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getBaseAPR'](30)).toBe(6);
      });

      it('should return correct APR for 90 days', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getBaseAPR'](90)).toBe(8);
      });

      it('should return correct APR for 180 days', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getBaseAPR'](180)).toBe(11);
      });

      it('should return correct APR for 365 days', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getBaseAPR'](365)).toBe(15);
      });

      it('should return default APR for unknown period', () => {
        const service = new AnalyticsService(prismaService);
        expect(service['getBaseAPR'](60)).toBe(5);
      });
    });

    describe('groupByDay', () => {
      it('should group claims by day', () => {
        const service = new AnalyticsService(prismaService);
        const claims = [
          { amount: 10, timestamp: new Date('2024-01-01T10:00:00') },
          { amount: 20, timestamp: new Date('2024-01-01T15:00:00') },
          { amount: 15, timestamp: new Date('2024-01-02T12:00:00') },
        ];

        const result = service['groupByDay'](claims);

        expect(result.length).toBe(2);
        expect(result[0].volume).toBe(30); // 10 + 20
        expect(result[0].count).toBe(2);
        expect(result[1].volume).toBe(15);
        expect(result[1].count).toBe(1);
      });

      it('should handle empty array', () => {
        const service = new AnalyticsService(prismaService);
        const result = service['groupByDay']([]);
        expect(result).toEqual([]);
      });

      it('should handle single claim', () => {
        const service = new AnalyticsService(prismaService);
        const claims = [
          { amount: 10, timestamp: new Date('2024-01-01') },
        ];

        const result = service['groupByDay'](claims);

        expect(result.length).toBe(1);
        expect(result[0].volume).toBe(10);
        expect(result[0].count).toBe(1);
      });
    });

    describe('predictNextPeriod', () => {
      it('should return null if insufficient data', () => {
        const service = new AnalyticsService(prismaService);
        const dailyData = [
          { date: '2024-01-01', volume: 10, count: 1 },
          { date: '2024-01-02', volume: 20, count: 2 },
        ];

        const result = service['predictNextPeriod'](dailyData);
        expect(result).toBeNull();
      });

      it('should return prediction with sufficient data', () => {
        const service = new AnalyticsService(prismaService);
        const dailyData = Array(10).fill(null).map((_, i) => ({
          date: `2024-01-${i + 1}`,
          volume: 10,
          count: 2,
        }));

        const result = service['predictNextPeriod'](dailyData);

        expect(result).toBeDefined();
        expect(result).toHaveProperty('predictedVolume');
        expect(result).toHaveProperty('predictedCount');
        expect(result).toHaveProperty('confidence');
      });

      it('should use last 7 days for prediction', () => {
        const service = new AnalyticsService(prismaService);
        const dailyData = Array(20).fill(null).map((_, i) => ({
          date: `2024-01-${i + 1}`,
          volume: i < 13 ? 10 : 20, // Last 7 days have higher volume
          count: 2,
        }));

        const result = service['predictNextPeriod'](dailyData);

        expect(parseFloat(result.predictedVolume)).toBeGreaterThan(15);
      });
    });
  });
});
