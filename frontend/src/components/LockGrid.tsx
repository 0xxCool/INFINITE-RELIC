'use client';

import { LOCK_PERIODS } from '@/lib/config';
import LockCard from './LockCard';

export default function LockGrid() {
  return (
    <section id="mint" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="gradient-text">Lock Period</span>
          </h2>
          <p className="text-xl text-gray-400">
            Longer locks = higher boost potential. Exit anytime by trading your NFT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {LOCK_PERIODS.map((period) => (
            <LockCard key={period.days} {...period} />
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 max-w-3xl mx-auto card">
          <h3 className="font-bold text-xl mb-4">How it works</h3>
          <ol className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-bg flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>
                <strong className="text-white">Deposit USDC:</strong> Your funds are invested in
                tokenized US T-Bills (Ondo OUSG)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-bg flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>
                <strong className="text-white">Receive NFT:</strong> Your Relic NFT is tradeable
                on OpenSea anytime
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-bg flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>
                <strong className="text-white">Claim Yield:</strong> Daily claimable $YIELD tokens
                (5% baseline + boost)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-bg flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>
                <strong className="text-white">Exit Anytime:</strong> Sell your NFT on secondary
                market or wait for unlock
              </span>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
