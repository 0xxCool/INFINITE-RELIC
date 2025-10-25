'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS, MIN_DEPOSIT } from '@/lib/config';
import { VAULT_ABI, USDC_ABI } from '@/lib/abis';
import { useToast } from '@/lib/toast-context';

interface LockCardProps {
  days: number;
  trait: string;
  baseAPR: number;
  boostCap: number;
  color: string;
  description: string;
}

export default function LockCard({
  days,
  trait,
  baseAPR,
  boostCap,
  color,
  description,
}: LockCardProps) {
  const [amount, setAmount] = useState(MIN_DEPOSIT.toString());
  const { address } = useAccount();
  const { showToast } = useToast();

  // Check USDC balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Check allowance
  const { data: allowance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && CONTRACTS.VAULT ? [address, CONTRACTS.VAULT] : undefined,
  });

  // Approve USDC
  const { writeContract: approve, data: approveHash, error: approveError } = useWriteContract();
  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Mint Relic
  const { writeContract: mint, data: mintHash, error: mintError } = useWriteContract();
  const { isLoading: isMinting, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Handle approve transaction status
  useEffect(() => {
    if (isApproveSuccess) {
      showToast('✅ USDC approved! You can now mint your Relic.', 'success');
    }
  }, [isApproveSuccess]);

  useEffect(() => {
    if (approveError) {
      showToast(`❌ Approval failed: ${approveError.message.slice(0, 100)}`, 'error');
    }
  }, [approveError]);

  // Handle mint transaction status
  useEffect(() => {
    if (isMintSuccess) {
      showToast(`✅ ${trait} Relic successfully minted! Check your dashboard.`, 'success', 7000);
      setAmount(MIN_DEPOSIT.toString()); // Reset amount
    }
  }, [isMintSuccess, trait]);

  useEffect(() => {
    if (mintError) {
      showToast(`❌ Minting failed: ${mintError.message.slice(0, 100)}`, 'error');
    }
  }, [mintError]);

  const needsApproval = () => {
    if (!allowance || !amount) return true;
    const amountBN = parseUnits(amount, 6);
    return allowance < amountBN;
  };

  const handleApprove = () => {
    if (!amount) return;
    try {
      approve({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.VAULT, parseUnits(amount, 6)],
      });
      showToast('🔄 Approval transaction submitted...', 'info');
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleMint = () => {
    if (!amount) return;
    try {
      mint({
        address: CONTRACTS.VAULT,
        abi: VAULT_ABI,
        functionName: 'mintRelic',
        args: [days, parseUnits(amount, 6)],
      });
      showToast('🔄 Minting transaction submitted...', 'info');
    } catch (error) {
      console.error('Mint error:', error);
    }
  };

  const maxAPR = baseAPR + boostCap;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`w-full max-w-sm rounded-2xl bg-gradient-to-br ${color} p-1 shadow-2xl`}
    >
      <div className="bg-bg rounded-2xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-bold">{days} Days</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          <div className="px-3 py-1 bg-bg-light rounded-lg text-sm font-semibold">
            {trait}
          </div>
        </div>

        {/* APR */}
        <div className="mb-6">
          <div className="text-4xl font-extrabold gradient-text">
            {baseAPR}-{maxAPR}%
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {baseAPR}% base + up to {boostCap}% boost
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Amount (USDC)</label>
          <input
            type="number"
            min={MIN_DEPOSIT}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 bg-bg-light border border-white/10 rounded-xl focus:border-primary focus:outline-none"
            placeholder={`Min ${MIN_DEPOSIT} USDC`}
          />
          {usdcBalance !== undefined && (
            <div className="text-xs text-gray-500 mt-1">
              Balance: {(Number(usdcBalance) / 1e6).toFixed(2)} USDC
            </div>
          )}
        </div>

        {/* Action Button */}
        {!address ? (
          <div className="text-center text-sm text-gray-400">
            Connect wallet to mint
          </div>
        ) : needsApproval() ? (
          <button
            onClick={handleApprove}
            disabled={isApproving || !amount || Number(amount) < MIN_DEPOSIT}
            className="btn-primary w-full"
          >
            {isApproving ? 'Approving...' : 'Approve USDC'}
          </button>
        ) : (
          <button
            onClick={handleMint}
            disabled={isMinting || !amount || Number(amount) < MIN_DEPOSIT}
            className="btn-primary w-full"
          >
            {isMinting ? 'Minting...' : `Mint ${trait} Relic`}
          </button>
        )}

        {/* Info */}
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Dev Fee (1%):</span>
            <span>{((Number(amount) || 0) * 0.01).toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Invested Amount:</span>
            <span>{((Number(amount) || 0) * 0.99).toFixed(2)} USDC</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
