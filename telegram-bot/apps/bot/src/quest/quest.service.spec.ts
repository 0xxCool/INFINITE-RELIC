/**
 * Quest Service Unit Tests
 *
 * Required packages (add to package.json devDependencies):
 * - @nestjs/testing: ^10.3.7
 * - jest: ^29.7.0
 * - @types/jest: ^29.5.0
 * - ts-jest: ^29.1.0
 *
 * Run with: npm test quest.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { QuestService } from './quest.service';
import { PrismaService } from '../prisma/prisma.service';
import { BotService } from '../bot/bot.service';

describe('QuestService', () => {
  let service: QuestService;
  let prismaService: PrismaService;
  let botService: BotService;

  // Mock data
  const mockUsers = [
    { id: '123456', username: 'user1', firstName: 'Test', lastName: 'User1' },
    { id: '789012', username: 'user2', firstName: 'Test', lastName: 'User2' },
  ];

  const mockQuest = {
    id: 1,
    userId: '123456',
    type: 'DAILY_CHECKIN',
    reward: 0.5,
    status: 'AVAILABLE',
    cooldownEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    claimedAt: null,
  };

  // Mock PrismaService
  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
    },
    quest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    claim: {
      create: jest.fn(),
    },
  };

  // Mock BotService
  const mockBotService = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BotService,
          useValue: mockBotService,
        },
      ],
    }).compile();

    service = module.get<QuestService>(QuestService);
    prismaService = module.get<PrismaService>(PrismaService);
    botService = module.get<BotService>(BotService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('distributeDailyQuests', () => {
    it('should create quests for all users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.quest.create.mockResolvedValue(mockQuest);
      mockBotService.sendMessage.mockResolvedValue({});

      await service.distributeDailyQuests();

      expect(prismaService.user.findMany).toHaveBeenCalledTimes(1);
      expect(prismaService.quest.create).toHaveBeenCalledTimes(2); // 2 users
    });

    it('should create quests with correct data', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.quest.create.mockResolvedValue(mockQuest);
      mockBotService.sendMessage.mockResolvedValue({});

      await service.distributeDailyQuests();

      expect(prismaService.quest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: '123456',
          type: 'DAILY_CHECKIN',
          reward: 0.5,
          cooldownEnd: expect.any(Date),
        }),
      });
    });

    it('should set 24h cooldown period', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.quest.create.mockResolvedValue(mockQuest);
      mockBotService.sendMessage.mockResolvedValue({});

      const beforeTime = Date.now() + 23.5 * 60 * 60 * 1000; // 23.5 hours
      const afterTime = Date.now() + 24.5 * 60 * 60 * 1000; // 24.5 hours

      await service.distributeDailyQuests();

      const createCall = (prismaService.quest.create as jest.Mock).mock.calls[0][0];
      const cooldownEnd = createCall.data.cooldownEnd.getTime();

      expect(cooldownEnd).toBeGreaterThan(beforeTime);
      expect(cooldownEnd).toBeLessThan(afterTime);
    });

    it('should send Telegram notifications to all users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.quest.create.mockResolvedValue(mockQuest);
      mockBotService.sendMessage.mockResolvedValue({});

      await service.distributeDailyQuests();

      expect(botService.sendMessage).toHaveBeenCalledTimes(2);
      expect(botService.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Daily Quest Available'),
        expect.objectContaining({
          parse_mode: 'Markdown',
          reply_markup: expect.any(Object),
        })
      );
    });

    it('should include web app button in notification', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.quest.create.mockResolvedValue(mockQuest);
      mockBotService.sendMessage.mockResolvedValue({});

      await service.distributeDailyQuests();

      const messageCall = (botService.sendMessage as jest.Mock).mock.calls[0][2];
      expect(messageCall.reply_markup.inline_keyboard[0][0]).toHaveProperty('web_app');
    });

    it('should handle notification errors gracefully', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.quest.create.mockResolvedValue(mockQuest);
      mockBotService.sendMessage.mockRejectedValue(new Error('User blocked bot'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.distributeDailyQuests();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to notify user'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it('should continue distributing quests even if one notification fails', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.quest.create.mockResolvedValue(mockQuest);
      mockBotService.sendMessage
        .mockRejectedValueOnce(new Error('User blocked bot'))
        .mockResolvedValueOnce({});

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.distributeDailyQuests();

      expect(prismaService.quest.create).toHaveBeenCalledTimes(2); // Both quests created
      expect(botService.sendMessage).toHaveBeenCalledTimes(2); // Both notifications attempted

      consoleSpy.mockRestore();
    });

    it('should log success message with user count', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.quest.create.mockResolvedValue(mockQuest);
      mockBotService.sendMessage.mockResolvedValue({});

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.distributeDailyQuests();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Distributed quests to 2 users')
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty user list', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.distributeDailyQuests();

      expect(prismaService.quest.create).not.toHaveBeenCalled();
      expect(botService.sendMessage).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Distributed quests to 0 users')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('claimQuest', () => {
    it('should successfully claim a valid quest', async () => {
      mockPrismaService.quest.findFirst.mockResolvedValue(mockQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...mockQuest, status: 'CLAIMED' });
      mockPrismaService.claim.create.mockResolvedValue({
        id: 1,
        userId: '123456',
        amount: 0.5,
        createdAt: new Date(),
      });

      const result = await service.claimQuest('123456', 1);

      expect(result).toEqual({ reward: 0.5 });
    });

    it('should find quest with correct filters', async () => {
      mockPrismaService.quest.findFirst.mockResolvedValue(mockQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...mockQuest, status: 'CLAIMED' });
      mockPrismaService.claim.create.mockResolvedValue({});

      await service.claimQuest('123456', 1);

      expect(prismaService.quest.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: '123456',
          status: 'AVAILABLE',
        },
      });
    });

    it('should update quest status to CLAIMED', async () => {
      mockPrismaService.quest.findFirst.mockResolvedValue(mockQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...mockQuest, status: 'CLAIMED' });
      mockPrismaService.claim.create.mockResolvedValue({});

      await service.claimQuest('123456', 1);

      expect(prismaService.quest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'CLAIMED',
          claimedAt: expect.any(Date),
        },
      });
    });

    it('should create claim record with correct data', async () => {
      mockPrismaService.quest.findFirst.mockResolvedValue(mockQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...mockQuest, status: 'CLAIMED' });
      mockPrismaService.claim.create.mockResolvedValue({});

      await service.claimQuest('123456', 1);

      expect(prismaService.claim.create).toHaveBeenCalledWith({
        data: {
          userId: '123456',
          amount: 0.5,
        },
      });
    });

    it('should throw error if quest not found', async () => {
      mockPrismaService.quest.findFirst.mockResolvedValue(null);

      await expect(service.claimQuest('123456', 1))
        .rejects
        .toThrow('Quest not found or already claimed');

      expect(prismaService.quest.update).not.toHaveBeenCalled();
      expect(prismaService.claim.create).not.toHaveBeenCalled();
    });

    it('should throw error if quest already claimed', async () => {
      const claimedQuest = { ...mockQuest, status: 'CLAIMED' };
      mockPrismaService.quest.findFirst.mockResolvedValue(null); // findFirst with AVAILABLE status returns null

      await expect(service.claimQuest('123456', 1))
        .rejects
        .toThrow('Quest not found or already claimed');
    });

    it('should throw error if quest expired', async () => {
      const expiredQuest = {
        ...mockQuest,
        cooldownEnd: new Date(Date.now() - 1000), // Expired 1 second ago
      };
      mockPrismaService.quest.findFirst.mockResolvedValue(expiredQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...expiredQuest, status: 'EXPIRED' });

      await expect(service.claimQuest('123456', 1))
        .rejects
        .toThrow('Quest expired');
    });

    it('should update expired quest status to EXPIRED', async () => {
      const expiredQuest = {
        ...mockQuest,
        cooldownEnd: new Date(Date.now() - 1000),
      };
      mockPrismaService.quest.findFirst.mockResolvedValue(expiredQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...expiredQuest, status: 'EXPIRED' });

      try {
        await service.claimQuest('123456', 1);
      } catch (error) {
        // Expected error
      }

      expect(prismaService.quest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'EXPIRED' },
      });
    });

    it('should not create claim if quest expired', async () => {
      const expiredQuest = {
        ...mockQuest,
        cooldownEnd: new Date(Date.now() - 1000),
      };
      mockPrismaService.quest.findFirst.mockResolvedValue(expiredQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...expiredQuest, status: 'EXPIRED' });

      try {
        await service.claimQuest('123456', 1);
      } catch (error) {
        // Expected error
      }

      expect(prismaService.claim.create).not.toHaveBeenCalled();
    });

    it('should handle quest at exact cooldown boundary', async () => {
      const boundaryQuest = {
        ...mockQuest,
        cooldownEnd: new Date(), // Exactly now
      };
      mockPrismaService.quest.findFirst.mockResolvedValue(boundaryQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...boundaryQuest, status: 'CLAIMED' });
      mockPrismaService.claim.create.mockResolvedValue({});

      // Should not throw (cooldown not exceeded)
      await expect(service.claimQuest('123456', 1)).resolves.toBeDefined();
    });

    it('should throw error if userId does not match quest owner', async () => {
      mockPrismaService.quest.findFirst.mockResolvedValue(null); // Different userId = not found

      await expect(service.claimQuest('999999', 1))
        .rejects
        .toThrow('Quest not found or already claimed');
    });

    it('should return correct reward amount', async () => {
      const highRewardQuest = { ...mockQuest, reward: 5.0 };
      mockPrismaService.quest.findFirst.mockResolvedValue(highRewardQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...highRewardQuest, status: 'CLAIMED' });
      mockPrismaService.claim.create.mockResolvedValue({});

      const result = await service.claimQuest('123456', 1);

      expect(result.reward).toBe(5.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database errors during distribution', async () => {
      mockPrismaService.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.distributeDailyQuests()).rejects.toThrow('Database error');
    });

    it('should handle database errors during claim', async () => {
      mockPrismaService.quest.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.claimQuest('123456', 1)).rejects.toThrow('Database error');
    });

    it('should handle quest creation failures', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.quest.create.mockRejectedValue(new Error('Quest creation failed'));

      await expect(service.distributeDailyQuests()).rejects.toThrow('Quest creation failed');
    });

    it('should handle claim creation failures', async () => {
      mockPrismaService.quest.findFirst.mockResolvedValue(mockQuest);
      mockPrismaService.quest.update.mockResolvedValue({ ...mockQuest, status: 'CLAIMED' });
      mockPrismaService.claim.create.mockRejectedValue(new Error('Claim creation failed'));

      await expect(service.claimQuest('123456', 1)).rejects.toThrow('Claim creation failed');
    });
  });
});
