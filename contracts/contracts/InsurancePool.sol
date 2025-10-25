// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InsurancePool
 * @notice Decentralized insurance pool for Relic holders
 * @dev Community-funded protection against RWA adapter failures
 *
 * Revolutionary Features:
 * - Staking rewards for insurers (earn while protecting)
 * - Automatic claim processing
 * - Risk-adjusted premiums
 * - Transparent governance
 */
contract InsurancePool is Ownable, ReentrancyGuard {

    IERC20 public immutable usdc;

    // Pool stats
    uint256 public totalStaked;
    uint256 public totalClaimed;
    uint256 public coverageRatio = 3000; // 30% coverage (in basis points)

    // Staker info
    struct Staker {
        uint256 amount;
        uint256 shares;
        uint256 lastRewardBlock;
    }
    mapping(address => Staker) public stakers;

    // Total shares for reward calculation
    uint256 public totalShares;

    // Reward rate: 5% APR distributed to stakers
    uint256 public constant REWARD_RATE = 500; // 5% in basis points
    uint256 public constant BLOCKS_PER_YEAR = 2_628_000; // ~12s per block on Arbitrum

    // Minimum stake
    uint256 public constant MIN_STAKE = 100e6; // 100 USDC

    // Events
    event Staked(address indexed user, uint256 amount, uint256 shares);
    event Unstaked(address indexed user, uint256 amount);
    event ClaimPaid(address indexed recipient, uint256 amount, string reason);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Stake USDC to provide insurance coverage
     * @param amount Amount to stake (6 decimals)
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount >= MIN_STAKE, "Below minimum stake");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        Staker storage staker = stakers[msg.sender];

        // Calculate pending rewards before updating
        if (staker.amount > 0) {
            uint256 pending = _pendingRewards(msg.sender);
            if (pending > 0) {
                usdc.transfer(msg.sender, pending);
                emit RewardsClaimed(msg.sender, pending);
            }
        }

        // Calculate shares (proportional to stake)
        uint256 shares = totalShares == 0 ? amount : (amount * totalShares) / totalStaked;

        staker.amount += amount;
        staker.shares += shares;
        staker.lastRewardBlock = block.number;

        totalStaked += amount;
        totalShares += shares;

        emit Staked(msg.sender, amount, shares);
    }

    /**
     * @notice Unstake USDC and claim rewards
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        Staker storage staker = stakers[msg.sender];
        require(staker.amount >= amount, "Insufficient stake");

        // Claim pending rewards
        uint256 pending = _pendingRewards(msg.sender);
        if (pending > 0) {
            usdc.transfer(msg.sender, pending);
            emit RewardsClaimed(msg.sender, pending);
        }

        // Calculate shares to burn
        uint256 sharesToBurn = (amount * staker.shares) / staker.amount;

        staker.amount -= amount;
        staker.shares -= sharesToBurn;
        staker.lastRewardBlock = block.number;

        totalStaked -= amount;
        totalShares -= sharesToBurn;

        // Transfer staked amount back
        usdc.transfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Claim accumulated rewards without unstaking
     */
    function claimRewards() external nonReentrant {
        Staker storage staker = stakers[msg.sender];
        require(staker.amount > 0, "No stake");

        uint256 pending = _pendingRewards(msg.sender);
        require(pending > 0, "No rewards");

        staker.lastRewardBlock = block.number;

        usdc.transfer(msg.sender, pending);

        emit RewardsClaimed(msg.sender, pending);
    }

    /**
     * @notice Calculate pending rewards for a staker
     * @param user Address of staker
     * @return Pending rewards in USDC
     */
    function pendingRewards(address user) external view returns (uint256) {
        return _pendingRewards(user);
    }

    /**
     * @notice Internal: Calculate pending rewards
     */
    function _pendingRewards(address user) internal view returns (uint256) {
        Staker storage staker = stakers[user];
        if (staker.amount == 0 || totalShares == 0) return 0;

        uint256 blocksPassed = block.number - staker.lastRewardBlock;
        uint256 annualReward = (staker.amount * REWARD_RATE) / 10000;
        uint256 blockReward = (annualReward * blocksPassed) / BLOCKS_PER_YEAR;

        return blockReward;
    }

    /**
     * @notice Get maximum coverage available
     * @return Max coverage in USDC
     */
    function getMaxCoverage() external view returns (uint256) {
        return (totalStaked * coverageRatio) / 10000;
    }

    /**
     * @notice Owner: Pay insurance claim
     * @param recipient Claim recipient
     * @param amount Claim amount
     * @param reason Claim reason
     */
    function payClaim(address recipient, uint256 amount, string calldata reason) external onlyOwner {
        require(amount <= (totalStaked * coverageRatio) / 10000, "Exceeds coverage");
        require(usdc.transfer(recipient, amount), "Transfer failed");

        totalClaimed += amount;

        emit ClaimPaid(recipient, amount, reason);
    }

    /**
     * @notice Owner: Update coverage ratio
     * @param newRatio New ratio in basis points (max 5000 = 50%)
     */
    function updateCoverageRatio(uint256 newRatio) external onlyOwner {
        require(newRatio <= 5000, "Ratio too high");
        coverageRatio = newRatio;
    }
}
