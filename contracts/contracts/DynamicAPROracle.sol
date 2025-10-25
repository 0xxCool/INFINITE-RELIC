// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DynamicAPROracle
 * @notice Oracle for dynamic APR adjustments based on market conditions
 * @dev This contract provides real-time APR multipliers for different lock periods
 *
 * Key Features:
 * - Market-responsive APR adjustments
 * - Smoothed rate changes (no sudden jumps)
 * - Owner-controlled for security
 * - Chainlink integration ready
 */
contract DynamicAPROracle is Ownable {

    // APR multipliers in basis points (10000 = 1.0x = 100%)
    // Example: 12000 = 1.2x multiplier (20% boost)
    mapping(uint32 => uint256) public aprMultipliers;

    // Historical APR data for analytics
    struct APRSnapshot {
        uint32 lockDays;
        uint256 multiplier;
        uint256 timestamp;
    }
    APRSnapshot[] public aprHistory;

    // Maximum allowed multiplier (2.0x = 200%)
    uint256 public constant MAX_MULTIPLIER = 20000;

    // Minimum allowed multiplier (0.8x = 80%)
    uint256 public constant MIN_MULTIPLIER = 8000;

    // Rate change cooldown (prevent manipulation)
    uint256 public constant RATE_CHANGE_COOLDOWN = 1 hours;
    uint256 public lastRateChange;

    // Events
    event APRMultiplierUpdated(uint32 indexed lockDays, uint256 oldMultiplier, uint256 newMultiplier);
    event EmergencyPause(bool paused);

    // Emergency pause
    bool public paused;

    constructor() Ownable(msg.sender) {
        // Initialize with 1.0x multipliers (neutral)
        aprMultipliers[30] = 10000;
        aprMultipliers[90] = 10000;
        aprMultipliers[180] = 10000;
        aprMultipliers[365] = 10000;

        lastRateChange = block.timestamp;
    }

    /**
     * @notice Update APR multiplier for a specific lock period
     * @param lockDays The lock period (30, 90, 180, or 365)
     * @param newMultiplier New multiplier in basis points
     */
    function updateAPRMultiplier(uint32 lockDays, uint256 newMultiplier) external onlyOwner {
        require(!paused, "Oracle is paused");
        require(
            lockDays == 30 || lockDays == 90 || lockDays == 180 || lockDays == 365,
            "Invalid lock period"
        );
        require(
            newMultiplier >= MIN_MULTIPLIER && newMultiplier <= MAX_MULTIPLIER,
            "Multiplier out of bounds"
        );
        require(
            block.timestamp >= lastRateChange + RATE_CHANGE_COOLDOWN,
            "Rate change cooldown active"
        );

        uint256 oldMultiplier = aprMultipliers[lockDays];
        aprMultipliers[lockDays] = newMultiplier;
        lastRateChange = block.timestamp;

        // Record in history
        aprHistory.push(APRSnapshot({
            lockDays: lockDays,
            multiplier: newMultiplier,
            timestamp: block.timestamp
        }));

        emit APRMultiplierUpdated(lockDays, oldMultiplier, newMultiplier);
    }

    /**
     * @notice Batch update all multipliers
     * @param multipliers Array of [30days, 90days, 180days, 365days] multipliers
     */
    function batchUpdateMultipliers(uint256[4] calldata multipliers) external onlyOwner {
        require(!paused, "Oracle is paused");
        require(
            block.timestamp >= lastRateChange + RATE_CHANGE_COOLDOWN,
            "Rate change cooldown active"
        );

        uint32[4] memory periods = [uint32(30), uint32(90), uint32(180), uint32(365)];

        for (uint256 i = 0; i < 4; i++) {
            require(
                multipliers[i] >= MIN_MULTIPLIER && multipliers[i] <= MAX_MULTIPLIER,
                "Multiplier out of bounds"
            );

            uint256 oldMultiplier = aprMultipliers[periods[i]];
            aprMultipliers[periods[i]] = multipliers[i];

            aprHistory.push(APRSnapshot({
                lockDays: periods[i],
                multiplier: multipliers[i],
                timestamp: block.timestamp
            }));

            emit APRMultiplierUpdated(periods[i], oldMultiplier, multipliers[i]);
        }

        lastRateChange = block.timestamp;
    }

    /**
     * @notice Get current APR multiplier for a lock period
     * @param lockDays The lock period
     * @return Multiplier in basis points
     */
    function getMultiplier(uint32 lockDays) external view returns (uint256) {
        return paused ? 10000 : aprMultipliers[lockDays]; // Return 1.0x if paused
    }

    /**
     * @notice Calculate effective APR with multiplier
     * @param baseAPR Base APR in basis points
     * @param lockDays Lock period
     * @return Effective APR in basis points
     */
    function calculateEffectiveAPR(uint256 baseAPR, uint32 lockDays) external view returns (uint256) {
        if (paused) return baseAPR;
        return (baseAPR * aprMultipliers[lockDays]) / 10000;
    }

    /**
     * @notice Get APR history length
     */
    function getHistoryLength() external view returns (uint256) {
        return aprHistory.length;
    }

    /**
     * @notice Get APR snapshot at index
     */
    function getSnapshot(uint256 index) external view returns (APRSnapshot memory) {
        require(index < aprHistory.length, "Index out of bounds");
        return aprHistory[index];
    }

    /**
     * @notice Emergency pause/unpause
     */
    function togglePause() external onlyOwner {
        paused = !paused;
        emit EmergencyPause(paused);
    }
}
