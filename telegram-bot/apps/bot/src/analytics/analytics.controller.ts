import { Controller, Get, Query, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

/**
 * Analytics API Controller
 *
 * Provides comprehensive analytics endpoints for:
 * - Protocol statistics
 * - User performance tracking
 * - Market trends
 * - Social trading signals
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get global protocol statistics
   */
  @Get('protocol')
  async getProtocolStats() {
    return this.analyticsService.getProtocolStats();
  }

  /**
   * Get user performance metrics
   */
  @Get('user/:address')
  async getUserStats(@Param('address') address: string) {
    return this.analyticsService.getUserStats(address);
  }

  /**
   * Get leaderboard (top performers)
   */
  @Get('leaderboard')
  async getLeaderboard(
    @Query('timeframe') timeframe: '7d' | '30d' | 'all' = 'all',
    @Query('limit') limit: number = 100
  ) {
    return this.analyticsService.getLeaderboard(timeframe, limit);
  }

  /**
   * Get market trends and insights
   */
  @Get('trends')
  async getMarketTrends(
    @Query('period') period: '24h' | '7d' | '30d' = '7d'
  ) {
    return this.analyticsService.getMarketTrends(period);
  }

  /**
   * Get APR history and predictions
   */
  @Get('apr-history')
  async getAPRHistory(
    @Query('lockDays') lockDays: number,
    @Query('days') days: number = 30
  ) {
    return this.analyticsService.getAPRHistory(lockDays, days);
  }

  /**
   * Get real-time marketplace activity
   */
  @Get('marketplace/activity')
  async getMarketplaceActivity() {
    return this.analyticsService.getMarketplaceActivity();
  }

  /**
   * Get social trading signals
   */
  @Get('signals')
  async getTradingSignals() {
    return this.analyticsService.getTradingSignals();
  }

  /**
   * Get portfolio composition insights
   */
  @Get('portfolio/composition')
  async getPortfolioComposition() {
    return this.analyticsService.getPortfolioComposition();
  }
}
