'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Dynamic import for Spline (client-side only)
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin-slow w-32 h-32 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  ),
});

export default function Hero3D() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg-light to-bg" />

      {/* 3D Scene */}
      <div className="absolute inset-0 opacity-60">
        <Suspense fallback={<div className="w-full h-full bg-bg-light" />}>
          <Spline scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode" />
        </Suspense>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold mb-6"
        >
          <span className="gradient-text">Lock. Earn. Trade.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-8"
        >
          Real-World-Asset yield meets NFT liquidity.
          <br />
          <span className="text-primary">5-25% APR</span> backed by US T-Bills.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a href="#mint" className="btn-primary">
            Start Earning →
          </a>
          <button className="px-6 py-3 rounded-xl glass hover:border-primary/50 transition-all duration-200">
            Learn More
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          <div>
            <div className="text-3xl font-bold text-primary">5-25%</div>
            <div className="text-sm text-gray-400">APR Range</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-secondary">$0</div>
            <div className="text-sm text-gray-400">Lock on Yield</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">100%</div>
            <div className="text-sm text-gray-400">Liquid Exit</div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-primary rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
