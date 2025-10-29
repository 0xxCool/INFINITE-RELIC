/**
 * Claims Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClaimsService', () => {
  let service: ClaimsService;
  let prismaService: PrismaService;

  const mockClaims = [
    {
      id: 1,
      userId: '123456',
      amount: 10.5,
      txHash: '0xabc123',
      createdAt: new Date(),
      user: {
        id: '123456',
        username: 'user1',
        firstName: 'Test',
      },
    },
    {
      id: 2,
      userId: '123456',
      amount: 25.0,
      txHash: '0xdef456',
      createdAt: new Date(),
      user: {
        id: '123456',
        username: 'user1',
        firstName: 'Test',
      },
    },
  ];

  const mockPrismaService = {
    claim: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClaimsService>(ClaimsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClaims', () => {
    it('should return all claims when no userId provided', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getClaims();

      expect(result).toEqual({
        claims: mockClaims,
        total: 2,
        totalAmount: 35.5,
      });

      expect(prismaService.claim.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('should filter claims by userId', async () => {
      const filteredClaims = [mockClaims[0]];
      mockPrismaService.claim.findMany.mockResolvedValue(filteredClaims);

      const result = await service.getClaims('123456');

      expect(result.claims).toHaveLength(1);
      expect(prismaService.claim.findMany).toHaveBeenCalledWith({
        where: { userId: '123456' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('should calculate total amount correctly', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getClaims();

      expect(result.totalAmount).toBe(35.5);
    });

    it('should return correct count', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getClaims();

      expect(result.total).toBe(2);
    });

    it('should limit results to 100', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue([]);

      await service.getClaims();

      expect(prismaService.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it('should order by createdAt descending', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue([]);

      await service.getClaims();

      expect(prismaService.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      );
    });

    it('should include user information', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.getClaims();

      expect(result.claims[0].user).toHaveProperty('id');
      expect(result.claims[0].user).toHaveProperty('username');
      expect(result.claims[0].user).toHaveProperty('firstName');
    });

    it('should handle empty claims', async () => {
      mockPrismaService.claim.findMany.mockResolvedValue([]);

      const result = await service.getClaims();

      expect(result).toEqual({
        claims: [],
        total: 0,
        totalAmount: 0,
      });
    });
  });

  describe('createClaim', () => {
    it('should create claim successfully', async () => {
      const claimDto = {
        userId: '123456',
        amount: 50.0,
        txHash: '0x123abc',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: '123456' });
      mockPrismaService.claim.create.mockResolvedValue({
        id: 3,
        ...claimDto,
        createdAt: new Date(),
      });

      const result = await service.createClaim(claimDto);

      expect(result).toEqual({
        success: true,
        claim: expect.objectContaining({
          userId: '123456',
          amount: 50.0,
          txHash: '0x123abc',
        }),
      });
    });

    it('should verify user exists before creating claim', async () => {
      const claimDto = {
        userId: '123456',
        amount: 50.0,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: '123456' });
      mockPrismaService.claim.create.mockResolvedValue({
        id: 3,
        ...claimDto,
        createdAt: new Date(),
      });

      await service.createClaim(claimDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123456' },
      });
    });

    it('should throw error if user not found', async () => {
      const claimDto = {
        userId: '999999',
        amount: 50.0,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createClaim(claimDto)).rejects.toThrow(
        'User 999999 not found'
      );
    });

    it('should create claim with txHash', async () => {
      const claimDto = {
        userId: '123456',
        amount: 50.0,
        txHash: '0xabcdef',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: '123456' });
      mockPrismaService.claim.create.mockResolvedValue({
        id: 3,
        ...claimDto,
        createdAt: new Date(),
      });

      const result = await service.createClaim(claimDto);

      expect(result.claim.txHash).toBe('0xabcdef');
      expect(prismaService.claim.create).toHaveBeenCalledWith({
        data: {
          userId: '123456',
          amount: 50.0,
          txHash: '0xabcdef',
        },
      });
    });

    it('should create claim without txHash', async () => {
      const claimDto = {
        userId: '123456',
        amount: 50.0,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: '123456' });
      mockPrismaService.claim.create.mockResolvedValue({
        id: 3,
        ...claimDto,
        txHash: undefined,
        createdAt: new Date(),
      });

      const result = await service.createClaim(claimDto);

      expect(result.success).toBe(true);
      expect(prismaService.claim.create).toHaveBeenCalledWith({
        data: {
          userId: '123456',
          amount: 50.0,
          txHash: undefined,
        },
      });
    });

    it('should handle decimal amounts', async () => {
      const claimDto = {
        userId: '123456',
        amount: 123.456789,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: '123456' });
      mockPrismaService.claim.create.mockResolvedValue({
        id: 3,
        ...claimDto,
        createdAt: new Date(),
      });

      const result = await service.createClaim(claimDto);

      expect(result.claim.amount).toBe(123.456789);
    });

    it('should handle zero amount', async () => {
      const claimDto = {
        userId: '123456',
        amount: 0,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: '123456' });
      mockPrismaService.claim.create.mockResolvedValue({
        id: 3,
        ...claimDto,
        createdAt: new Date(),
      });

      const result = await service.createClaim(claimDto);

      expect(result.claim.amount).toBe(0);
    });

    it('should handle large amounts', async () => {
      const claimDto = {
        userId: '123456',
        amount: 1000000.99,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: '123456' });
      mockPrismaService.claim.create.mockResolvedValue({
        id: 3,
        ...claimDto,
        createdAt: new Date(),
      });

      const result = await service.createClaim(claimDto);

      expect(result.claim.amount).toBe(1000000.99);
    });
  });
});
