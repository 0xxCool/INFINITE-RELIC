// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title MockRWAAdapter
 * @notice Simulates Ondo OUSG with 5% APR compounding
 * @dev ERC-4626 compliant vault for testing
 */
contract MockRWAAdapter is ERC4626 {
    using Math for uint256;

    uint256 private _multiplier = 1e18; // Starts at 1.0
    uint256 private _lastUpdate;

    constructor(IERC20 _asset) ERC4626(_asset) ERC20("Mock OUSG", "mOUSG") {
        _lastUpdate = block.timestamp;
    }

    /// @dev Accrue 5% APR daily
    function _accrue() internal {
        uint256 daysElapsed = (block.timestamp - _lastUpdate) / 86400;
        if (daysElapsed == 0) return;

        // 5% annual = 0.0137% daily (5/365)
        uint256 dailyRate = (5e18 * daysElapsed) / 36500; // 5% / 365 / 100
        _multiplier += (_multiplier * dailyRate) / 1e18;
        _lastUpdate = block.timestamp;
    }

    function totalAssets() public view override returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 0;
        return supply.mulDiv(_multiplier, 1e18, Math.Rounding.Floor);
    }

    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        _accrue();
        return super.deposit(assets, receiver);
    }

    function mint(uint256 shares, address receiver) public override returns (uint256) {
        _accrue();
        return super.mint(shares, receiver);
    }

    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) {
        _accrue();
        return super.withdraw(assets, receiver, owner);
    }

    function redeem(uint256 shares, address receiver, address owner) public override returns (uint256) {
        _accrue();
        return super.redeem(shares, receiver, owner);
    }

    /// @notice Bulk deposit helper for Vault
    function deposit(uint256 assets) external returns (uint256) {
        return deposit(assets, msg.sender);
    }

    /// @notice Migration placeholder
    function migrate(address) external pure {
        revert("Migration not implemented in mock");
    }
}
