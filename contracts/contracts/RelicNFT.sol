// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RelicNFT
 * @notice ERC-721 with metadata storage for lock periods
 * @dev Tradeable on OpenSea, contains lock time + principal info
 */
contract RelicNFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    struct RelicMeta {
        uint32 lockDays;      // 30, 90, 180, 365
        uint256 principal;    // USDC amount (6 decimals)
        uint256 lockEnd;      // Unix timestamp
    }

    mapping(uint256 => RelicMeta) public meta;

    string private _baseTokenURI;
    uint256 private _nextId = 1;

    constructor(string memory baseURI) ERC721("Infinite Relic", "RELIC") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    /// @notice Only Vault can mint
    function mint(address to, uint32 lockDays, uint256 principal) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextId++;
        _mint(to, tokenId);

        uint256 lockEnd = block.timestamp + (uint256(lockDays) * 86400);
        meta[tokenId] = RelicMeta({
            lockDays: lockDays,
            principal: principal,
            lockEnd: lockEnd
        });

        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return bytes(_baseTokenURI).length > 0
            ? string.concat(_baseTokenURI, tokenId.toString(), ".json")
            : "";
    }

    /// @notice Update base URI for metadata
    function updateBaseURI(string memory newURI) external onlyOwner {
        _baseTokenURI = newURI;
    }
}
