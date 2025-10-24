import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import type { MockUSDC, MockRWAAdapter, YieldToken, RelicNFT, RelicVault } from "../typechain-types";

describe("RelicVault", function () {
  async function deployFixture() {
    const [owner, alice, bob]: SignerWithAddress[] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc: MockUSDC = await MockUSDC.deploy() as any;
    await usdc.waitForDeployment();

    // Deploy MockRWAAdapter
    const MockRWA = await ethers.getContractFactory("MockRWAAdapter");
    const rwa: MockRWAAdapter = await MockRWA.deploy(await usdc.getAddress()) as any;
    await rwa.waitForDeployment();

    // Deploy YieldToken
    const YieldToken = await ethers.getContractFactory("YieldToken");
    const yieldToken: YieldToken = await YieldToken.deploy() as any;
    await yieldToken.waitForDeployment();

    // Deploy RelicNFT
    const RelicNFT = await ethers.getContractFactory("RelicNFT");
    const nft: RelicNFT = await RelicNFT.deploy("https://api.infinite-relic.io/relic/") as any;
    await nft.waitForDeployment();

    // Deploy RelicVault
    const RelicVault = await ethers.getContractFactory("RelicVault");
    const vault: RelicVault = await RelicVault.deploy(
      await usdc.getAddress(),
      await nft.getAddress(),
      await yieldToken.getAddress(),
      await rwa.getAddress()
    ) as any;
    await vault.waitForDeployment();

    // Transfer ownership to vault
    await nft.transferOwnership(await vault.getAddress());
    await yieldToken.transferOwnership(await vault.getAddress());

    // Fund alice with USDC
    await usdc.transfer(alice.address, ethers.parseUnits("10000", 6));
    await usdc.connect(alice).approve(await vault.getAddress(), ethers.parseUnits("10000", 6));

    // Fund bob
    await usdc.transfer(bob.address, ethers.parseUnits("5000", 6));
    await usdc.connect(bob).approve(await vault.getAddress(), ethers.parseUnits("5000", 6));

    return { usdc, rwa, yieldToken, nft, vault, owner, alice, bob };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { vault, owner } = await loadFixture(deployFixture);
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("Should have correct token addresses", async function () {
      const { vault, usdc, nft, yieldToken, rwa } = await loadFixture(deployFixture);
      expect(await vault.USDC()).to.equal(await usdc.getAddress());
      expect(await vault.RELIC()).to.equal(await nft.getAddress());
      expect(await vault.YIELD()).to.equal(await yieldToken.getAddress());
      expect(await vault.RWA()).to.equal(await rwa.getAddress());
    });

    it("Should reject zero addresses in constructor", async function () {
      const { usdc, nft, yieldToken, rwa } = await loadFixture(deployFixture);
      const Vault = await ethers.getContractFactory("RelicVault");

      await expect(
        Vault.deploy(ethers.ZeroAddress, await nft.getAddress(), await yieldToken.getAddress(), await rwa.getAddress())
      ).to.be.revertedWithCustomError(Vault, "ZeroAddress");
    });
  });

  describe("Minting Relics", function () {
    it("Should mint a relic and charge 1% dev fee", async function () {
      const { vault, usdc, nft, alice, owner } = await loadFixture(deployFixture);

      const amount = ethers.parseUnits("100", 6); // 100 USDC
      const initialBalance = await usdc.balanceOf(owner.address);

      await expect(vault.connect(alice).mintRelic(90, amount))
        .to.emit(vault, "RelicMinted")
        .to.emit(vault, "DevFeeCharged");

      // Check NFT minted
      expect(await nft.ownerOf(1)).to.equal(alice.address);

      // Check dev fee (1% of 100 = 1 USDC)
      const devFee = (await usdc.balanceOf(owner.address)) - initialBalance;
      expect(devFee).to.equal(ethers.parseUnits("1", 6));

      // Check total principal
      expect(await vault.totalPrincipal()).to.equal(amount);
    });

    it("Should revert if amount < 10 USDC", async function () {
      const { vault, alice } = await loadFixture(deployFixture);
      await expect(
        vault.connect(alice).mintRelic(90, ethers.parseUnits("9", 6))
      ).to.be.revertedWithCustomError(vault, "MinimumDepositNotMet");
    });

    it("Should revert for invalid lock periods", async function () {
      const { vault, alice } = await loadFixture(deployFixture);
      await expect(
        vault.connect(alice).mintRelic(45, ethers.parseUnits("100", 6))
      ).to.be.revertedWithCustomError(vault, "InvalidLockPeriod");

      await expect(
        vault.connect(alice).mintRelic(100, ethers.parseUnits("100", 6))
      ).to.be.revertedWithCustomError(vault, "InvalidLockPeriod");
    });

    it("Should accept valid lock periods (30, 90, 180, 365)", async function () {
      const { vault, usdc, alice } = await loadFixture(deployFixture);

      const periods = [30, 90, 180, 365];
      for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        await usdc.connect(alice).approve(await vault.getAddress(), ethers.parseUnits("100", 6));
        await expect(vault.connect(alice).mintRelic(period, ethers.parseUnits("100", 6)))
          .to.not.be.reverted;

        // Verify NFT metadata
        const meta = await nft.meta(i + 1);
        expect(meta.lockDays).to.equal(period);
        expect(meta.principal).to.equal(ethers.parseUnits("100", 6));
      }
    });

    it("Should invest in RWA adapter", async function () {
      const { vault, rwa, alice } = await loadFixture(deployFixture);

      await vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6));

      // 99 USDC should be invested (100 - 1% fee)
      const rwaBalance = await rwa.totalAssets();
      expect(rwaBalance).to.be.closeTo(ethers.parseUnits("99", 6), ethers.parseUnits("0.1", 6));
    });
  });

  describe("Claiming Yield", function () {
    it("Should accrue and claim yield after 10 days", async function () {
      const { vault, yieldToken, alice } = await loadFixture(deployFixture);

      // Mint relic
      await vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6));

      // Fast-forward 10 days
      await time.increase(86400 * 10);

      // Claim yield
      await expect(vault.connect(alice).claimYield(1))
        .to.emit(vault, "YieldClaimed");

      const balance = await yieldToken.balanceOf(alice.address);

      // Expected: 100 USDC * 5% APR * 10 days / 365 days
      // = 100 * 0.05 * 10 / 365 ≈ 0.137 USDC
      const expected = (ethers.parseUnits("100", 6) * 5n * 10n) / 365n;
      expect(balance).to.be.closeTo(expected, ethers.parseUnits("0.01", 6));
    });

    it("Should revert if non-owner tries to claim", async function () {
      const { vault, alice, bob } = await loadFixture(deployFixture);

      await vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6));
      await time.increase(86400 * 10);

      await expect(
        vault.connect(bob).claimYield(1)
      ).to.be.revertedWithCustomError(vault, "NotRelicOwner");
    });

    it("Should revert if no yield to claim", async function () {
      const { vault, alice } = await loadFixture(deployFixture);

      await vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6));

      // Try to claim immediately (same day)
      await expect(
        vault.connect(alice).claimYield(1)
      ).to.be.revertedWithCustomError(vault, "NoYieldToClaim");
    });

    it("Should calculate yield correctly for different periods", async function () {
      const { vault, yieldToken, alice } = await loadFixture(deployFixture);

      await vault.connect(alice).mintRelic(365, ethers.parseUnits("1000", 6));

      // Test different time periods
      const periods = [1, 7, 30, 90];
      for (const days of periods) {
        await time.increase(86400 * days);

        const claimableBefore = await vault.viewClaimableYield(1);
        await vault.connect(alice).claimYield(1);
        const claimed = await yieldToken.balanceOf(alice.address);

        // Should match (approximately)
        expect(claimed).to.be.closeTo(claimableBefore, ethers.parseUnits("0.01", 6));

        // Reset for next iteration
        await yieldToken.connect(alice).burn(claimed);
      }
    });

    it("Should allow NFT owner to claim after transfer", async function () {
      const { vault, yieldToken, nft, alice, bob } = await loadFixture(deployFixture);

      // Alice mints
      await vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6));

      // Wait 5 days
      await time.increase(86400 * 5);

      // Alice transfers NFT to Bob
      await nft.connect(alice).transferFrom(alice.address, bob.address, 1);

      // Bob should now be able to claim
      await time.increase(86400 * 5);

      await expect(vault.connect(bob).claimYield(1))
        .to.not.be.reverted;

      expect(await yieldToken.balanceOf(bob.address)).to.be.gt(0);
    });
  });

  describe("Performance Fee", function () {
    it("Should not charge performance fee if APR <= 15%", async function () {
      const { vault, yieldToken, owner, alice } = await loadFixture(deployFixture);

      await vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6));
      await time.increase(86400 * 10);

      const ownerBalanceBefore = await yieldToken.balanceOf(owner.address);
      await vault.connect(alice).claimYield(1);
      const ownerBalanceAfter = await yieldToken.balanceOf(owner.address);

      // Owner should not receive performance fee (5% APR < 15% threshold)
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore);
    });
  });

  describe("View Functions", function () {
    it("Should return correct claimable yield", async function () {
      const { vault, alice } = await loadFixture(deployFixture);

      await vault.connect(alice).mintRelic(90, ethers.parseUnits("1000", 6));
      await time.increase(86400 * 30);

      const claimable = await vault.viewClaimableYield(1);
      // Expected: 1000 * 0.05 * 30 / 365
      const expected = (ethers.parseUnits("1000", 6) * 5n * 30n) / 365n;
      expect(claimable).to.be.closeTo(expected, ethers.parseUnits("0.1", 6));
    });

    it("Should track totalPrincipal correctly", async function () {
      const { vault, alice, bob } = await loadFixture(deployFixture);

      await vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6));
      expect(await vault.totalPrincipal()).to.equal(ethers.parseUnits("100", 6));

      await vault.connect(bob).mintRelic(180, ethers.parseUnits("200", 6));
      expect(await vault.totalPrincipal()).to.equal(ethers.parseUnits("300", 6));
    });
  });

  describe("Admin Functions", function () {
    it("Should pause and unpause", async function () {
      const { vault, alice, owner } = await loadFixture(deployFixture);

      await vault.connect(owner).pause();

      await expect(
        vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6))
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");

      await vault.connect(owner).unpause();

      await expect(
        vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6))
      ).to.not.be.reverted;
    });

    it("Should only allow owner to pause", async function () {
      const { vault, alice } = await loadFixture(deployFixture);

      await expect(
        vault.connect(alice).pause()
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("Should rescue accidentally sent tokens", async function () {
      const { vault, owner } = await loadFixture(deployFixture);

      // Deploy a random ERC20
      const Token = await ethers.getContractFactory("YieldToken");
      const token = await Token.deploy();
      await token.waitForDeployment();
      await token.mint(await vault.getAddress(), ethers.parseEther("100"));

      const ownerBalBefore = await token.balanceOf(owner.address);
      await vault.connect(owner).rescueTokens(await token.getAddress(), ethers.parseEther("100"));
      const ownerBalAfter = await token.balanceOf(owner.address);

      expect(ownerBalAfter - ownerBalBefore).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow rescuing USDC", async function () {
      const { vault, usdc, owner } = await loadFixture(deployFixture);

      await expect(
        vault.connect(owner).rescueTokens(await usdc.getAddress(), 100)
      ).to.be.revertedWith("Cannot withdraw user USDC");
    });
  });

  describe("NFT Metadata", function () {
    it("Should store correct metadata", async function () {
      const { vault, nft, alice } = await loadFixture(deployFixture);

      await vault.connect(alice).mintRelic(180, ethers.parseUnits("500", 6));

      const meta = await nft.meta(1);
      expect(meta.lockDays).to.equal(180);
      expect(meta.principal).to.equal(ethers.parseUnits("500", 6));
      expect(meta.lockEnd).to.be.gt(await time.latest());
    });

    it("Should generate token URI", async function () {
      const { vault, nft, alice } = await loadFixture(deployFixture);

      await vault.connect(alice).mintRelic(90, ethers.parseUnits("100", 6));

      const uri = await nft.tokenURI(1);
      expect(uri).to.equal("https://api.infinite-relic.io/relic/1.json");
    });
  });
});
