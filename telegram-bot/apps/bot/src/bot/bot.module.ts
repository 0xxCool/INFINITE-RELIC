import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AIModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
