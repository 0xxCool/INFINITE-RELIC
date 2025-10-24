// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RelicNFT.sol";
import "./YieldToken.sol";
import "./interfaces/IRWAAdapter.sol";

/**
 * @title RelicVault
 * @notice Main contract: accepts USDC, mints RelicNFT, invests in RWA, mints daily $YIELD
 * @dev Uses ReentrancyGuard for all external functions handling value
 *
 * Flow:
 * 1. User calls mintRelic(lockDays, usdcAmount)
 * 2. Contract takes USDC → charges 1% dev fee → invests 99% in RWA
 * 3. Mints NFT with lock period
 * 4. User can claimYield() daily (5% baseline APR)
 * 5. If APR > 15%, dev gets 10% performance fee
 */
contract RelicVault is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/
    event RelicMinted(address indexed user, uint256 indexed tokenId, uint256 principal, uint32 lockDays);
    event YieldClaimed(address indexed user, uint256 indexed tokenId, uint256 amount);
    event RWAInvested(uint256 amount);
    event DevFeeCharged(address indexed recipient, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                               ERRORS
    //////////////////////////////////////////////////////////////*/
    error InvalidLockPeriod();
    error MinimumDepositNotMet();
    error NotRelicOwner();
    error NoYieldToClaim();
    error ZeroAddress();

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/
    uint256 private constant PRECISION = 1e18;
    uint256 private constant SECONDS_PER_DAY = 86400;

    /// @dev 1% dev fee on principal (100 basis points)
    uint256 private constant DEV_FEE_PRINCIPAL_BPS = 100;

    /// @dev 10% performance fee on yield > 15% APR (1000 basis points)
    uint256 private constant PERF_FEE_BPS = 1000;
    uint256 private constant HIGH_APR_THRESHOLD = 15 * PRECISION / 100; // 0.15 = 15%

    /// @dev Baseline APR: 5% per annum
    uint256 private constant BASELINE_APR = 5 * PRECISION / 100; // 0.05

    /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/
    IERC20 public immutable USDC;
    RelicNFT public immutable RELIC;
    YieldToken public immutable YIELD;
    IRWAAdapter public immutable RWA;

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => uint256) public principal;          // tokenId => USDC amount
    mapping(uint256 => uint256) public lockEnd;            // tokenId => timestamp
    mapping(uint256 => uint256) public lastClaimedDay;     // tokenId => day number

    uint256 public totalPrincipal;
    uint256 public totalRWAPrincipal;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _usdc,
        address _relic,
        address _yield,
        address _rwa
    ) Ownable(msg.sender) {
        if (_usdc == address(0) || _relic == address(0) || _yield == address(0) || _rwa == address(0)) {
            revert ZeroAddress();
        }

        USDC = IERC20(_usdc);
        RELIC = RelicNFT(_relic);
        YIELD = YieldToken(_yield);
        RWA = IRWAAdapter(_rwa);
    }

    /*//////////////////////////////////////////////////////////////
                          USER-FACING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint a new Relic NFT with locked USDC
     * @param lockDays Lock period (30, 90, 180, or 365 days)
     * @param usdcAmount USDC to deposit (minimum 10 USDC = 10e6)
     * @return tokenId The minted NFT ID
     */
    function mintRelic(uint32 lockDays, uint256 usdcAmount)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 tokenId)
    {
        // Validate inputs
        if (usdcAmount < 10e6) revert MinimumDepositNotMet();
        if (lockDays != 30 && lockDays != 90 && lockDays != 180 && lockDays != 365) {
            revert InvalidLockPeriod();
        }

        // 1. Transfer USDC from user
        USDC.safeTransferFrom(msg.sender, address(this), usdcAmount);

        // 2. Charge 1% dev fee immediately
        uint256 devFee = (usdcAmount * DEV_FEE_PRINCIPAL_BPS) / 10_000;
        if (devFee > 0) {
            USDC.safeTransfer(owner(), devFee);
            emit DevFeeCharged(owner(), devFee);
        }

        uint256 investAmount = usdcAmount - devFee;

        // 3. Invest in RWA adapter
        USDC.forceApprove(address(RWA), investAmount);
        RWA.deposit(investAmount);
        totalRWAPrincipal += investAmount;
        emit RWAInvested(investAmount);

        // 4. Mint NFT
        tokenId = RELIC.mint(msg.sender, lockDays, usdcAmount);

        // 5. Store metadata
        principal[tokenId] = usdcAmount;
        lockEnd[tokenId] = block.timestamp + (uint256(lockDays) * SECONDS_PER_DAY);
        lastClaimedDay[tokenId] = block.timestamp / SECONDS_PER_DAY;

        totalPrincipal += usdcAmount;

        emit RelicMinted(msg.sender, tokenId, usdcAmount, lockDays);
    }

    /**
     * @notice Claim accumulated $YIELD for a Relic
     * @param tokenId Relic NFT ID
     */
    function claimYield(uint256 tokenId) external nonReentrant {
        if (RELIC.ownerOf(tokenId) != msg.sender) revert NotRelicOwner();

        uint256 grossYield = _calculateYield(tokenId);
        if (grossYield == 0) revert NoYieldToClaim();

        // Update claim timestamp
        lastClaimedDay[tokenId] = block.timestamp / SECONDS_PER_DAY;

        // Calculate performance fee (if APR > 15%)
        uint256 perfFee = _performanceFee(grossYield, tokenId);
        uint256 netYield = grossYield - perfFee;

        // Mint yield tokens
        YIELD.mint(msg.sender, netYield);
        if (perfFee > 0) {
            YIELD.mint(owner(), perfFee);
            emit DevFeeCharged(owner(), perfFee);
        }

        emit YieldClaimed(msg.sender, tokenId, netYield);
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL & VIEW
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Calculate yield based on 5% baseline APR
     * @param tokenId The Relic NFT ID
     * @return Gross yield in USDC (6 decimals)
     */
    function _calculateYield(uint256 tokenId) internal view returns (uint256) {
        uint256 currentDay = block.timestamp / SECONDS_PER_DAY;
        uint256 daysElapsed = currentDay - lastClaimedDay[tokenId];

        if (daysElapsed == 0) return 0;

        uint256 principalAmount = principal[tokenId];

        // Baseline 5% APR: daily rate = 0.05 / 365
        uint256 dailyRate = BASELINE_APR / 365;
        uint256 grossYield = (principalAmount * dailyRate * daysElapsed) / PRECISION;

        return grossYield;
    }

    /**
     * @dev Calculate performance fee if effective APR > 15%
     * @param yieldAmount The gross yield amount
     * @param tokenId The Relic NFT ID
     * @return Performance fee amount
     */
    function _performanceFee(uint256 yieldAmount, uint256 tokenId) internal view returns (uint256) {
        uint256 currentDay = block.timestamp / SECONDS_PER_DAY;
        uint256 daysElapsed = currentDay - lastClaimedDay[tokenId];

        if (daysElapsed == 0) return 0;

        uint256 principalAmount = principal[tokenId];

        // Calculate effective APR: (yield * 365 * PRECISION) / (principal * days)
        uint256 effectiveAPR = (yieldAmount * 365 * PRECISION) / (principalAmount * daysElapsed);

        if (effectiveAPR > HIGH_APR_THRESHOLD) {
            // Charge 10% on the excess yield above 15%
            uint256 excessRate = effectiveAPR - HIGH_APR_THRESHOLD;
            uint256 excessYield = (principalAmount * excessRate * daysElapsed) / (PRECISION * 365);
            uint256 fee = (excessYield * PERF_FEE_BPS) / 10_000;
            return fee;
        }

        return 0;
    }

    /**
     * @notice View claimable yield for a token
     * @param tokenId The Relic NFT ID
     * @return Claimable yield amount
     */
    function viewClaimableYield(uint256 tokenId) external view returns (uint256) {
        return _calculateYield(tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency: migrate RWA adapter
     * @dev Requires RWA adapter to implement migration logic
     */
    function migrateRWA(address newRWA) external onlyOwner {
        RWA.migrate(newRWA);
    }

    /**
     * @notice Withdraw accidentally sent tokens (not USDC from users!)
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(USDC), "Cannot withdraw user USDC");
        IERC20(token).safeTransfer(owner(), amount);
    }
}
