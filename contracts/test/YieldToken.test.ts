import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { YieldToken } from "../typechain-types";

describe("YieldToken", function () {
  // Deploy fixture
  async function deployYieldTokenFixture() {
    const [owner, user1, user2, vault] = await ethers.getSigners();

    const YieldTokenFactory = await ethers.getContractFactory("YieldToken");
    const yieldToken = await YieldTokenFactory.deploy() as YieldToken;

    return { yieldToken, owner, user1, user2, vault };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { yieldToken } = await loadFixture(deployYieldTokenFixture);
      expect(await yieldToken.name()).to.equal("Relic Yield");
      expect(await yieldToken.symbol()).to.equal("YIELD");
    });

    it("Should set the correct owner", async function () {
      const { yieldToken, owner } = await loadFixture(deployYieldTokenFixture);
      expect(await yieldToken.owner()).to.equal(owner.address);
    });

    it("Should have 18 decimals", async function () {
      const { yieldToken } = await loadFixture(deployYieldTokenFixture);
      expect(await yieldToken.decimals()).to.equal(18);
    });

    it("Should start with zero total supply", async function () {
      const { yieldToken } = await loadFixture(deployYieldTokenFixture);
      expect(await yieldToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await expect(yieldToken.connect(owner).mint(user1.address, amount))
        .to.not.be.reverted;

      expect(await yieldToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should revert if non-owner tries to mint", async function () {
      const { yieldToken, user1 } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await expect(yieldToken.connect(user1).mint(user1.address, amount))
        .to.be.reverted; // OwnableUnauthorizedAccount
    });

    it("Should increase total supply when minting", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await yieldToken.connect(owner).mint(user1.address, amount);

      expect(await yieldToken.totalSupply()).to.equal(amount);
    });

    it("Should mint to multiple users", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      const amount1 = ethers.parseEther("100");
      const amount2 = ethers.parseEther("200");

      await yieldToken.connect(owner).mint(user1.address, amount1);
      await yieldToken.connect(owner).mint(user2.address, amount2);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(amount1);
      expect(await yieldToken.balanceOf(user2.address)).to.equal(amount2);
      expect(await yieldToken.totalSupply()).to.equal(amount1 + amount2);
    });

    it("Should mint multiple times to same user", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await yieldToken.connect(owner).mint(user1.address, amount);
      await yieldToken.connect(owner).mint(user1.address, amount);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(amount * 2n);
    });

    it("Should mint zero amount", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, 0);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should mint large amounts", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const largeAmount = ethers.parseEther("1000000"); // 1M tokens

      await yieldToken.connect(owner).mint(user1.address, largeAmount);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(largeAmount);
    });

    it("Should mint to owner", async function () {
      const { yieldToken, owner } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await yieldToken.connect(owner).mint(owner.address, amount);

      expect(await yieldToken.balanceOf(owner.address)).to.equal(amount);
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const mintAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("30");

      await yieldToken.connect(owner).mint(user1.address, mintAmount);
      await yieldToken.connect(user1).burn(burnAmount);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
    });

    it("Should decrease total supply when burning", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const mintAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("30");

      await yieldToken.connect(owner).mint(user1.address, mintAmount);

      await yieldToken.connect(user1).burn(burnAmount);

      expect(await yieldToken.totalSupply()).to.equal(mintAmount - burnAmount);
    });

    it("Should revert if burning more than balance", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const mintAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("200");

      await yieldToken.connect(owner).mint(user1.address, mintAmount);

      await expect(yieldToken.connect(user1).burn(burnAmount))
        .to.be.revertedWithCustomError(yieldToken, "ERC20InsufficientBalance");
    });

    it("Should allow burning entire balance", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await yieldToken.connect(owner).mint(user1.address, amount);
      await yieldToken.connect(user1).burn(amount);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(0);
      expect(await yieldToken.totalSupply()).to.equal(0);
    });

    it("Should allow burning zero amount", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await yieldToken.connect(owner).mint(user1.address, amount);
      await yieldToken.connect(user1).burn(0);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should allow multiple burns", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      const mintAmount = ethers.parseEther("100");

      await yieldToken.connect(owner).mint(user1.address, mintAmount);

      await yieldToken.connect(user1).burn(ethers.parseEther("20"));
      await yieldToken.connect(user1).burn(ethers.parseEther("30"));
      await yieldToken.connect(user1).burn(ethers.parseEther("10"));

      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("40"));
    });

    it("Should only burn caller's tokens", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));
      await yieldToken.connect(owner).mint(user2.address, ethers.parseEther("100"));

      await yieldToken.connect(user1).burn(ethers.parseEther("50"));

      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await yieldToken.balanceOf(user2.address)).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Transfers", function () {
    it("Should allow transfers between users", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await yieldToken.connect(owner).mint(user1.address, amount);

      await yieldToken.connect(user1).transfer(user2.address, ethers.parseEther("30"));

      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("70"));
      expect(await yieldToken.balanceOf(user2.address)).to.equal(ethers.parseEther("30"));
    });

    it("Should not charge transfer tax", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await yieldToken.connect(owner).mint(user1.address, amount);

      await yieldToken.connect(user1).transfer(user2.address, amount);

      // Receiver gets exact amount (no tax)
      expect(await yieldToken.balanceOf(user2.address)).to.equal(amount);
      expect(await yieldToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should revert if transferring more than balance", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));

      await expect(
        yieldToken.connect(user1).transfer(user2.address, ethers.parseEther("200"))
      ).to.be.revertedWithCustomError(yieldToken, "ERC20InsufficientBalance");
    });

    it("Should support approve and transferFrom", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      const amount = ethers.parseEther("100");

      await yieldToken.connect(owner).mint(user1.address, amount);

      await yieldToken.connect(user1).approve(user2.address, ethers.parseEther("50"));

      await yieldToken.connect(user2).transferFrom(user1.address, user2.address, ethers.parseEther("50"));

      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await yieldToken.balanceOf(user2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should decrease allowance after transferFrom", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));

      await yieldToken.connect(user1).approve(user2.address, ethers.parseEther("100"));

      await yieldToken.connect(user2).transferFrom(user1.address, user2.address, ethers.parseEther("30"));

      expect(await yieldToken.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("70"));
    });

    it("Should allow multiple transfers", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));

      await yieldToken.connect(user1).transfer(user2.address, ethers.parseEther("20"));
      await yieldToken.connect(user1).transfer(user2.address, ethers.parseEther("30"));

      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await yieldToken.balanceOf(user2.address)).to.equal(ethers.parseEther("50"));
    });
  });

  describe("Ownership", function () {
    it("Should allow ownership transfer", async function () {
      const { yieldToken, owner, vault } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).transferOwnership(vault.address);

      expect(await yieldToken.owner()).to.equal(vault.address);
    });

    it("Should allow new owner to mint", async function () {
      const { yieldToken, owner, vault, user1 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).transferOwnership(vault.address);

      await yieldToken.connect(vault).mint(user1.address, ethers.parseEther("100"));

      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should prevent old owner from minting after transfer", async function () {
      const { yieldToken, owner, vault, user1 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).transferOwnership(vault.address);

      await expect(
        yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle minting max uint256", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      // This should work (up to practical limits)
      const largeAmount = ethers.parseEther("1000000000"); // 1B tokens

      await yieldToken.connect(owner).mint(user1.address, largeAmount);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(largeAmount);
    });

    it("Should handle burning from empty balance", async function () {
      const { yieldToken, user1 } = await loadFixture(deployYieldTokenFixture);

      await expect(yieldToken.connect(user1).burn(1))
        .to.be.revertedWithCustomError(yieldToken, "ERC20InsufficientBalance");
    });

    it("Should maintain correct balance after mint and burn cycles", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      // Mint 100
      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));

      // Burn 30
      await yieldToken.connect(user1).burn(ethers.parseEther("30"));

      // Mint 50 more
      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("50"));

      // Burn 20
      await yieldToken.connect(user1).burn(ethers.parseEther("20"));

      // Final: 100 - 30 + 50 - 20 = 100
      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should handle transfer of zero amount", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));

      await yieldToken.connect(user1).transfer(user2.address, 0);

      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
      expect(await yieldToken.balanceOf(user2.address)).to.equal(0);
    });

    it("Should handle approve with zero amount", async function () {
      const { yieldToken, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(user1).approve(user2.address, 0);

      expect(await yieldToken.allowance(user1.address, user2.address)).to.equal(0);
    });

    it("Should handle multiple users minting and burning simultaneously", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      // Mint to both users
      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));
      await yieldToken.connect(owner).mint(user2.address, ethers.parseEther("200"));

      // Both burn
      await yieldToken.connect(user1).burn(ethers.parseEther("50"));
      await yieldToken.connect(user2).burn(ethers.parseEther("100"));

      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await yieldToken.balanceOf(user2.address)).to.equal(ethers.parseEther("100"));
      expect(await yieldToken.totalSupply()).to.equal(ethers.parseEther("150"));
    });
  });

  describe("ERC20 Standard Compliance", function () {
    it("Should return correct totalSupply", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));
      await yieldToken.connect(owner).mint(user2.address, ethers.parseEther("200"));

      expect(await yieldToken.totalSupply()).to.equal(ethers.parseEther("300"));
    });

    it("Should return correct balanceOf", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));

      expect(await yieldToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should return correct allowance", async function () {
      const { yieldToken, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(user1).approve(user2.address, ethers.parseEther("100"));

      expect(await yieldToken.allowance(user1.address, user2.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should emit Transfer event on mint", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      await expect(yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100")))
        .to.emit(yieldToken, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, ethers.parseEther("100"));
    });

    it("Should emit Transfer event on burn", async function () {
      const { yieldToken, owner, user1 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));

      await expect(yieldToken.connect(user1).burn(ethers.parseEther("50")))
        .to.emit(yieldToken, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, ethers.parseEther("50"));
    });

    it("Should emit Transfer event on transfer", async function () {
      const { yieldToken, owner, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await yieldToken.connect(owner).mint(user1.address, ethers.parseEther("100"));

      await expect(yieldToken.connect(user1).transfer(user2.address, ethers.parseEther("50")))
        .to.emit(yieldToken, "Transfer")
        .withArgs(user1.address, user2.address, ethers.parseEther("50"));
    });

    it("Should emit Approval event", async function () {
      const { yieldToken, user1, user2 } = await loadFixture(deployYieldTokenFixture);

      await expect(yieldToken.connect(user1).approve(user2.address, ethers.parseEther("100")))
        .to.emit(yieldToken, "Approval")
        .withArgs(user1.address, user2.address, ethers.parseEther("100"));
    });
  });
});
