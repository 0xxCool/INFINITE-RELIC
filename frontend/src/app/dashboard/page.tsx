'use client';

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/config';
import { NFT_ABI, YIELD_ABI } from '@/lib/abis';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  // Get NFT balance
  const { data: nftBalance } = useReadContract({
    address: CONTRACTS.RELIC_NFT,
    abi: NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Get YIELD balance
  const { data: yieldBalance } = useReadContract({
    address: CONTRACTS.YIELD_TOKEN,
    abi: YIELD_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to view your relics</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">
        My <span className="gradient-text">Dashboard</span>
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card">
          <div className="text-sm text-gray-400 mb-2">Total Relics</div>
          <div className="text-3xl font-bold">
            {nftBalance !== undefined ? Number(nftBalance) : '—'}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-400 mb-2">Claimable Yield</div>
          <div className="text-3xl font-bold text-primary">
            {yieldBalance !== undefined
              ? (Number(yieldBalance) / 1e18).toFixed(2)
              : '—'}{' '}
            <span className="text-lg">$YIELD</span>
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-400 mb-2">Total Value Locked</div>
          <div className="text-3xl font-bold text-secondary">
            $—
          </div>
        </div>
      </div>

      {/* Relics List */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Your Relics</h2>
        {nftBalance && Number(nftBalance) > 0 ? (
          <div className="text-gray-400">
            You own {Number(nftBalance)} Relic{Number(nftBalance) > 1 ? 's' : ''}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="mb-4">You don't own any Relics yet</p>
            <a href="/#mint" className="btn-primary">
              Mint Your First Relic →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
