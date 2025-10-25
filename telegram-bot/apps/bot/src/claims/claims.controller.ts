import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

export class CreateClaimDto {
  userId: string;
  amount: number;
  txHash?: string;
}

@Controller('claims')
@UseGuards(TelegramAuthGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  async getClaims(@Query('userId') userId?: string) {
    return this.claimsService.getClaims(userId);
  }

  @Post()
  async createClaim(@Body() createClaimDto: CreateClaimDto) {
    return this.claimsService.createClaim(createClaimDto);
  }
}
