import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClaimDto } from './claims.controller';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClaims(userId?: string) {
    const where = userId ? { userId } : {};

    const claims = await this.prisma.claim.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return {
      claims,
      total: claims.length,
      totalAmount: claims.reduce((sum, claim) => sum + claim.amount, 0),
    };
  }

  async createClaim(createClaimDto: CreateClaimDto) {
    const { userId, amount, txHash } = createClaimDto;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Create claim
    const claim = await this.prisma.claim.create({
      data: {
        userId,
        amount,
        txHash,
      },
    });

    return {
      success: true,
      claim,
    };
  }
}
