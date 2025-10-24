// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice 6-decimal USDC for testing (mimics real USDC)
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        // Mint 100M USDC to deployer for testing
        _mint(msg.sender, 100_000_000 * 1e6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Public faucet for testing
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }
}
