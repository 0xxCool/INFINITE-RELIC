'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import StatsCard from '@/components/StatsCard';

/**
 * Analytics Dashboard
 *
 * Comprehensive analytics and insights page featuring:
 * - Protocol-wide statistics
 * - User leaderboards
 * - Market trends
 * - APR history charts
 * - Social trading signals
 */
export default function AnalyticsPage() {
  const [protocolStats, setProtocolStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const [stats, leaders, marketTrends, tradingSignals] = await Promise.all([
        fetch(`${apiUrl}/analytics/protocol`).then(r => r.json()),
        fetch(`${apiUrl}/analytics/leaderboard?timeframe=${timeframe}`).then(r => r.json()),
        fetch(`${apiUrl}/analytics/trends?period=${timeframe}`).then(r => r.json()),
        fetch(`${apiUrl}/analytics/signals`).then(r => r.json())
      ]);

      setProtocolStats(stats);
      setLeaderboard(leaders.leaderboard || []);
      setTrends(marketTrends);
      setSignals(tradingSignals.signals || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Analytics Dashboard</h1>
        <p className="text-gray-400">Real-time protocol metrics and insights</p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-8">
        {['7d', '30d', 'all'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf as any)}
            className={`px-4 py-2 rounded-lg transition-all ${
              timeframe === tf
                ? 'bg-primary text-white'
                : 'glass hover:border-primary/50'
            }`}
          >
            {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Protocol Stats Grid */}
      {protocolStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard
            title="Total Users"
            value={protocolStats.protocol.totalUsers.toLocaleString()}
            subtitle={`+${protocolStats.growth.newUsers7d} this week`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            trend="up"
            trendValue={`${protocolStats.growth.growthRate}%`}
            delay={0}
          />

          <StatsCard
            title="Total Relics"
            value={protocolStats.protocol.totalRelics.toLocaleString()}
            subtitle="NFTs minted"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
            delay={0.1}
          />

          <StatsCard
            title="Quests Completed"
            value={protocolStats.protocol.totalQuests.toLocaleString()}
            subtitle="Total achievements"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            delay={0.2}
          />

          <StatsCard
            title="Avg Yield"
            value={`$${protocolStats.protocol.avgYield.toFixed(2)}`}
            subtitle="Per user"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            trend="up"
            trendValue="12%"
            delay={0.3}
          />
        </div>
      )}

      {/* Market Trends */}
      {trends && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Market Trends</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Volume</p>
              <p className="text-2xl font-bold">${trends.metrics.totalVolume.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Avg Daily Volume</p>
              <p className="text-2xl font-bold">${trends.metrics.avgDailyVolume.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold">{trends.metrics.totalTransactions}</p>
            </div>
          </div>

          {trends.prediction && (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
              <p className="text-sm text-primary mb-1">🔮 Prediction</p>
              <p className="text-sm text-gray-300">
                Expected volume: ${trends.prediction.predictedVolume} with {trends.prediction.predictedCount} transactions
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Trading Signals */}
      {signals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">🎯 Trading Signals</h2>

          <div className="space-y-4">
            {signals.map((signal, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                      {signal.type}
                    </span>
                    <span className="text-xs px-2 py-1 ml-2 bg-green-500/20 text-green-400 rounded">
                      {signal.confidence} confidence
                    </span>
                  </div>
                </div>
                <p className="text-white">{signal.message}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold mb-6">🏆 Top Performers</h2>

        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No data available yet</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.slice(0, 10).map((user, index) => (
              <div
                key={user.address}
                className={`p-4 rounded-xl transition-all ${
                  index < 3
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-400' :
                      'text-gray-500'
                    }`}>
                      #{user.rank}
                    </div>
                    <div>
                      <p className="font-bold">{user.username}</p>
                      <p className="text-xs text-gray-400">{user.address.slice(0, 6)}...{user.address.slice(-4)}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary">${user.totalEarned.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{user.questsCompleted} quests</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
