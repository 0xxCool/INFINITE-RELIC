import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';

@Controller('user')
@UseGuards(TelegramAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':userId/stats')
  async getUserStats(@Param('userId') userId: string) {
    return this.userService.getUserStats(userId);
  }

  @Get(':userId/referral-link')
  async getReferralLink(@Param('userId') userId: string) {
    return this.userService.getReferralLink(userId);
  }
}
