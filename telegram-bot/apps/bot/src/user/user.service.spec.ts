/**
 * User Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockUser = {
    id: '123456',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    referralCode: 'REL-ABC123',
    createdAt: new Date(),
    quests: [
      { id: 1, status: 'CLAIMED' },
      { id: 2, status: 'AVAILABLE' },
    ],
    claims: [
      { id: 1, amount: 10 },
      { id: 2, amount: 20 },
    ],
    referrals: [{ id: '111' }, { id: '222' }],
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserStats('123456');

      expect(result).toEqual({
        userId: '123456',
        username: 'testuser',
        firstName: 'Test',
        createdAt: mockUser.createdAt,
        stats: {
          totalQuests: 2,
          completedQuests: 1,
          totalEarned: 30,
          referralCount: 2,
          referralCode: 'REL-ABC123',
        },
      });
    });

    it('should calculate completed quests correctly', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserStats('123456');

      expect(result.stats.completedQuests).toBe(1);
    });

    it('should calculate total earned correctly', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserStats('123456');

      expect(result.stats.totalEarned).toBe(30);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserStats('999999')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should include referral code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserStats('123456');

      expect(result.stats.referralCode).toBe('REL-ABC123');
    });

    it('should handle user with no quests', async () => {
      const userNoQuests = { ...mockUser, quests: [], claims: [], referrals: [] };
      mockPrismaService.user.findUnique.mockResolvedValue(userNoQuests);

      const result = await service.getUserStats('123456');

      expect(result.stats.totalQuests).toBe(0);
      expect(result.stats.completedQuests).toBe(0);
      expect(result.stats.totalEarned).toBe(0);
      expect(result.stats.referralCount).toBe(0);
    });
  });

  describe('getReferralLink', () => {
    it('should return referral link', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        referralCode: 'REL-XYZ789',
      });

      const result = await service.getReferralLink('123456');

      expect(result).toEqual({
        referralCode: 'REL-XYZ789',
        referralLink: expect.stringContaining('t.me'),
      });
    });

    it('should include referral code in link', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        referralCode: 'REL-TEST123',
      });

      const result = await service.getReferralLink('123456');

      expect(result.referralLink).toContain('REL-TEST123');
    });

    it('should use bot username from environment', async () => {
      const originalEnv = process.env.TG_BOT_USERNAME;
      process.env.TG_BOT_USERNAME = 'custom_bot';

      mockPrismaService.user.findUnique.mockResolvedValue({
        referralCode: 'REL-ABC',
      });

      const result = await service.getReferralLink('123456');

      expect(result.referralLink).toContain('custom_bot');

      process.env.TG_BOT_USERNAME = originalEnv;
    });

    it('should use default bot username if not set', async () => {
      const originalEnv = process.env.TG_BOT_USERNAME;
      delete process.env.TG_BOT_USERNAME;

      mockPrismaService.user.findUnique.mockResolvedValue({
        referralCode: 'REL-ABC',
      });

      const result = await service.getReferralLink('123456');

      expect(result.referralLink).toContain('infiniterelic_bot');

      process.env.TG_BOT_USERNAME = originalEnv;
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getReferralLink('999999')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should format link correctly', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        referralCode: 'TEST-CODE',
      });

      const result = await service.getReferralLink('123456');

      expect(result.referralLink).toMatch(/^https:\/\/t\.me\/.*\?start=TEST-CODE$/);
    });
  });
});
