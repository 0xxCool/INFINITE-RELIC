/**
 * Professional Stats Card Component with animations
 */

'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  delay?: number;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  delay = 0
}: StatsCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-400">{title}</p>
        {icon && (
          <div className="text-primary/60 group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="mb-2">
        <h3 className="text-3xl font-bold text-white group-hover:text-primary transition-colors">
          {value}
        </h3>
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 text-sm">
          {trend && trendValue && (
            <span className={`flex items-center gap-1 ${trendColors[trend]}`}>
              <span>{trendIcons[trend]}</span>
              <span>{trendValue}</span>
            </span>
          )}
          {subtitle && <span className="text-gray-500">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
}
