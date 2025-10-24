// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YieldToken
 * @notice Daily mintable yield token - no transfer tax
 * @dev Only the vault can mint tokens
 */
contract YieldToken is ERC20, Ownable {
    constructor() ERC20("Relic Yield", "YIELD") Ownable(msg.sender) {}

    /// @notice Only Vault can mint
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Users can burn their own tokens
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
