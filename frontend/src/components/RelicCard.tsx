'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACTS } from '@/lib/config';
import { VAULT_ABI, NFT_ABI } from '@/lib/abis';
import { motion } from 'framer-motion';
import { useToast } from '@/lib/toast-context';

interface RelicCardProps {
  tokenId: bigint;
  onClaimSuccess?: () => void;
}

export default function RelicCard({ tokenId, onClaimSuccess }: RelicCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const { showToast } = useToast();

  // Get Relic metadata
  const { data: metadata } = useReadContract({
    address: CONTRACTS.RELIC_NFT,
    abi: NFT_ABI,
    functionName: 'meta',
    args: [tokenId],
  });

  // Get claimable yield
  const { data: claimableYield } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: VAULT_ABI,
    functionName: 'viewClaimableYield',
    args: [tokenId],
  });

  // Claim yield transaction
  const { writeContract: claimYield, data: claimHash, error: claimError } = useWriteContract();
  const { isLoading: isClaimPending, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // Handle transaction status
  useEffect(() => {
    if (isClaimSuccess) {
      showToast(
        `✅ Successfully claimed ${formatUnits(claimableYield || 0n, 18)} $YIELD!`,
        'success'
      );
      setIsClaiming(false);
      if (onClaimSuccess) onClaimSuccess();
    }
  }, [isClaimSuccess]);

  useEffect(() => {
    if (claimError) {
      showToast(
        `❌ Claim failed: ${claimError.message.slice(0, 100)}`,
        'error'
      );
      setIsClaiming(false);
    }
  }, [claimError]);

  const handleClaim = async () => {
    if (!claimableYield || claimableYield === 0n) return;

    setIsClaiming(true);
    try {
      claimYield({
        address: CONTRACTS.VAULT,
        abi: VAULT_ABI,
        functionName: 'claimYield',
        args: [tokenId],
      });
      showToast('🔄 Transaction submitted, waiting for confirmation...', 'info');
    } catch (error) {
      console.error('Claim failed:', error);
      showToast(`❌ Failed to submit transaction`, 'error');
      setIsClaiming(false);
    }
  };

  // Parse metadata (assuming structure: { lockDays, principal, lockEnd })
  const lockDays = metadata ? Number(metadata[0]) : 0;
  const principal = metadata ? metadata[1] : 0n;
  const lockEnd = metadata ? Number(metadata[2]) : 0;

  // Calculate lock status
  const now = Math.floor(Date.now() / 1000);
  const isLocked = now < lockEnd;
  const daysRemaining = isLocked ? Math.ceil((lockEnd - now) / 86400) : 0;

  // Get lock trait
  const getTrait = (days: number) => {
    if (days === 30) return { name: 'Copper', color: 'text-orange-400' };
    if (days === 90) return { name: 'Silver', color: 'text-gray-300' };
    if (days === 180) return { name: 'Gold', color: 'text-yellow-400' };
    if (days === 365) return { name: 'Infinite', color: 'text-purple-400' };
    return { name: 'Unknown', color: 'text-gray-400' };
  };

  const trait = getTrait(lockDays);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:border-primary/50"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Relic #{tokenId.toString()}</h3>
          <p className={`text-sm ${trait.color}`}>{trait.name} Tier</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          isLocked ? 'bg-secondary/20 text-secondary' : 'bg-green-500/20 text-green-400'
        }`}>
          {isLocked ? `🔒 ${daysRemaining}d left` : '✓ Unlocked'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-400">Principal</div>
          <div className="text-lg font-bold">
            {formatUnits(principal, 6)} USDC
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Lock Period</div>
          <div className="text-lg font-bold">{lockDays} days</div>
        </div>
      </div>

      {/* Claimable Yield */}
      <div className="bg-bg-light/50 rounded-xl p-4 mb-4">
        <div className="text-sm text-gray-400 mb-1">Claimable Yield</div>
        <div className="text-2xl font-bold text-primary">
          {claimableYield ? formatUnits(claimableYield, 18) : '0.00'} $YIELD
        </div>
      </div>

      {/* Claim Button */}
      <button
        onClick={handleClaim}
        disabled={!claimableYield || claimableYield === 0n || isClaimPending || isClaiming}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isClaimPending || isClaiming ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Claiming...
          </>
        ) : !claimableYield || claimableYield === 0n ? (
          'No Yield to Claim'
        ) : (
          'Claim Yield'
        )}
      </button>

      {/* Lock End Date */}
      <div className="text-center text-sm text-gray-400 mt-3">
        {isLocked ? (
          <>Unlocks {new Date(lockEnd * 1000).toLocaleDateString()}</>
        ) : (
          <>Unlocked on {new Date(lockEnd * 1000).toLocaleDateString()}</>
        )}
      </div>
    </motion.div>
  );
}
