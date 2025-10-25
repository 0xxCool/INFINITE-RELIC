import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { BotModule } from './bot/bot.module';
import { QuestModule } from './quest/quest.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    BotModule,
    QuestModule,
    AIModule,
  ],
})
export class AppModule {}
