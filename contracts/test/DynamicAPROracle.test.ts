import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import type { DynamicAPROracle } from "../typechain-types";

describe("DynamicAPROracle", function () {
  // Deploy fixture
  async function deployOracleFixture() {
    const [owner, other] = await ethers.getSigners();

    const OracleFactory = await ethers.getContractFactory("DynamicAPROracle");
    const oracle = await OracleFactory.deploy() as DynamicAPROracle;

    return { oracle, owner, other };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);
      expect(await oracle.owner()).to.equal(owner.address);
    });

    it("Should initialize all multipliers to 1.0x (10000)", async function () {
      const { oracle } = await loadFixture(deployOracleFixture);

      expect(await oracle.aprMultipliers(30)).to.equal(10000);
      expect(await oracle.aprMultipliers(90)).to.equal(10000);
      expect(await oracle.aprMultipliers(180)).to.equal(10000);
      expect(await oracle.aprMultipliers(365)).to.equal(10000);
    });

    it("Should initialize as not paused", async function () {
      const { oracle } = await loadFixture(deployOracleFixture);
      expect(await oracle.paused()).to.equal(false);
    });

    it("Should set lastRateChange to deployment time", async function () {
      const { oracle } = await loadFixture(deployOracleFixture);
      const lastChange = await oracle.lastRateChange();
      expect(lastChange).to.be.greaterThan(0);
    });

    it("Should have correct constants", async function () {
      const { oracle } = await loadFixture(deployOracleFixture);
      expect(await oracle.MAX_MULTIPLIER()).to.equal(20000); // 2.0x
      expect(await oracle.MIN_MULTIPLIER()).to.equal(8000);  // 0.8x
      expect(await oracle.RATE_CHANGE_COOLDOWN()).to.equal(3600); // 1 hour
    });
  });

  describe("Update APR Multiplier", function () {
    it("Should allow owner to update valid multiplier", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      // Wait for cooldown
      await time.increase(3601);

      await expect(oracle.connect(owner).updateAPRMultiplier(30, 12000))
        .to.emit(oracle, "APRMultiplierUpdated")
        .withArgs(30, 10000, 12000);

      expect(await oracle.aprMultipliers(30)).to.equal(12000);
    });

    it("Should revert if invalid lock period", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      await expect(oracle.connect(owner).updateAPRMultiplier(60, 12000))
        .to.be.revertedWith("Invalid lock period");
    });

    it("Should revert if multiplier below minimum", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      await expect(oracle.connect(owner).updateAPRMultiplier(30, 7999))
        .to.be.revertedWith("Multiplier out of bounds");
    });

    it("Should revert if multiplier above maximum", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      await expect(oracle.connect(owner).updateAPRMultiplier(30, 20001))
        .to.be.revertedWith("Multiplier out of bounds");
    });

    it("Should accept minimum multiplier (8000)", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      await oracle.connect(owner).updateAPRMultiplier(30, 8000);
      expect(await oracle.aprMultipliers(30)).to.equal(8000);
    });

    it("Should accept maximum multiplier (20000)", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      await oracle.connect(owner).updateAPRMultiplier(30, 20000);
      expect(await oracle.aprMultipliers(30)).to.equal(20000);
    });

    it("Should revert during cooldown period", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      // First update (after initial cooldown)
      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(30, 12000);

      // Try immediate second update (should fail)
      await expect(oracle.connect(owner).updateAPRMultiplier(90, 12000))
        .to.be.revertedWith("Rate change cooldown active");
    });

    it("Should allow update after cooldown expires", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      // First update
      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(30, 12000);

      // Wait for cooldown
      await time.increase(3601);

      // Second update should succeed
      await expect(oracle.connect(owner).updateAPRMultiplier(90, 13000))
        .to.emit(oracle, "APRMultiplierUpdated");
    });

    it("Should revert when paused", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await oracle.connect(owner).togglePause();

      await time.increase(3601);

      await expect(oracle.connect(owner).updateAPRMultiplier(30, 12000))
        .to.be.revertedWith("Oracle is paused");
    });

    it("Should only allow owner to update", async function () {
      const { oracle, other } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      await expect(oracle.connect(other).updateAPRMultiplier(30, 12000))
        .to.be.reverted; // OwnableUnauthorizedAccount
    });

    it("Should update lastRateChange timestamp", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const beforeTimestamp = await oracle.lastRateChange();
      await oracle.connect(owner).updateAPRMultiplier(30, 12000);
      const afterTimestamp = await oracle.lastRateChange();

      expect(afterTimestamp).to.be.greaterThan(beforeTimestamp);
    });

    it("Should add snapshot to history", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const historyLengthBefore = await oracle.getHistoryLength();
      await oracle.connect(owner).updateAPRMultiplier(30, 12000);
      const historyLengthAfter = await oracle.getHistoryLength();

      expect(historyLengthAfter).to.equal(historyLengthBefore + 1n);

      const snapshot = await oracle.getSnapshot(historyLengthAfter - 1n);
      expect(snapshot.lockDays).to.equal(30);
      expect(snapshot.multiplier).to.equal(12000);
    });

    it("Should update all lock periods independently", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      const periods = [30, 90, 180, 365];
      const multipliers = [11000, 12000, 13000, 14000];

      for (let i = 0; i < periods.length; i++) {
        await time.increase(3601);
        await oracle.connect(owner).updateAPRMultiplier(periods[i], multipliers[i]);
      }

      for (let i = 0; i < periods.length; i++) {
        expect(await oracle.aprMultipliers(periods[i])).to.equal(multipliers[i]);
      }
    });
  });

  describe("Batch Update Multipliers", function () {
    it("Should update all multipliers at once", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const newMultipliers: [bigint, bigint, bigint, bigint] = [11000n, 12000n, 13000n, 14000n];

      await oracle.connect(owner).batchUpdateMultipliers(newMultipliers);

      expect(await oracle.aprMultipliers(30)).to.equal(11000);
      expect(await oracle.aprMultipliers(90)).to.equal(12000);
      expect(await oracle.aprMultipliers(180)).to.equal(13000);
      expect(await oracle.aprMultipliers(365)).to.equal(14000);
    });

    it("Should emit events for each multiplier", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const newMultipliers: [bigint, bigint, bigint, bigint] = [11000n, 12000n, 13000n, 14000n];

      await expect(oracle.connect(owner).batchUpdateMultipliers(newMultipliers))
        .to.emit(oracle, "APRMultiplierUpdated")
        .withArgs(30, 10000, 11000)
        .to.emit(oracle, "APRMultiplierUpdated")
        .withArgs(90, 10000, 12000)
        .to.emit(oracle, "APRMultiplierUpdated")
        .withArgs(180, 10000, 13000)
        .to.emit(oracle, "APRMultiplierUpdated")
        .withArgs(365, 10000, 14000);
    });

    it("Should revert if any multiplier out of bounds", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const invalidMultipliers: [bigint, bigint, bigint, bigint] = [11000n, 25000n, 13000n, 14000n]; // 25000 > MAX

      await expect(oracle.connect(owner).batchUpdateMultipliers(invalidMultipliers))
        .to.be.revertedWith("Multiplier out of bounds");
    });

    it("Should revert during cooldown", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const multipliers: [bigint, bigint, bigint, bigint] = [11000n, 12000n, 13000n, 14000n];
      await oracle.connect(owner).batchUpdateMultipliers(multipliers);

      // Try immediate second batch update
      await expect(oracle.connect(owner).batchUpdateMultipliers(multipliers))
        .to.be.revertedWith("Rate change cooldown active");
    });

    it("Should revert when paused", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await oracle.connect(owner).togglePause();

      await time.increase(3601);

      const multipliers: [bigint, bigint, bigint, bigint] = [11000n, 12000n, 13000n, 14000n];

      await expect(oracle.connect(owner).batchUpdateMultipliers(multipliers))
        .to.be.revertedWith("Oracle is paused");
    });

    it("Should only allow owner to batch update", async function () {
      const { oracle, other } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const multipliers: [bigint, bigint, bigint, bigint] = [11000n, 12000n, 13000n, 14000n];

      await expect(oracle.connect(other).batchUpdateMultipliers(multipliers))
        .to.be.reverted;
    });

    it("Should add 4 snapshots to history", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const historyLengthBefore = await oracle.getHistoryLength();
      const multipliers: [bigint, bigint, bigint, bigint] = [11000n, 12000n, 13000n, 14000n];

      await oracle.connect(owner).batchUpdateMultipliers(multipliers);

      const historyLengthAfter = await oracle.getHistoryLength();
      expect(historyLengthAfter).to.equal(historyLengthBefore + 4n);
    });

    it("Should update lastRateChange only once", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const multipliers: [bigint, bigint, bigint, bigint] = [11000n, 12000n, 13000n, 14000n];
      await oracle.connect(owner).batchUpdateMultipliers(multipliers);

      const lastChange = await oracle.lastRateChange();

      // Wait a bit and verify cooldown is enforced
      await time.increase(100); // Less than cooldown

      await expect(oracle.connect(owner).updateAPRMultiplier(30, 15000))
        .to.be.revertedWith("Rate change cooldown active");
    });
  });

  describe("Get Multiplier", function () {
    it("Should return correct multiplier for each period", async function () {
      const { oracle } = await loadFixture(deployOracleFixture);

      expect(await oracle.getMultiplier(30)).to.equal(10000);
      expect(await oracle.getMultiplier(90)).to.equal(10000);
      expect(await oracle.getMultiplier(180)).to.equal(10000);
      expect(await oracle.getMultiplier(365)).to.equal(10000);
    });

    it("Should return updated multiplier after update", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(30, 15000);

      expect(await oracle.getMultiplier(30)).to.equal(15000);
    });

    it("Should return 10000 when paused", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      // Update a multiplier
      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(30, 15000);

      // Pause
      await oracle.connect(owner).togglePause();

      // Should return 10000, not 15000
      expect(await oracle.getMultiplier(30)).to.equal(10000);
    });

    it("Should return 0 for non-existent periods", async function () {
      const { oracle } = await loadFixture(deployOracleFixture);

      // Period 60 was never initialized
      expect(await oracle.getMultiplier(60)).to.equal(0);
    });
  });

  describe("Calculate Effective APR", function () {
    it("Should calculate correct effective APR", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(30, 12000); // 1.2x

      const baseAPR = 1000; // 10%
      const effectiveAPR = await oracle.calculateEffectiveAPR(baseAPR, 30);

      // 10% * 1.2x = 12%
      expect(effectiveAPR).to.equal(1200);
    });

    it("Should return baseAPR when multiplier is 1.0x", async function () {
      const { oracle } = await loadFixture(deployOracleFixture);

      const baseAPR = 1000;
      const effectiveAPR = await oracle.calculateEffectiveAPR(baseAPR, 30);

      expect(effectiveAPR).to.equal(baseAPR);
    });

    it("Should return baseAPR when paused", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      // Update multiplier
      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(30, 15000);

      // Pause
      await oracle.connect(owner).togglePause();

      const baseAPR = 1000;
      const effectiveAPR = await oracle.calculateEffectiveAPR(baseAPR, 30);

      // Should return base APR, ignoring 1.5x multiplier
      expect(effectiveAPR).to.equal(baseAPR);
    });

    it("Should handle different multipliers for different periods", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);
      const multipliers: [bigint, bigint, bigint, bigint] = [11000n, 12000n, 13000n, 14000n];
      await oracle.connect(owner).batchUpdateMultipliers(multipliers);

      const baseAPR = 1000; // 10%

      expect(await oracle.calculateEffectiveAPR(baseAPR, 30)).to.equal(1100);  // 11%
      expect(await oracle.calculateEffectiveAPR(baseAPR, 90)).to.equal(1200);  // 12%
      expect(await oracle.calculateEffectiveAPR(baseAPR, 180)).to.equal(1300); // 13%
      expect(await oracle.calculateEffectiveAPR(baseAPR, 365)).to.equal(1400); // 14%
    });

    it("Should handle edge case multipliers", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      // Test MIN_MULTIPLIER (0.8x)
      await oracle.connect(owner).updateAPRMultiplier(30, 8000);
      expect(await oracle.calculateEffectiveAPR(1000, 30)).to.equal(800);

      await time.increase(3601);

      // Test MAX_MULTIPLIER (2.0x)
      await oracle.connect(owner).updateAPRMultiplier(90, 20000);
      expect(await oracle.calculateEffectiveAPR(1000, 90)).to.equal(2000);
    });
  });

  describe("History", function () {
    it("Should start with empty history", async function () {
      const { oracle } = await loadFixture(deployOracleFixture);
      expect(await oracle.getHistoryLength()).to.equal(0);
    });

    it("Should record snapshots in history", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(30, 12000);

      expect(await oracle.getHistoryLength()).to.equal(1);

      const snapshot = await oracle.getSnapshot(0);
      expect(snapshot.lockDays).to.equal(30);
      expect(snapshot.multiplier).to.equal(12000);
      expect(snapshot.timestamp).to.be.greaterThan(0);
    });

    it("Should maintain chronological history", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      const updates = [
        { period: 30, multiplier: 11000 },
        { period: 90, multiplier: 12000 },
        { period: 180, multiplier: 13000 },
      ];

      for (const update of updates) {
        await time.increase(3601);
        await oracle.connect(owner).updateAPRMultiplier(update.period, update.multiplier);
      }

      expect(await oracle.getHistoryLength()).to.equal(3);

      for (let i = 0; i < updates.length; i++) {
        const snapshot = await oracle.getSnapshot(i);
        expect(snapshot.lockDays).to.equal(updates[i].period);
        expect(snapshot.multiplier).to.equal(updates[i].multiplier);
      }
    });

    it("Should revert getSnapshot for invalid index", async function () {
      const { oracle } = await loadFixture(deployOracleFixture);

      await expect(oracle.getSnapshot(0))
        .to.be.revertedWith("Index out of bounds");
    });

    it("Should track batch updates in history", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await time.increase(3601);

      const multipliers: [bigint, bigint, bigint, bigint] = [11000n, 12000n, 13000n, 14000n];
      await oracle.connect(owner).batchUpdateMultipliers(multipliers);

      expect(await oracle.getHistoryLength()).to.equal(4);

      const periods = [30, 90, 180, 365];
      for (let i = 0; i < 4; i++) {
        const snapshot = await oracle.getSnapshot(i);
        expect(snapshot.lockDays).to.equal(periods[i]);
        expect(snapshot.multiplier).to.equal(multipliers[i]);
      }
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await expect(oracle.connect(owner).togglePause())
        .to.emit(oracle, "EmergencyPause")
        .withArgs(true);

      expect(await oracle.paused()).to.equal(true);
    });

    it("Should allow owner to unpause", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await oracle.connect(owner).togglePause(); // Pause
      await oracle.connect(owner).togglePause(); // Unpause

      expect(await oracle.paused()).to.equal(false);
    });

    it("Should only allow owner to toggle pause", async function () {
      const { oracle, other } = await loadFixture(deployOracleFixture);

      await expect(oracle.connect(other).togglePause())
        .to.be.reverted;
    });

    it("Should block updates when paused", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      await oracle.connect(owner).togglePause();

      await time.increase(3601);

      await expect(oracle.connect(owner).updateAPRMultiplier(30, 12000))
        .to.be.revertedWith("Oracle is paused");
    });

    it("Should return neutral multipliers when paused", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      // Update multipliers
      await time.increase(3601);
      const multipliers: [bigint, bigint, bigint, bigint] = [15000n, 16000n, 17000n, 18000n];
      await oracle.connect(owner).batchUpdateMultipliers(multipliers);

      // Pause
      await oracle.connect(owner).togglePause();

      // All multipliers should return 10000 (1.0x)
      expect(await oracle.getMultiplier(30)).to.equal(10000);
      expect(await oracle.getMultiplier(90)).to.equal(10000);
      expect(await oracle.getMultiplier(180)).to.equal(10000);
      expect(await oracle.getMultiplier(365)).to.equal(10000);
    });

    it("Should allow updates after unpausing", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      // Pause
      await oracle.connect(owner).togglePause();

      // Unpause
      await oracle.connect(owner).togglePause();

      // Update should work
      await time.increase(3601);
      await expect(oracle.connect(owner).updateAPRMultiplier(30, 12000))
        .to.emit(oracle, "APRMultiplierUpdated");
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple updates across all periods", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      const scenarios = [
        { period: 30, multiplier: 11000 },
        { period: 90, multiplier: 12000 },
        { period: 30, multiplier: 13000 }, // Update 30 again
        { period: 365, multiplier: 14000 },
      ];

      for (const scenario of scenarios) {
        await time.increase(3601);
        await oracle.connect(owner).updateAPRMultiplier(scenario.period, scenario.multiplier);
      }

      expect(await oracle.aprMultipliers(30)).to.equal(13000); // Latest update
      expect(await oracle.aprMultipliers(90)).to.equal(12000);
      expect(await oracle.aprMultipliers(365)).to.equal(14000);
      expect(await oracle.getHistoryLength()).to.equal(4);
    });

    it("Should maintain accurate history through pause/unpause", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      // Update
      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(30, 12000);

      // Pause
      await oracle.connect(owner).togglePause();

      // Unpause
      await oracle.connect(owner).togglePause();

      // Update again
      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(90, 13000);

      // History should have 2 entries
      expect(await oracle.getHistoryLength()).to.equal(2);
    });

    it("Should handle mixed individual and batch updates", async function () {
      const { oracle, owner } = await loadFixture(deployOracleFixture);

      // Individual update
      await time.increase(3601);
      await oracle.connect(owner).updateAPRMultiplier(30, 11000);

      // Batch update
      await time.increase(3601);
      const multipliers: [bigint, bigint, bigint, bigint] = [12000n, 13000n, 14000n, 15000n];
      await oracle.connect(owner).batchUpdateMultipliers(multipliers);

      expect(await oracle.aprMultipliers(30)).to.equal(12000); // Overwritten by batch
      expect(await oracle.aprMultipliers(90)).to.equal(13000);
      expect(await oracle.getHistoryLength()).to.equal(5); // 1 + 4
    });
  });
});
