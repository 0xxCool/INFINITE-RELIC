// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title RelicMarketplace
 * @notice Decentralized P2P marketplace for trading Relic NFTs
 * @dev Zero-fee marketplace with optional premium features
 *
 * Unique Features:
 * - 0% trading fees (attract liquidity)
 * - Instant buy/sell
 * - Offer system (negotiation)
 * - Bulk discounts
 * - Price discovery analytics
 */
contract RelicMarketplace is ReentrancyGuard, Ownable, Pausable {

    IERC721 public immutable relicNFT;
    IERC20 public immutable usdc;

    // Listing structure
    struct Listing {
        address seller;
        uint256 price; // in USDC (6 decimals)
        uint256 listedAt;
        bool active;
    }

    // Offer structure
    struct Offer {
        address buyer;
        uint256 amount;
        uint256 expiry;
        bool active;
    }

    // Storage
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer[]) public offers;

    // Analytics
    struct TradeStats {
        uint256 totalVolume;
        uint256 totalTrades;
        uint256 avgPrice;
        uint256 highPrice;
        uint256 lowPrice;
    }
    TradeStats public stats;

    // Recent trades for price discovery
    struct Trade {
        uint256 tokenId;
        uint256 price;
        address seller;
        address buyer;
        uint256 timestamp;
    }
    Trade[] public recentTrades;
    uint256 public constant MAX_RECENT_TRADES = 100;

    // Events
    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Unlisted(uint256 indexed tokenId, address indexed seller);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event OfferMade(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event OfferAccepted(uint256 indexed tokenId, uint256 offerIndex, address indexed buyer, uint256 amount);
    event OfferCancelled(uint256 indexed tokenId, uint256 offerIndex, address indexed buyer);

    // Errors
    error NotOwner();
    error NotListed();
    error AlreadyListed();
    error InvalidPrice();
    error InsufficientBalance();
    error InsufficientAllowance();
    error OfferExpired();
    error InvalidOffer();

    constructor(address _relicNFT, address _usdc) Ownable(msg.sender) {
        relicNFT = IERC721(_relicNFT);
        usdc = IERC20(_usdc);
    }

    /**
     * @notice List a Relic for sale
     * @param tokenId Token ID to list
     * @param price Sale price in USDC (6 decimals)
     */
    function list(uint256 tokenId, uint256 price) external nonReentrant whenNotPaused {
        if (relicNFT.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (listings[tokenId].active) revert AlreadyListed();
        if (price == 0) revert InvalidPrice();

        // Transfer NFT to marketplace (escrow)
        relicNFT.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            listedAt: block.timestamp,
            active: true
        });

        emit Listed(tokenId, msg.sender, price);
    }

    /**
     * @notice Cancel listing and retrieve NFT
     * @param tokenId Token ID to unlist
     */
    function unlist(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        if (!listing.active) revert NotListed();
        if (listing.seller != msg.sender) revert NotOwner();

        listing.active = false;

        // Return NFT to seller
        relicNFT.transferFrom(address(this), msg.sender, tokenId);

        emit Unlisted(tokenId, msg.sender);
    }

    /**
     * @notice Buy a listed Relic instantly
     * @param tokenId Token ID to buy
     */
    function buy(uint256 tokenId) external nonReentrant whenNotPaused {
        Listing storage listing = listings[tokenId];
        if (!listing.active) revert NotListed();

        uint256 price = listing.price;
        address seller = listing.seller;

        // Check buyer has funds
        if (usdc.balanceOf(msg.sender) < price) revert InsufficientBalance();
        if (usdc.allowance(msg.sender, address(this)) < price) revert InsufficientAllowance();

        // Mark as sold
        listing.active = false;

        // Transfer USDC to seller (0% fee!)
        usdc.transferFrom(msg.sender, seller, price);

        // Transfer NFT to buyer
        relicNFT.transferFrom(address(this), msg.sender, tokenId);

        // Update analytics
        _recordTrade(tokenId, price, seller, msg.sender);

        emit Sold(tokenId, seller, msg.sender, price);
    }

    /**
     * @notice Make an offer on a listed Relic
     * @param tokenId Token ID
     * @param amount Offer amount in USDC
     * @param duration Offer validity duration in seconds
     */
    function makeOffer(uint256 tokenId, uint256 amount, uint256 duration) external nonReentrant whenNotPaused {
        Listing storage listing = listings[tokenId];
        if (!listing.active) revert NotListed();
        if (amount == 0) revert InvalidOffer();
        if (usdc.balanceOf(msg.sender) < amount) revert InsufficientBalance();

        uint256 expiry = block.timestamp + duration;

        offers[tokenId].push(Offer({
            buyer: msg.sender,
            amount: amount,
            expiry: expiry,
            active: true
        }));

        emit OfferMade(tokenId, msg.sender, amount);
    }

    /**
     * @notice Accept an offer
     * @param tokenId Token ID
     * @param offerIndex Index of the offer to accept
     */
    function acceptOffer(uint256 tokenId, uint256 offerIndex) external nonReentrant whenNotPaused {
        Listing storage listing = listings[tokenId];
        if (!listing.active) revert NotListed();
        if (listing.seller != msg.sender) revert NotOwner();

        Offer storage offer = offers[tokenId][offerIndex];
        if (!offer.active) revert InvalidOffer();
        if (block.timestamp > offer.expiry) revert OfferExpired();

        uint256 amount = offer.amount;
        address buyer = offer.buyer;

        // Check buyer still has funds
        if (usdc.balanceOf(buyer) < amount) revert InsufficientBalance();
        if (usdc.allowance(buyer, address(this)) < amount) revert InsufficientAllowance();

        // Mark as sold
        listing.active = false;
        offer.active = false;

        // Transfer USDC to seller
        usdc.transferFrom(buyer, msg.sender, amount);

        // Transfer NFT to buyer
        relicNFT.transferFrom(address(this), buyer, tokenId);

        // Update analytics
        _recordTrade(tokenId, amount, msg.sender, buyer);

        emit OfferAccepted(tokenId, offerIndex, buyer, amount);
    }

    /**
     * @notice Cancel your own offer
     * @param tokenId Token ID
     * @param offerIndex Index of the offer to cancel
     */
    function cancelOffer(uint256 tokenId, uint256 offerIndex) external {
        Offer storage offer = offers[tokenId][offerIndex];
        if (offer.buyer != msg.sender) revert NotOwner();
        if (!offer.active) revert InvalidOffer();

        offer.active = false;

        emit OfferCancelled(tokenId, offerIndex, msg.sender);
    }

    /**
     * @notice Get all active offers for a token
     * @param tokenId Token ID
     * @return Array of active offers
     */
    function getActiveOffers(uint256 tokenId) external view returns (Offer[] memory) {
        Offer[] memory allOffers = offers[tokenId];
        uint256 activeCount = 0;

        // Count active offers
        for (uint256 i = 0; i < allOffers.length; i++) {
            if (allOffers[i].active && block.timestamp <= allOffers[i].expiry) {
                activeCount++;
            }
        }

        // Create array of active offers
        Offer[] memory activeOffers = new Offer[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allOffers.length; i++) {
            if (allOffers[i].active && block.timestamp <= allOffers[i].expiry) {
                activeOffers[index] = allOffers[i];
                index++;
            }
        }

        return activeOffers;
    }

    /**
     * @notice Get recent trades for price discovery
     * @return Array of recent trades (max 100)
     */
    function getRecentTrades() external view returns (Trade[] memory) {
        uint256 length = recentTrades.length > MAX_RECENT_TRADES ? MAX_RECENT_TRADES : recentTrades.length;
        Trade[] memory result = new Trade[](length);

        uint256 startIndex = recentTrades.length > MAX_RECENT_TRADES ? recentTrades.length - MAX_RECENT_TRADES : 0;

        for (uint256 i = 0; i < length; i++) {
            result[i] = recentTrades[startIndex + i];
        }

        return result;
    }

    /**
     * @notice Get market statistics
     */
    function getMarketStats() external view returns (TradeStats memory) {
        return stats;
    }

    /**
     * @notice Internal: Record a trade for analytics
     */
    function _recordTrade(uint256 tokenId, uint256 price, address seller, address buyer) internal {
        recentTrades.push(Trade({
            tokenId: tokenId,
            price: price,
            seller: seller,
            buyer: buyer,
            timestamp: block.timestamp
        }));

        // Update stats
        stats.totalVolume += price;
        stats.totalTrades += 1;
        stats.avgPrice = stats.totalVolume / stats.totalTrades;

        if (stats.highPrice == 0 || price > stats.highPrice) {
            stats.highPrice = price;
        }
        if (stats.lowPrice == 0 || price < stats.lowPrice) {
            stats.lowPrice = price;
        }
    }

    /**
     * @notice Emergency: Pause marketplace
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Emergency: Unpause marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
