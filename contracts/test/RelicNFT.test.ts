import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { RelicNFT } from "../typechain-types";

describe("RelicNFT", function () {
  // Deploy fixture
  async function deployRelicNFTFixture() {
    const [owner, user1, user2, vault] = await ethers.getSigners();

    const RelicNFTFactory = await ethers.getContractFactory("RelicNFT");
    const relicNFT = await RelicNFTFactory.deploy("https://relic.io/metadata/") as RelicNFT;

    return { relicNFT, owner, user1, user2, vault };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { relicNFT } = await loadFixture(deployRelicNFTFixture);
      expect(await relicNFT.name()).to.equal("Infinite Relic");
      expect(await relicNFT.symbol()).to.equal("RELIC");
    });

    it("Should set the correct owner", async function () {
      const { relicNFT, owner } = await loadFixture(deployRelicNFTFixture);
      expect(await relicNFT.owner()).to.equal(owner.address);
    });

    it("Should set the correct base URI", async function () {
      const { relicNFT, owner } = await loadFixture(deployRelicNFTFixture);

      // Mint a token to test URI
      await relicNFT.connect(owner).mint(owner.address, 30, 1000_000000);

      const tokenURI = await relicNFT.tokenURI(1);
      expect(tokenURI).to.equal("https://relic.io/metadata/1.json");
    });

    it("Should start with tokenId 1", async function () {
      const { relicNFT, owner } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(owner.address, 30, 1000_000000);

      expect(await relicNFT.ownerOf(1)).to.equal(owner.address);
      expect(await relicNFT.totalSupply()).to.equal(1);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await expect(relicNFT.connect(owner).mint(user1.address, 30, 1000_000000))
        .to.not.be.reverted;

      expect(await relicNFT.ownerOf(1)).to.equal(user1.address);
    });

    it("Should revert if non-owner tries to mint", async function () {
      const { relicNFT, user1 } = await loadFixture(deployRelicNFTFixture);

      await expect(relicNFT.connect(user1).mint(user1.address, 30, 1000_000000))
        .to.be.reverted; // OwnableUnauthorizedAccount
    });

    it("Should store correct metadata", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      const lockDays = 90;
      const principal = 5000_000000;

      await relicNFT.connect(owner).mint(user1.address, lockDays, principal);

      const meta = await relicNFT.meta(1);
      expect(meta.lockDays).to.equal(lockDays);
      expect(meta.principal).to.equal(principal);
      expect(meta.lockEnd).to.be.greaterThan(0);
    });

    it("Should calculate correct lockEnd timestamp", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      const lockDays = 30;
      const beforeMint = Math.floor(Date.now() / 1000);

      await relicNFT.connect(owner).mint(user1.address, lockDays, 1000_000000);

      const meta = await relicNFT.meta(1);
      const expectedLockEnd = beforeMint + (lockDays * 86400);

      // Allow 10 seconds tolerance for block timestamp
      expect(meta.lockEnd).to.be.closeTo(expectedLockEnd, 10);
    });

    it("Should increment tokenId for each mint", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      await relicNFT.connect(owner).mint(user1.address, 90, 2000_000000);
      await relicNFT.connect(owner).mint(user1.address, 180, 3000_000000);

      expect(await relicNFT.totalSupply()).to.equal(3);
      expect(await relicNFT.ownerOf(1)).to.equal(user1.address);
      expect(await relicNFT.ownerOf(2)).to.equal(user1.address);
      expect(await relicNFT.ownerOf(3)).to.equal(user1.address);
    });

    it("Should return correct tokenId from mint", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      // Using call to get return value (not mined transaction)
      const tokenId = await relicNFT.connect(owner).mint.staticCall(user1.address, 30, 1000_000000);
      expect(tokenId).to.equal(1);
    });

    it("Should support different lock periods", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      const lockPeriods = [30, 90, 180, 365];

      for (let i = 0; i < lockPeriods.length; i++) {
        await relicNFT.connect(owner).mint(user1.address, lockPeriods[i], 1000_000000);

        const meta = await relicNFT.meta(i + 1);
        expect(meta.lockDays).to.equal(lockPeriods[i]);
      }
    });

    it("Should support different principal amounts", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      const principals = [100_000000, 1000_000000, 10000_000000, 100000_000000];

      for (let i = 0; i < principals.length; i++) {
        await relicNFT.connect(owner).mint(user1.address, 30, principals[i]);

        const meta = await relicNFT.meta(i + 1);
        expect(meta.principal).to.equal(principals[i]);
      }
    });
  });

  describe("Token URI", function () {
    it("Should return correct URI for minted token", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);

      const uri = await relicNFT.tokenURI(1);
      expect(uri).to.equal("https://relic.io/metadata/1.json");
    });

    it("Should return correct URI for multiple tokens", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      await relicNFT.connect(owner).mint(user1.address, 90, 2000_000000);
      await relicNFT.connect(owner).mint(user1.address, 180, 3000_000000);

      expect(await relicNFT.tokenURI(1)).to.equal("https://relic.io/metadata/1.json");
      expect(await relicNFT.tokenURI(2)).to.equal("https://relic.io/metadata/2.json");
      expect(await relicNFT.tokenURI(3)).to.equal("https://relic.io/metadata/3.json");
    });

    it("Should revert for non-existent token", async function () {
      const { relicNFT } = await loadFixture(deployRelicNFTFixture);

      await expect(relicNFT.tokenURI(999))
        .to.be.revertedWithCustomError(relicNFT, "ERC721NonexistentToken");
    });

    it("Should return empty string if baseURI is not set", async function () {
      const { owner, user1 } = await loadFixture(deployRelicNFTFixture);

      const RelicNFTFactory = await ethers.getContractFactory("RelicNFT");
      const relicNFT = await RelicNFTFactory.deploy("") as RelicNFT;

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);

      const uri = await relicNFT.tokenURI(1);
      expect(uri).to.equal("");
    });
  });

  describe("Update Base URI", function () {
    it("Should allow owner to update base URI", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);

      await relicNFT.connect(owner).updateBaseURI("https://new-url.io/");

      const uri = await relicNFT.tokenURI(1);
      expect(uri).to.equal("https://new-url.io/1.json");
    });

    it("Should revert if non-owner tries to update URI", async function () {
      const { relicNFT, user1 } = await loadFixture(deployRelicNFTFixture);

      await expect(relicNFT.connect(user1).updateBaseURI("https://new-url.io/"))
        .to.be.reverted; // OwnableUnauthorizedAccount
    });

    it("Should affect all existing tokens", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      await relicNFT.connect(owner).mint(user1.address, 90, 2000_000000);

      await relicNFT.connect(owner).updateBaseURI("https://updated.io/meta/");

      expect(await relicNFT.tokenURI(1)).to.equal("https://updated.io/meta/1.json");
      expect(await relicNFT.tokenURI(2)).to.equal("https://updated.io/meta/2.json");
    });

    it("Should allow setting empty base URI", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      await relicNFT.connect(owner).updateBaseURI("");

      const uri = await relicNFT.tokenURI(1);
      expect(uri).to.equal("");
    });
  });

  describe("ERC721Enumerable", function () {
    it("Should track total supply correctly", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      expect(await relicNFT.totalSupply()).to.equal(0);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      expect(await relicNFT.totalSupply()).to.equal(1);

      await relicNFT.connect(owner).mint(user1.address, 90, 2000_000000);
      expect(await relicNFT.totalSupply()).to.equal(2);
    });

    it("Should support tokenByIndex", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      await relicNFT.connect(owner).mint(user1.address, 90, 2000_000000);

      expect(await relicNFT.tokenByIndex(0)).to.equal(1);
      expect(await relicNFT.tokenByIndex(1)).to.equal(2);
    });

    it("Should support tokenOfOwnerByIndex", async function () {
      const { relicNFT, owner, user1, user2 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      await relicNFT.connect(owner).mint(user2.address, 90, 2000_000000);
      await relicNFT.connect(owner).mint(user1.address, 180, 3000_000000);

      expect(await relicNFT.tokenOfOwnerByIndex(user1.address, 0)).to.equal(1);
      expect(await relicNFT.tokenOfOwnerByIndex(user1.address, 1)).to.equal(3);
      expect(await relicNFT.tokenOfOwnerByIndex(user2.address, 0)).to.equal(2);
    });

    it("Should return correct balanceOf", async function () {
      const { relicNFT, owner, user1, user2 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      await relicNFT.connect(owner).mint(user1.address, 90, 2000_000000);
      await relicNFT.connect(owner).mint(user2.address, 180, 3000_000000);

      expect(await relicNFT.balanceOf(user1.address)).to.equal(2);
      expect(await relicNFT.balanceOf(user2.address)).to.equal(1);
    });
  });

  describe("Transfers", function () {
    it("Should allow token transfers", async function () {
      const { relicNFT, owner, user1, user2 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);

      await relicNFT.connect(user1).transferFrom(user1.address, user2.address, 1);

      expect(await relicNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("Should preserve metadata after transfer", async function () {
      const { relicNFT, owner, user1, user2 } = await loadFixture(deployRelicNFTFixture);

      const lockDays = 90;
      const principal = 5000_000000;

      await relicNFT.connect(owner).mint(user1.address, lockDays, principal);

      const metaBefore = await relicNFT.meta(1);

      await relicNFT.connect(user1).transferFrom(user1.address, user2.address, 1);

      const metaAfter = await relicNFT.meta(1);

      expect(metaAfter.lockDays).to.equal(metaBefore.lockDays);
      expect(metaAfter.principal).to.equal(metaBefore.principal);
      expect(metaAfter.lockEnd).to.equal(metaBefore.lockEnd);
    });

    it("Should support approve and transferFrom", async function () {
      const { relicNFT, owner, user1, user2 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);

      await relicNFT.connect(user1).approve(user2.address, 1);

      await relicNFT.connect(user2).transferFrom(user1.address, user2.address, 1);

      expect(await relicNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("Should support setApprovalForAll", async function () {
      const { relicNFT, owner, user1, user2 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      await relicNFT.connect(owner).mint(user1.address, 90, 2000_000000);

      await relicNFT.connect(user1).setApprovalForAll(user2.address, true);

      await relicNFT.connect(user2).transferFrom(user1.address, user2.address, 1);
      await relicNFT.connect(user2).transferFrom(user1.address, user2.address, 2);

      expect(await relicNFT.ownerOf(1)).to.equal(user2.address);
      expect(await relicNFT.ownerOf(2)).to.equal(user2.address);
    });
  });

  describe("Metadata Access", function () {
    it("Should return metadata for any token", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 365, 10000_000000);

      const meta = await relicNFT.meta(1);

      expect(meta.lockDays).to.equal(365);
      expect(meta.principal).to.equal(10000_000000);
      expect(meta.lockEnd).to.be.greaterThan(0);
    });

    it("Should return zero metadata for non-existent token", async function () {
      const { relicNFT } = await loadFixture(deployRelicNFTFixture);

      const meta = await relicNFT.meta(999);

      expect(meta.lockDays).to.equal(0);
      expect(meta.principal).to.equal(0);
      expect(meta.lockEnd).to.equal(0);
    });

    it("Should allow reading metadata by anyone", async function () {
      const { relicNFT, owner, user1, user2 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 90, 5000_000000);

      // User2 (not owner) can read metadata
      const meta = await relicNFT.connect(user2).meta(1);

      expect(meta.lockDays).to.equal(90);
      expect(meta.principal).to.equal(5000_000000);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very large principal amounts", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      const largePrincipal = ethers.parseUnits("1000000", 6); // 1M USDC

      await relicNFT.connect(owner).mint(user1.address, 365, largePrincipal);

      const meta = await relicNFT.meta(1);
      expect(meta.principal).to.equal(largePrincipal);
    });

    it("Should handle minting many tokens", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      for (let i = 0; i < 10; i++) {
        await relicNFT.connect(owner).mint(user1.address, 30, 1000_000000);
      }

      expect(await relicNFT.totalSupply()).to.equal(10);
      expect(await relicNFT.balanceOf(user1.address)).to.equal(10);
    });

    it("Should handle zero principal", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).mint(user1.address, 30, 0);

      const meta = await relicNFT.meta(1);
      expect(meta.principal).to.equal(0);
    });
  });

  describe("Ownership", function () {
    it("Should allow ownership transfer", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).transferOwnership(user1.address);

      expect(await relicNFT.owner()).to.equal(user1.address);
    });

    it("Should allow new owner to mint", async function () {
      const { relicNFT, owner, user1, user2 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).transferOwnership(user1.address);

      await relicNFT.connect(user1).mint(user2.address, 30, 1000_000000);

      expect(await relicNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("Should prevent old owner from minting after transfer", async function () {
      const { relicNFT, owner, user1 } = await loadFixture(deployRelicNFTFixture);

      await relicNFT.connect(owner).transferOwnership(user1.address);

      await expect(relicNFT.connect(owner).mint(user1.address, 30, 1000_000000))
        .to.be.reverted;
    });
  });
});
