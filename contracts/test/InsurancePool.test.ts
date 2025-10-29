import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import type { InsurancePool, MockUSDC } from "../typechain-types";

describe("InsurancePool", function () {
  // Deploy fixture
  async function deployInsurancePoolFixture() {
    const [owner, staker1, staker2, recipient] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDCFactory.deploy() as MockUSDC;

    // Deploy InsurancePool
    const InsurancePoolFactory = await ethers.getContractFactory("InsurancePool");
    const pool = await InsurancePoolFactory.deploy(await usdc.getAddress()) as InsurancePool;

    // Fund stakers with USDC
    await usdc.transfer(staker1.address, 100_000_000000); // 100k USDC
    await usdc.transfer(staker2.address, 100_000_000000); // 100k USDC

    return { pool, usdc, owner, staker1, staker2, recipient };
  }

  describe("Deployment", function () {
    it("Should set the correct USDC token", async function () {
      const { pool, usdc } = await loadFixture(deployInsurancePoolFixture);
      expect(await pool.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct owner", async function () {
      const { pool, owner } = await loadFixture(deployInsurancePoolFixture);
      expect(await pool.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      const { pool } = await loadFixture(deployInsurancePoolFixture);
      expect(await pool.totalStaked()).to.equal(0);
      expect(await pool.totalShares()).to.equal(0);
      expect(await pool.totalClaimed()).to.equal(0);
      expect(await pool.coverageRatio()).to.equal(3000); // 30%
    });

    it("Should have correct constants", async function () {
      const { pool } = await loadFixture(deployInsurancePoolFixture);
      expect(await pool.MIN_STAKE()).to.equal(100_000000); // 100 USDC
      expect(await pool.REWARD_RATE()).to.equal(500); // 5%
      expect(await pool.BLOCKS_PER_YEAR()).to.equal(2_628_000);
    });
  });

  describe("Staking", function () {
    it("Should allow staking above minimum", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000; // 1000 USDC

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);

      await expect(pool.connect(staker1).stake(stakeAmount))
        .to.emit(pool, "Staked")
        .withArgs(staker1.address, stakeAmount, stakeAmount);

      const stakerInfo = await pool.stakers(staker1.address);
      expect(stakerInfo.amount).to.equal(stakeAmount);
      expect(stakerInfo.shares).to.equal(stakeAmount);
      expect(await pool.totalStaked()).to.equal(stakeAmount);
      expect(await pool.totalShares()).to.equal(stakeAmount);
    });

    it("Should revert if staking below minimum", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 50_000000; // 50 USDC (below MIN_STAKE)

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);

      await expect(pool.connect(staker1).stake(stakeAmount))
        .to.be.revertedWith("Below minimum stake");
    });

    it("Should calculate shares correctly for subsequent stakes", async function () {
      const { pool, usdc, staker1, staker2 } = await loadFixture(deployInsurancePoolFixture);

      // First staker stakes 1000 USDC
      const firstStake = 1000_000000;
      await usdc.connect(staker1).approve(await pool.getAddress(), firstStake);
      await pool.connect(staker1).stake(firstStake);

      // Second staker stakes 500 USDC
      const secondStake = 500_000000;
      await usdc.connect(staker2).approve(await pool.getAddress(), secondStake);
      await pool.connect(staker2).stake(secondStake);

      const staker1Info = await pool.stakers(staker1.address);
      const staker2Info = await pool.stakers(staker2.address);

      // Shares should be proportional
      expect(staker1Info.shares).to.equal(firstStake);
      expect(staker2Info.shares).to.equal(secondStake);
      expect(await pool.totalStaked()).to.equal(firstStake + secondStake);
    });

    it("Should claim pending rewards when staking again", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;

      // First stake
      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      // Mine blocks to accumulate rewards
      await time.increase(12 * 100); // 100 blocks

      // Second stake should claim rewards
      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await expect(pool.connect(staker1).stake(stakeAmount))
        .to.emit(pool, "RewardsClaimed");
    });

    it("Should revert if USDC transfer fails", async function () {
      const { pool, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;

      // Don't approve, so transfer fails
      await expect(pool.connect(staker1).stake(stakeAmount))
        .to.be.reverted;
    });
  });

  describe("Unstaking", function () {
    it("Should allow unstaking staked amount", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;

      // Stake first
      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      const balanceBefore = await usdc.balanceOf(staker1.address);

      // Unstake
      await expect(pool.connect(staker1).unstake(stakeAmount))
        .to.emit(pool, "Unstaked")
        .withArgs(staker1.address, stakeAmount);

      const balanceAfter = await usdc.balanceOf(staker1.address);
      expect(balanceAfter - balanceBefore).to.equal(stakeAmount);

      const stakerInfo = await pool.stakers(staker1.address);
      expect(stakerInfo.amount).to.equal(0);
      expect(stakerInfo.shares).to.equal(0);
      expect(await pool.totalStaked()).to.equal(0);
    });

    it("Should revert if unstaking more than staked", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      await expect(pool.connect(staker1).unstake(stakeAmount + 1n))
        .to.be.revertedWith("Insufficient stake");
    });

    it("Should pay rewards when unstaking", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      // Mine blocks to accumulate rewards
      await time.increase(12 * 1000); // 1000 blocks

      const balanceBefore = await usdc.balanceOf(staker1.address);

      await expect(pool.connect(staker1).unstake(stakeAmount))
        .to.emit(pool, "RewardsClaimed");

      const balanceAfter = await usdc.balanceOf(staker1.address);
      const received = balanceAfter - balanceBefore;

      // Should receive staked amount + rewards
      expect(received).to.be.greaterThan(stakeAmount);
    });

    it("Should allow partial unstaking", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;
      const unstakeAmount = 500_000000;

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      await pool.connect(staker1).unstake(unstakeAmount);

      const stakerInfo = await pool.stakers(staker1.address);
      expect(stakerInfo.amount).to.equal(stakeAmount - unstakeAmount);
      expect(await pool.totalStaked()).to.equal(stakeAmount - unstakeAmount);
    });
  });

  describe("Rewards", function () {
    it("Should calculate pending rewards correctly", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000; // 1000 USDC

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      // Mine 2628 blocks (0.1% of year)
      await time.increase(12 * 2628);

      const pending = await pool.pendingRewards(staker1.address);

      // Expected: 1000 * 5% * 0.001 = 0.05 USDC = 50000 (6 decimals)
      // Allow some margin for block timing
      expect(pending).to.be.greaterThan(0);
      expect(pending).to.be.lessThan(100000); // Less than 0.1 USDC
    });

    it("Should claim rewards without unstaking", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      // Mine blocks
      await time.increase(12 * 5000);

      const balanceBefore = await usdc.balanceOf(staker1.address);

      await expect(pool.connect(staker1).claimRewards())
        .to.emit(pool, "RewardsClaimed");

      const balanceAfter = await usdc.balanceOf(staker1.address);
      const rewards = balanceAfter - balanceBefore;

      expect(rewards).to.be.greaterThan(0);

      // Stake should remain unchanged
      const stakerInfo = await pool.stakers(staker1.address);
      expect(stakerInfo.amount).to.equal(stakeAmount);
    });

    it("Should revert claimRewards if no stake", async function () {
      const { pool, staker1 } = await loadFixture(deployInsurancePoolFixture);

      await expect(pool.connect(staker1).claimRewards())
        .to.be.revertedWith("No stake");
    });

    it("Should revert claimRewards if no pending rewards", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      // Immediately try to claim (no blocks passed)
      await expect(pool.connect(staker1).claimRewards())
        .to.be.revertedWith("No rewards");
    });

    it("Should return 0 pending rewards if no stake", async function () {
      const { pool, staker1 } = await loadFixture(deployInsurancePoolFixture);
      expect(await pool.pendingRewards(staker1.address)).to.equal(0);
    });

    it("Should accumulate rewards correctly over time", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      // Check rewards at different intervals
      await time.increase(12 * 1000);
      const rewards1 = await pool.pendingRewards(staker1.address);

      await time.increase(12 * 1000);
      const rewards2 = await pool.pendingRewards(staker1.address);

      // Rewards should increase over time
      expect(rewards2).to.be.greaterThan(rewards1);
    });
  });

  describe("Coverage", function () {
    it("Should calculate max coverage correctly", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 10_000_000000; // 10k USDC

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      const maxCoverage = await pool.getMaxCoverage();

      // Expected: 10k * 30% = 3k USDC
      expect(maxCoverage).to.equal(3_000_000000);
    });

    it("Should allow owner to pay claims within coverage", async function () {
      const { pool, usdc, staker1, recipient, owner } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 10_000_000000;

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      const claimAmount = 2_000_000000; // 2k USDC (within 30% coverage)
      const balanceBefore = await usdc.balanceOf(recipient.address);

      await expect(pool.connect(owner).payClaim(recipient.address, claimAmount, "RWA adapter failure"))
        .to.emit(pool, "ClaimPaid")
        .withArgs(recipient.address, claimAmount, "RWA adapter failure");

      const balanceAfter = await usdc.balanceOf(recipient.address);
      expect(balanceAfter - balanceBefore).to.equal(claimAmount);
      expect(await pool.totalClaimed()).to.equal(claimAmount);
    });

    it("Should revert if claim exceeds coverage", async function () {
      const { pool, usdc, staker1, recipient, owner } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 10_000_000000;

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      const claimAmount = 4_000_000000; // 4k USDC (exceeds 30% coverage)

      await expect(pool.connect(owner).payClaim(recipient.address, claimAmount, "Too large"))
        .to.be.revertedWith("Exceeds coverage");
    });

    it("Should only allow owner to pay claims", async function () {
      const { pool, usdc, staker1, recipient } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 10_000_000000;

      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      const claimAmount = 1_000_000000;

      await expect(pool.connect(staker1).payClaim(recipient.address, claimAmount, "Unauthorized"))
        .to.be.reverted; // OwnableUnauthorizedAccount error
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update coverage ratio", async function () {
      const { pool, owner } = await loadFixture(deployInsurancePoolFixture);

      await pool.connect(owner).updateCoverageRatio(4000); // 40%

      expect(await pool.coverageRatio()).to.equal(4000);
    });

    it("Should revert if coverage ratio exceeds 50%", async function () {
      const { pool, owner } = await loadFixture(deployInsurancePoolFixture);

      await expect(pool.connect(owner).updateCoverageRatio(5001))
        .to.be.revertedWith("Ratio too high");
    });

    it("Should only allow owner to update coverage ratio", async function () {
      const { pool, staker1 } = await loadFixture(deployInsurancePoolFixture);

      await expect(pool.connect(staker1).updateCoverageRatio(4000))
        .to.be.reverted; // OwnableUnauthorizedAccount error
    });

    it("Should allow coverage ratio of exactly 50%", async function () {
      const { pool, owner } = await loadFixture(deployInsurancePoolFixture);

      await pool.connect(owner).updateCoverageRatio(5000); // Exactly 50%

      expect(await pool.coverageRatio()).to.equal(5000);
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple stakers with different stakes", async function () {
      const { pool, usdc, staker1, staker2 } = await loadFixture(deployInsurancePoolFixture);

      // Staker1: 5000 USDC
      const stake1 = 5_000_000000;
      await usdc.connect(staker1).approve(await pool.getAddress(), stake1);
      await pool.connect(staker1).stake(stake1);

      // Staker2: 3000 USDC
      const stake2 = 3_000_000000;
      await usdc.connect(staker2).approve(await pool.getAddress(), stake2);
      await pool.connect(staker2).stake(stake2);

      expect(await pool.totalStaked()).to.equal(stake1 + stake2);

      // Mine blocks
      await time.increase(12 * 5000);

      const rewards1 = await pool.pendingRewards(staker1.address);
      const rewards2 = await pool.pendingRewards(staker2.address);

      // Staker1 should have more rewards (proportional to stake)
      expect(rewards1).to.be.greaterThan(rewards2);
    });

    it("Should update max coverage when stakers join/leave", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 10_000_000000;

      // Initial coverage is 0
      expect(await pool.getMaxCoverage()).to.equal(0);

      // Stake
      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      expect(await pool.getMaxCoverage()).to.equal(3_000_000000); // 30% of 10k

      // Unstake half
      await pool.connect(staker1).unstake(5_000_000000);

      expect(await pool.getMaxCoverage()).to.equal(1_500_000000); // 30% of 5k
    });

    it("Should handle stake, claim, stake again correctly", async function () {
      const { pool, usdc, staker1 } = await loadFixture(deployInsurancePoolFixture);
      const stakeAmount = 1000_000000;

      // First stake
      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      // Mine blocks and claim rewards
      await time.increase(12 * 5000);
      await pool.connect(staker1).claimRewards();

      // Stake again
      await usdc.connect(staker1).approve(await pool.getAddress(), stakeAmount);
      await pool.connect(staker1).stake(stakeAmount);

      const stakerInfo = await pool.stakers(staker1.address);
      expect(stakerInfo.amount).to.equal(stakeAmount * 2n);
    });
  });
});
