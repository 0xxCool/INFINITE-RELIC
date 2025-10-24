// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IRWAAdapter
 * @notice Interface for Real-World-Asset adapters (e.g., Ondo OUSG)
 */
interface IRWAAdapter {
    function deposit(uint256 assets) external returns (uint256 shares);
    function redeem(uint256 shares) external returns (uint256 assets);
    function totalAssets() external view returns (uint256);
    function migrate(address newAdapter) external;
}
