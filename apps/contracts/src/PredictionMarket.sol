// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @notice A multi-outcome prediction market where users can create markets,
 * place predictions on different outcomes, and claim winnings proportionally.
 * @dev Uses simple pool-based mechanism where winners split the entire pot.
 */
contract PredictionMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Market {
        address creator;
        address resolver;
        string question;
        IERC20 predictionToken;
        uint256 numOutcomes;
        string[] outcomes;
        uint256 totalPool;
        bool resolved;
        uint256 winningOutcome;
        uint256 createdAt;
    }

    // Market ID counter
    uint256 public marketCount;

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
        address predictionToken,
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

    /**
     * @notice Creates a new prediction market
     * @param question The question or description of the market
     * @param resolver Address that can resolve the market
     * @param predictionToken ERC20 token used for predictions
     * @param outcomes Array of outcome descriptions (e.g., ["Yes", "No"])
     * @return marketId The ID of the newly created market
     */
    function createMarket(
        string calldata question,
        address resolver,
        address predictionToken,
        string[] calldata outcomes
    ) external returns (uint256 marketId) {
        if (resolver == address(0)) revert InvalidResolver();
        if (outcomes.length < 2) revert InvalidNumOutcomes();

        marketId = marketCount++;

        markets[marketId] = Market({
            creator: msg.sender,
            resolver: resolver,
            question: question,
            predictionToken: IERC20(predictionToken),
            numOutcomes: outcomes.length,
            outcomes: outcomes,
            totalPool: 0,
            resolved: false,
            winningOutcome: 0,
            createdAt: block.timestamp
        });

        emit MarketCreated(
            marketId,
            msg.sender,
            question,
            resolver,
            predictionToken,
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
        market.predictionToken.safeTransferFrom(msg.sender, address(this), amount);

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
        if (hasClaimed[marketId][msg.sender]) revert AlreadyClaimed();

        uint256 userPrediction = userPredictions[marketId][msg.sender][market.winningOutcome];
        if (userPrediction == 0) revert NoWinnings();

        uint256 winningPool = outcomePools[marketId][market.winningOutcome];
        
        // Calculate proportional winnings
        // userWinnings = (userPrediction / winningPool) * totalPool
        uint256 winnings = (userPrediction * market.totalPool) / winningPool;

        // Mark as claimed
        hasClaimed[marketId][msg.sender] = true;

        // Transfer winnings
        market.predictionToken.safeTransfer(msg.sender, winnings);

        emit WinningsClaimed(marketId, msg.sender, winnings);
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

        return (userPrediction * market.totalPool) / outcomePool;
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

