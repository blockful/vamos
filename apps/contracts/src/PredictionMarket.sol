// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionMarket
 * @notice A multi-outcome prediction market where users can create markets,
 * place predictions on different outcomes, and claim winnings proportionally.
 * @dev Uses simple pool-based mechanism where winners split the entire pot.
 */
contract PredictionMarket is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // The only token supported by this contract
    IERC20 public immutable predictionToken;
    
    // Fee configuration
    uint256 public protocolFeeRate; // In basis points (e.g., 200 = 2%)
    uint256 public creatorFeeRate; // In basis points (e.g., 300 = 3%)
    uint256 public constant MAX_FEE_RATE = 1000; // 10% maximum per fee
    uint256 public constant MAX_TOTAL_FEE_RATE = 2000; // 20% maximum combined

    struct Market {
        address creator;
        address resolver;
        string question;
        uint256 numOutcomes;
        string[] outcomes;
        uint256 totalPool;
        bool resolved;
        uint256 winningOutcome;
        uint256 createdAt;
        uint256 poolAfterFees;
        uint256 protocolFeeAmount;
        uint256 creatorFeeAmount;
        bool noWinners;
    }

    // Market ID counter
    uint256 public marketCount;

    /**
     * @notice Constructor
     * @param _predictionToken The ERC20 token to be used for all predictions in all markets
     * @param _protocolFeeRate Protocol fee rate in basis points (e.g., 200 = 2%)
     * @param _creatorFeeRate Creator fee rate in basis points (e.g., 300 = 3%)
     */
    constructor(address _predictionToken, uint256 _protocolFeeRate, uint256 _creatorFeeRate) Ownable(msg.sender) {
        if (_protocolFeeRate > MAX_FEE_RATE) revert InvalidFeeRate();
        if (_creatorFeeRate > MAX_FEE_RATE) revert InvalidFeeRate();
        if (_protocolFeeRate + _creatorFeeRate > MAX_TOTAL_FEE_RATE) revert InvalidFeeRate();
        
        predictionToken = IERC20(_predictionToken);
        protocolFeeRate = _protocolFeeRate;
        creatorFeeRate = _creatorFeeRate;
    }

    // Mappings
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(uint256 => uint256)) public outcomePools; // marketId => outcomeId => totalPredictions
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public userPredictions; // marketId => user => outcomeId => predictionAmount
    mapping(uint256 => mapping(address => bool)) public hasClaimed; // marketId => user => claimed

    // Events
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        address indexed resolver,
        string[] outcomes
    );

    event PredictionPlaced(
        uint256 indexed marketId,
        address indexed user,
        uint256 indexed outcomeId,
        uint256 amount
    );

    event MarketResolved(
        uint256 indexed marketId,
        uint256 indexed winningOutcome
    );

    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );
    
    event FeesDistributed(
        uint256 indexed marketId,
        uint256 protocolFee,
        uint256 creatorFee
    );
    
    event FeeRatesUpdated(uint256 protocolFeeRate, uint256 creatorFeeRate);
    event RefundClaimed(uint256 indexed marketId, address indexed user, uint256 amount);

    // Errors
    error InvalidResolver();
    error InvalidNumOutcomes();
    error InvalidOutcomesLength();
    error MarketNotFound();
    error MarketAlreadyResolved();
    error InvalidOutcome();
    error PredictionAmountZero();
    error MarketNotResolved();
    error OnlyResolver();
    error AlreadyClaimed();
    error NoWinnings();
    error InvalidFeeRate();
    error NotNoWinnerMarket();
    error NoPredictions();

    /**
     * @notice Set fee rates for both protocol and creator
     * @param _protocolFeeRate New protocol fee rate in basis points
     * @param _creatorFeeRate New creator fee rate in basis points
     */
    function setFees(uint256 _protocolFeeRate, uint256 _creatorFeeRate) external onlyOwner {
        if (_protocolFeeRate > MAX_FEE_RATE) revert InvalidFeeRate();
        if (_creatorFeeRate > MAX_FEE_RATE) revert InvalidFeeRate();
        if (_protocolFeeRate + _creatorFeeRate > MAX_TOTAL_FEE_RATE) revert InvalidFeeRate();
        
        protocolFeeRate = _protocolFeeRate;
        creatorFeeRate = _creatorFeeRate;
        emit FeeRatesUpdated(_protocolFeeRate, _creatorFeeRate);
    }

    /**
     * @notice Creates a new prediction market
     * @param question The question or description of the market
     * @param resolver Address that can resolve the market
     * @param outcomes Array of outcome descriptions (e.g., ["Yes", "No"])
     * @return marketId The ID of the newly created market
     */
    function createMarket(
        string calldata question,
        address resolver,
        string[] calldata outcomes
    ) external returns (uint256 marketId) {
        if (resolver == address(0)) revert InvalidResolver();
        if (outcomes.length < 2) revert InvalidNumOutcomes();

        marketId = marketCount++;

        markets[marketId] = Market({
            creator: msg.sender,
            resolver: resolver,
            question: question,
            numOutcomes: outcomes.length,
            outcomes: outcomes,
            totalPool: 0,
            resolved: false,
            winningOutcome: 0,
            createdAt: block.timestamp,
            poolAfterFees: 0,
            protocolFeeAmount: 0,
            creatorFeeAmount: 0,
            noWinners: false
        });

        emit MarketCreated(
            marketId,
            msg.sender,
            question,
            resolver,
            outcomes
        );
    }

    /**
     * @notice Place a prediction on a specific outcome
     * @param marketId ID of the market
     * @param outcomeId ID of the outcome to predict (0-indexed)
     * @param amount Amount of tokens to predict
     */
    function placePrediction(
        uint256 marketId,
        uint256 outcomeId,
        uint256 amount
    ) external nonReentrant {
        Market storage market = markets[marketId];
        
        if (market.createdAt == 0) revert MarketNotFound();
        if (market.resolved) revert MarketAlreadyResolved();
        if (outcomeId >= market.numOutcomes) revert InvalidOutcome();
        if (amount == 0) revert PredictionAmountZero();

        // Transfer tokens from user to contract
        predictionToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update state
        userPredictions[marketId][msg.sender][outcomeId] += amount;
        outcomePools[marketId][outcomeId] += amount;
        market.totalPool += amount;

        emit PredictionPlaced(marketId, msg.sender, outcomeId, amount);
    }

    /**
     * @notice Resolve a market by setting the winning outcome
     * @param marketId ID of the market to resolve
     * @param winningOutcome ID of the winning outcome
     */
    function resolveMarket(
        uint256 marketId,
        uint256 winningOutcome
    ) external {
        Market storage market = markets[marketId];

        if (market.createdAt == 0) revert MarketNotFound();
        if (msg.sender != market.resolver) revert OnlyResolver();
        if (market.resolved) revert MarketAlreadyResolved();
        if (winningOutcome >= market.numOutcomes) revert InvalidOutcome();

        market.resolved = true;
        market.winningOutcome = winningOutcome;
        
        // Check if anyone predicted the winning outcome
        uint256 winningPool = outcomePools[marketId][winningOutcome];
        
        if (winningPool == 0) {
            // No winners - mark for refunds, don't take fees
            market.noWinners = true;
            market.poolAfterFees = market.totalPool;
            market.protocolFeeAmount = 0;
            market.creatorFeeAmount = 0;
        } else {
            // Calculate and distribute fees
            uint256 protocolFee = (market.totalPool * protocolFeeRate) / 10000;
            uint256 creatorFee = (market.totalPool * creatorFeeRate) / 10000;
            
            market.protocolFeeAmount = protocolFee;
            market.creatorFeeAmount = creatorFee;
            market.poolAfterFees = market.totalPool - protocolFee - creatorFee;
            
            // Transfer fees immediately
            if (protocolFee > 0) {
                predictionToken.safeTransfer(owner(), protocolFee);
            }
            if (creatorFee > 0) {
                predictionToken.safeTransfer(market.creator, creatorFee);
            }
            
            emit FeesDistributed(marketId, protocolFee, creatorFee);
        }

        emit MarketResolved(marketId, winningOutcome);
    }

    /**
     * @notice Claim winnings for a resolved market
     * @param marketId ID of the market to claim from
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];

        if (market.createdAt == 0) revert MarketNotFound();
        if (!market.resolved) revert MarketNotResolved();
        if (market.noWinners) revert NotNoWinnerMarket();
        if (hasClaimed[marketId][msg.sender]) revert AlreadyClaimed();

        uint256 userPrediction = userPredictions[marketId][msg.sender][market.winningOutcome];
        if (userPrediction == 0) revert NoWinnings();

        uint256 winningPool = outcomePools[marketId][market.winningOutcome];
        
        // Calculate proportional winnings from pool after fees
        // userWinnings = (userPrediction / winningPool) * poolAfterFees
        uint256 winnings = (userPrediction * market.poolAfterFees) / winningPool;

        // Mark as claimed
        hasClaimed[marketId][msg.sender] = true;

        // Transfer winnings
        predictionToken.safeTransfer(msg.sender, winnings);

        emit WinningsClaimed(marketId, msg.sender, winnings);
    }
    
    /**
     * @notice Claim refund for a market with no winners
     * @param marketId ID of the market to claim refund from
     */
    function claimRefund(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];

        if (market.createdAt == 0) revert MarketNotFound();
        if (!market.resolved) revert MarketNotResolved();
        if (!market.noWinners) revert NotNoWinnerMarket();
        if (hasClaimed[marketId][msg.sender]) revert AlreadyClaimed();

        // Calculate total predictions by this user across all outcomes
        uint256 totalUserPredictions = 0;
        for (uint256 i = 0; i < market.numOutcomes; i++) {
            totalUserPredictions += userPredictions[marketId][msg.sender][i];
        }
        
        if (totalUserPredictions == 0) revert NoPredictions();

        // Mark as claimed
        hasClaimed[marketId][msg.sender] = true;

        // Transfer refund
        predictionToken.safeTransfer(msg.sender, totalUserPredictions);

        emit RefundClaimed(marketId, msg.sender, totalUserPredictions);
    }

    /**
     * @notice Get market details
     * @param marketId ID of the market
     * @return Market struct
     */
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    /**
     * @notice Get pool size for a specific outcome
     * @param marketId ID of the market
     * @param outcomeId ID of the outcome
     * @return Total amount predicted on this outcome
     */
    function getOutcomePool(uint256 marketId, uint256 outcomeId) external view returns (uint256) {
        return outcomePools[marketId][outcomeId];
    }

    /**
     * @notice Get user's prediction on a specific outcome
     * @param marketId ID of the market
     * @param user Address of the user
     * @param outcomeId ID of the outcome
     * @return User's prediction amount
     */
    function getUserPrediction(
        uint256 marketId,
        address user,
        uint256 outcomeId
    ) external view returns (uint256) {
        return userPredictions[marketId][user][outcomeId];
    }

    /**
     * @notice Calculate potential winnings for a user
     * @param marketId ID of the market
     * @param user Address of the user
     * @param outcomeId ID of the outcome to check
     * @return Potential winnings if this outcome wins
     */
    function calculatePotentialWinnings(
        uint256 marketId,
        address user,
        uint256 outcomeId
    ) external view returns (uint256) {
        Market memory market = markets[marketId];
        uint256 userPrediction = userPredictions[marketId][user][outcomeId];
        
        if (userPrediction == 0 || market.totalPool == 0) return 0;
        
        uint256 outcomePool = outcomePools[marketId][outcomeId];
        if (outcomePool == 0) return 0;

        // If market is resolved, use poolAfterFees, otherwise estimate
        if (market.resolved) {
            return (userPrediction * market.poolAfterFees) / outcomePool;
        } else {
            // Estimate pool after fees for unresolved markets
            uint256 protocolFee = (market.totalPool * protocolFeeRate) / 10000;
            uint256 creatorFee = (market.totalPool * creatorFeeRate) / 10000;
            uint256 estimatedPoolAfterFees = market.totalPool - protocolFee - creatorFee;
            return (userPrediction * estimatedPoolAfterFees) / outcomePool;
        }
    }

    /**
     * @notice Get all outcome descriptions for a market
     * @param marketId ID of the market
     * @return Array of outcome descriptions
     */
    function getOutcomes(uint256 marketId) external view returns (string[] memory) {
        return markets[marketId].outcomes;
    }

    /**
     * @notice Get a specific outcome description
     * @param marketId ID of the market
     * @param outcomeId ID of the outcome
     * @return Outcome description
     */
    function getOutcomeDescription(
        uint256 marketId,
        uint256 outcomeId
    ) external view returns (string memory) {
        Market storage market = markets[marketId];
        if (outcomeId >= market.numOutcomes) revert InvalidOutcome();
        return market.outcomes[outcomeId];
    }
}

