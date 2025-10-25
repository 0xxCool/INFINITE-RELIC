import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { RelicMarketplace, RelicNFT, MockUSDC } from "../typechain-types";

describe("RelicMarketplace", function () {
  async function deployMarketplaceFixture() {
    const [owner, seller, buyer, other] = await ethers.getSigners();

    // Deploy USDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = (await MockUSDCFactory.deploy()) as MockUSDC;
    await usdc.waitForDeployment();

    // Deploy NFT
    const RelicNFTFactory = await ethers.getContractFactory("RelicNFT");
    const nft = (await RelicNFTFactory.deploy("https://relic.io/")) as RelicNFT;
    await nft.waitForDeployment();

    // Deploy Marketplace
    const MarketplaceFactory = await ethers.getContractFactory("RelicMarketplace");
    const marketplace = (await MarketplaceFactory.deploy(
      await nft.getAddress(),
      await usdc.getAddress()
    )) as RelicMarketplace;
    await marketplace.waitForDeployment();

    // Mint test NFTs
    await nft.mint(seller.address, 30, 100_000000); // tokenId 1
    await nft.mint(seller.address, 90, 200_000000); // tokenId 2

    // Give buyers USDC
    await usdc.transfer(buyer.address, 1000_000000); // 1000 USDC

    return { marketplace, nft, usdc, owner, seller, buyer, other };
  }

  describe("Deployment", function () {
    it("Should set correct NFT and USDC addresses", async function () {
      const { marketplace, nft, usdc } = await loadFixture(deployMarketplaceFixture);

      expect(await marketplace.relicNFT()).to.equal(await nft.getAddress());
      expect(await marketplace.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set correct owner", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.owner()).to.equal(owner.address);
    });
  });

  describe("Listing", function () {
    it("Should allow NFT owner to list", async function () {
      const { marketplace, nft, seller } = await loadFixture(deployMarketplaceFixture);

      // Approve marketplace
      await nft.connect(seller).approve(await marketplace.getAddress(), 1);

      // List NFT
      const price = 100_000000; // 100 USDC
      await expect(marketplace.connect(seller).list(1, price))
        .to.emit(marketplace, "Listed")
        .withArgs(1, seller.address, price);

      // Check listing
      const listing = await marketplace.listings(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(price);
      expect(listing.active).to.equal(true);
    });

    it("Should revert if not owner tries to list", async function () {
      const { marketplace, nft, buyer } = await loadFixture(deployMarketplaceFixture);

      await expect(marketplace.connect(buyer).list(1, 100_000000))
        .to.be.revertedWithCustomError(marketplace, "NotOwner");
    });

    it("Should revert if price is zero", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      await expect(marketplace.connect(seller).list(1, 0))
        .to.be.revertedWithCustomError(marketplace, "InvalidPrice");
    });

    it("Should revert if already listed", async function () {
      const { marketplace, nft, seller } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).list(1, 100_000000);

      await expect(marketplace.connect(seller).list(1, 100_000000))
        .to.be.revertedWithCustomError(marketplace, "AlreadyListed");
    });
  });

  describe("Unlisting", function () {
    it("Should allow seller to unlist", async function () {
      const { marketplace, nft, seller } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).list(1, 100_000000);

      await expect(marketplace.connect(seller).unlist(1))
        .to.emit(marketplace, "Unlisted")
        .withArgs(1, seller.address);

      const listing = await marketplace.listings(1);
      expect(listing.active).to.equal(false);
    });

    it("Should revert if not seller tries to unlist", async function () {
      const { marketplace, nft, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).list(1, 100_000000);

      await expect(marketplace.connect(buyer).unlist(1))
        .to.be.revertedWithCustomError(marketplace, "NotOwner");
    });
  });

  describe("Buying", function () {
    it("Should allow buyer to purchase listed NFT", async function () {
      const { marketplace, nft, usdc, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      const price = 100_000000;
      await nft.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).list(1, price);

      // Approve USDC
      await usdc.connect(buyer).approve(await marketplace.getAddress(), price);

      // Buy
      await expect(marketplace.connect(buyer).buy(1))
        .to.emit(marketplace, "Sold")
        .withArgs(1, seller.address, buyer.address, price);

      // Check NFT ownership
      expect(await nft.ownerOf(1)).to.equal(buyer.address);

      // Check USDC transfer
      expect(await usdc.balanceOf(seller.address)).to.equal(price);
    });

    it("Should update stats after sale", async function () {
      const { marketplace, nft, usdc, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      const price = 100_000000;
      await nft.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).list(1, price);
      await usdc.connect(buyer).approve(await marketplace.getAddress(), price);
      await marketplace.connect(buyer).buy(1);

      const stats = await marketplace.stats();
      expect(stats.totalVolume).to.equal(price);
      expect(stats.totalTrades).to.equal(1);
      expect(stats.avgPrice).to.equal(price);
      expect(stats.highPrice).to.equal(price);
      expect(stats.lowPrice).to.equal(price);
    });

    it("Should revert if insufficient balance", async function () {
      const { marketplace, nft, usdc, seller, other } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).list(1, 100_000000);

      // other has no USDC
      await expect(marketplace.connect(other).buy(1))
        .to.be.revertedWithCustomError(marketplace, "InsufficientBalance");
    });
  });

  describe("Offers", function () {
    it("Should allow buyer to make offer", async function () {
      const { marketplace, usdc, buyer } = await loadFixture(deployMarketplaceFixture);

      const amount = 50_000000;
      const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour

      await usdc.connect(buyer).approve(await marketplace.getAddress(), amount);

      await expect(marketplace.connect(buyer).makeOffer(1, amount, expiry))
        .to.emit(marketplace, "OfferMade")
        .withArgs(1, buyer.address, amount);

      const offers = await marketplace.offers(1, 0);
      expect(offers.buyer).to.equal(buyer.address);
      expect(offers.amount).to.equal(amount);
      expect(offers.active).to.equal(true);
    });

    it("Should allow seller to accept offer", async function () {
      const { marketplace, nft, usdc, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      const amount = 50_000000;
      const expiry = Math.floor(Date.now() / 1000) + 3600;

      await usdc.connect(buyer).approve(await marketplace.getAddress(), amount);
      await marketplace.connect(buyer).makeOffer(1, amount, expiry);

      await nft.connect(seller).approve(await marketplace.getAddress(), 1);

      await expect(marketplace.connect(seller).acceptOffer(1, 0))
        .to.emit(marketplace, "OfferAccepted")
        .withArgs(1, 0, buyer.address, amount);

      // Check ownership
      expect(await nft.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should allow buyer to cancel offer", async function () {
      const { marketplace, usdc, buyer } = await loadFixture(deployMarketplaceFixture);

      const amount = 50_000000;
      const expiry = Math.floor(Date.now() / 1000) + 3600;

      await usdc.connect(buyer).approve(await marketplace.getAddress(), amount);
      await marketplace.connect(buyer).makeOffer(1, amount, expiry);

      await expect(marketplace.connect(buyer).cancelOffer(1, 0))
        .to.emit(marketplace, "OfferCancelled")
        .withArgs(1, 0, buyer.address);

      const offer = await marketplace.offers(1, 0);
      expect(offer.active).to.equal(false);
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(owner).pause();
      expect(await marketplace.paused()).to.equal(true);
    });

    it("Should prevent listing when paused", async function () {
      const { marketplace, owner, seller } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(owner).pause();

      await expect(marketplace.connect(seller).list(1, 100_000000))
        .to.be.reverted;
    });

    it("Should allow owner to unpause", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(owner).pause();
      await marketplace.connect(owner).unpause();

      expect(await marketplace.paused()).to.equal(false);
    });
  });
});
