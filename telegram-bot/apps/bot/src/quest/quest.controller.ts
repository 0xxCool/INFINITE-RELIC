import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestService } from './quest.service';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('quests')
@UseGuards(TelegramAuthGuard)
export class QuestController {
  constructor(
    private readonly questService: QuestService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getAvailableQuests(@Body('userId') userId: string) {
    return this.prisma.quest.findMany({
      where: {
        userId,
        status: 'AVAILABLE',
        cooldownEnd: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @Post(':id/claim')
  async claimQuest(
    @Param('id', ParseIntPipe) questId: number,
    @Body('userId') userId: string,
  ) {
    const result = await this.questService.claimQuest(userId, questId);
    return {
      success: true,
      reward: result.reward,
      message: `Successfully claimed ${result.reward} $YIELD`,
    };
  }
}
