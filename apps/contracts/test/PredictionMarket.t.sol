// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/PredictionMarket.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Standard ERC20 token for testing
 */
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @dev Token that doesn't return a boolean (like USDT on mainnet)
 * This tests SafeERC20 functionality
 */
contract NonStandardToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    string public name = "Non Standard Token";
    string public symbol = "NST";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
    
    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
    }
    
    // Doesn't return bool!
    function transfer(address to, uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }
    
    // Doesn't return bool!
    function transferFrom(address from, address to, uint256 amount) external {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
    }
}

contract PredictionMarketTest is Test {
    PredictionMarket public market;
    MockERC20 public token;
    NonStandardToken public nstToken;
    
    address public owner = address(0x999);
    address public creator = address(1);
    address public judge = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    
    uint256 public constant PROTOCOL_FEE = 200; // 2%
    uint256 public constant CREATOR_FEE = 300; // 3%
    
    function setUp() public {
        token = new MockERC20();
        nstToken = new NonStandardToken();
        
        // Deploy market with standard token and fees
        vm.prank(owner);
        market = new PredictionMarket(address(token), PROTOCOL_FEE, CREATOR_FEE);
        
        // Mint tokens to users
        token.mint(user1, 1000 ether);
        token.mint(user2, 1000 ether);
        
        nstToken.mint(user1, 1000 ether);
        nstToken.mint(user2, 1000 ether);
    }
    
    function testStandardToken() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        
        uint256 marketId = market.createMarket(
            "Will it rain tomorrow?",
            judge,
            outcomes
        );
        vm.stopPrank();
        
        // User1 places prediction
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // Verify balances
        assertEq(token.balanceOf(address(market)), 100 ether, "Contract should receive exactly 100 tokens");
        assertEq(market.getUserPrediction(marketId, user1, 0), 100 ether, "User prediction should be 100");
    }
    
    function testNonStandardToken() public {
        // Deploy a separate market instance with non-standard token
        vm.prank(owner);
        PredictionMarket nstMarket = new PredictionMarket(address(nstToken), PROTOCOL_FEE, CREATOR_FEE);
        
        // Create market with non-standard token (doesn't return bool)
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        
        uint256 marketId = nstMarket.createMarket(
            "Will it rain tomorrow?",
            judge,
            outcomes
        );
        vm.stopPrank();
        
        // User1 places prediction with non-standard token
        vm.startPrank(user1);
        nstToken.approve(address(nstMarket), 100 ether);
        
        // SafeERC20 should handle non-standard tokens that don't return bool
        nstMarket.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // Verify it works
        assertEq(nstToken.balanceOf(address(nstMarket)), 100 ether, "Should handle non-standard tokens");
        assertEq(nstMarket.getUserPrediction(marketId, user1, 0), 100 ether, "User prediction should be recorded");
    }
    
    function testMultipleUsersPredictions() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        
        uint256 marketId = market.createMarket(
            "Will it rain tomorrow?",
            judge,
            outcomes
        );
        vm.stopPrank();
        
        // User1 places 100 tokens on outcome 0
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // User2 places 200 tokens on outcome 0
        vm.startPrank(user2);
        token.approve(address(market), 200 ether);
        market.placePrediction(marketId, 0, 200 ether);
        vm.stopPrank();
        
        // Verify pool totals
        PredictionMarket.Market memory marketData = market.getMarket(marketId);
        assertEq(marketData.totalPool, 300 ether, "Total pool should be 300");
        assertEq(market.getOutcomePool(marketId, 0), 300 ether, "Outcome 0 pool should be 300");
        
        // Resolve market (outcome 0 wins)
        vm.prank(judge);
        market.resolveMarket(marketId, 0);
        
        // Calculate expected winnings (with fees)
        // Total: 300, Protocol fee: 6 (2%), Creator fee: 9 (3%), Pool after fees: 285
        uint256 user1WinningsExpected = market.calculatePotentialWinnings(marketId, user1, 0);
        uint256 user2WinningsExpected = market.calculatePotentialWinnings(marketId, user2, 0);
        
        // User1 should get: (100 / 300) * 285 = 95 tokens
        // User2 should get: (200 / 300) * 285 = 190 tokens
        assertEq(user1WinningsExpected, 95 ether, "User1 should win 95 tokens");
        assertEq(user2WinningsExpected, 190 ether, "User2 should win 190 tokens");
        
        // Claim winnings
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(marketId);
        uint256 user1Received = token.balanceOf(user1) - user1BalanceBefore;
        
        assertEq(user1Received, 95 ether, "User1 should receive 95 tokens");
    }
    
    function testClaimWinningsFullScenario() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        
        uint256 marketId = market.createMarket(
            "Standard token market?",
            judge,
            outcomes
        );
        vm.stopPrank();
        
        // User1 places prediction on outcome 0
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // User2 places prediction on outcome 1
        vm.startPrank(user2);
        token.approve(address(market), 50 ether);
        market.placePrediction(marketId, 1, 50 ether);
        vm.stopPrank();
        
        // Verify state before resolution
        assertEq(market.getUserPrediction(marketId, user1, 0), 100 ether, "User1 prediction exact");
        assertEq(market.getUserPrediction(marketId, user2, 1), 50 ether, "User2 prediction exact");
        assertEq(token.balanceOf(address(market)), 150 ether, "Contract balance exact");
        
        PredictionMarket.Market memory marketData = market.getMarket(marketId);
        assertEq(marketData.totalPool, 150 ether, "Total pool exact");
        
        // Resolve market - outcome 0 wins
        vm.prank(judge);
        market.resolveMarket(marketId, 0);
        
        // Claim winnings
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(marketId);
        uint256 user1Received = token.balanceOf(user1) - user1BalanceBefore;
        
        // User1 should receive pool after fees
        // Total: 150, Protocol fee: 3 (2%), Creator fee: 4.5 (3%), Pool after fees: 142.5
        assertEq(user1Received, 142.5 ether, "User1 should receive exact winnings after fees");
        
        // Verify user2 has no winnings on the winning outcome
        assertEq(market.getUserPrediction(marketId, user2, 0), 0, "User2 should have no predictions on winning outcome");
    }
    
    // ============================================
    // Fee System Tests
    // ============================================
    
    function testConstructorSetsFees() public {
        assertEq(market.owner(), owner, "Owner should be set");
        assertEq(market.protocolFeeRate(), PROTOCOL_FEE, "Protocol fee should be set");
        assertEq(market.creatorFeeRate(), CREATOR_FEE, "Creator fee should be set");
    }
    
    function testConstructorRejectsHighProtocolFee() public {
        vm.prank(owner);
        vm.expectRevert();
        new PredictionMarket(address(token), 501, 100); // 5.01% protocol fee (> MAX)
    }
    
    function testConstructorRejectsHighCreatorFee() public {
        vm.prank(owner);
        vm.expectRevert();
        new PredictionMarket(address(token), 100, 501); // 5.01% creator fee (> MAX)
    }
    
    function testConstructorRejectsCombinedHighFees() public {
        vm.prank(owner);
        vm.expectRevert();
        new PredictionMarket(address(token), 500, 501); // 5% + 5.01% = 10.01% total (> MAX)
    }
    
    function testOnlyOwnerCanSetFees() public {
        vm.prank(user1);
        vm.expectRevert();
        market.setFees(150, 250);
        
        // Owner can set it
        vm.prank(owner);
        market.setFees(150, 250);
        assertEq(market.protocolFeeRate(), 150, "Protocol fee should be updated");
        assertEq(market.creatorFeeRate(), 250, "Creator fee should be updated");
    }
    
    function testSetFeesRejectsHighProtocolFee() public {
        vm.prank(owner);
        vm.expectRevert();
        market.setFees(501, 100); // Protocol > 5%
    }
    
    function testSetFeesRejectsHighCreatorFee() public {
        vm.prank(owner);
        vm.expectRevert();
        market.setFees(100, 501); // Creator > 5%
    }
    
    function testSetFeesRejectsCombinedHighFees() public {
        vm.prank(owner);
        vm.expectRevert();
        market.setFees(500, 501); // 5% + 5.01% > 10%
    }
    
    function testFeesDistributedDuringResolution() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // User1 places 100 tokens on outcome 0
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // User2 places 50 tokens on outcome 1
        vm.startPrank(user2);
        token.approve(address(market), 50 ether);
        market.placePrediction(marketId, 1, 50 ether);
        vm.stopPrank();
        
        // Total pool: 150 ether
        // Expected protocol fee: 150 * 0.02 = 3 ether
        // Expected creator fee: 150 * 0.03 = 4.5 ether
        // Pool after fees: 142.5 ether
        
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 creatorBalanceBefore = token.balanceOf(creator);
        
        // Resolve market
        vm.prank(judge);
        market.resolveMarket(marketId, 0);
        
        // Check fees were transferred
        assertEq(token.balanceOf(owner) - ownerBalanceBefore, 3 ether, "Protocol fee should be transferred");
        assertEq(token.balanceOf(creator) - creatorBalanceBefore, 4.5 ether, "Creator fee should be transferred");
        
        // Check market data
        PredictionMarket.Market memory marketData = market.getMarket(marketId);
        assertEq(marketData.protocolFeeAmount, 3 ether, "Protocol fee amount should be stored");
        assertEq(marketData.creatorFeeAmount, 4.5 ether, "Creator fee amount should be stored");
        assertEq(marketData.poolAfterFees, 142.5 ether, "Pool after fees should be correct");
    }
    
    function testWinningsCalculatedFromPoolAfterFees() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // User1 places 100 tokens on outcome 0 (winner)
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // User2 places 200 tokens on outcome 1 (loser)
        vm.startPrank(user2);
        token.approve(address(market), 200 ether);
        market.placePrediction(marketId, 1, 200 ether);
        vm.stopPrank();
        
        // Total pool: 300 ether
        // Protocol fee: 300 * 0.02 = 6 ether
        // Creator fee: 300 * 0.03 = 9 ether
        // Pool after fees: 285 ether
        
        // Resolve market (outcome 0 wins)
        vm.prank(judge);
        market.resolveMarket(marketId, 0);
        
        // User1 should get entire poolAfterFees (285 ether) since they're the only winner
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(marketId);
        uint256 user1Received = token.balanceOf(user1) - user1BalanceBefore;
        
        assertEq(user1Received, 285 ether, "User1 should receive pool after fees");
    }
    
    function testZeroFeesWork() public {
        // Deploy market with zero fees
        vm.prank(owner);
        PredictionMarket zeroFeeMarket = new PredictionMarket(address(token), 0, 0);
        
        // Create and resolve market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = zeroFeeMarket.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(zeroFeeMarket), 100 ether);
        zeroFeeMarket.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 creatorBalanceBefore = token.balanceOf(creator);
        
        vm.prank(judge);
        zeroFeeMarket.resolveMarket(marketId, 0);
        
        // No fees should be transferred
        assertEq(token.balanceOf(owner), ownerBalanceBefore, "No protocol fee with 0% rate");
        assertEq(token.balanceOf(creator), creatorBalanceBefore, "No creator fee with 0% rate");
    }
    
    function testNoWinnerScenarioRefundsWithoutFees() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](3);
        outcomes[0] = "A";
        outcomes[1] = "B";
        outcomes[2] = "C";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // User1 predicts on outcome 0
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // User2 predicts on outcome 1
        vm.startPrank(user2);
        token.approve(address(market), 50 ether);
        market.placePrediction(marketId, 1, 50 ether);
        vm.stopPrank();
        
        // Total pool: 150 ether
        
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 creatorBalanceBefore = token.balanceOf(creator);
        
        // Resolve to outcome 2 (nobody predicted this)
        vm.prank(judge);
        market.resolveMarket(marketId, 2);
        
        // No fees should be taken
        assertEq(token.balanceOf(owner), ownerBalanceBefore, "No protocol fee when no winners");
        assertEq(token.balanceOf(creator), creatorBalanceBefore, "No creator fee when no winners");
        
        // Market should be marked for refund
        PredictionMarket.Market memory marketData = market.getMarket(marketId);
        assertTrue(marketData.noWinners, "Market should be marked as no winners");
        assertEq(marketData.poolAfterFees, 150 ether, "Pool after fees should equal total pool");
        
        // Users should be able to claim refunds
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimRefund(marketId);
        assertEq(token.balanceOf(user1) - user1BalanceBefore, 100 ether, "User1 should get refund");
        
        uint256 user2BalanceBefore = token.balanceOf(user2);
        vm.prank(user2);
        market.claimRefund(marketId);
        assertEq(token.balanceOf(user2) - user2BalanceBefore, 50 ether, "User2 should get refund");
    }
    
    function testCannotClaimRefundTwice() public {
        // Setup no-winner scenario
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 1, 100 ether);
        vm.stopPrank();
        
        // Resolve to outcome 0 (nobody predicted)
        vm.prank(judge);
        market.resolveMarket(marketId, 0);
        
        // Claim refund
        vm.prank(user1);
        market.claimRefund(marketId);
        
        // Try to claim again
        vm.prank(user1);
        vm.expectRevert();
        market.claimRefund(marketId);
    }
    
    function testCannotClaimRefundIfNotNoWinnerMarket() public {
        // Normal market with winners
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // Resolve to outcome 0 (has winner)
        vm.prank(judge);
        market.resolveMarket(marketId, 0);
        
        // Try to claim refund - should fail
        vm.prank(user1);
        vm.expectRevert();
        market.claimRefund(marketId);
    }
    
    function testMultipleWinnersSplitPoolAfterFees() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // User1: 100 tokens on outcome 0
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // User2: 200 tokens on outcome 0
        vm.startPrank(user2);
        token.approve(address(market), 200 ether);
        market.placePrediction(marketId, 0, 200 ether);
        vm.stopPrank();
        
        // Total: 300 ether on outcome 0
        // Protocol fee: 6 ether (2%)
        // Creator fee: 9 ether (3%)
        // Pool after fees: 285 ether
        // User1 share: (100/300) * 285 = 95 ether
        // User2 share: (200/300) * 285 = 190 ether
        
        vm.prank(judge);
        market.resolveMarket(marketId, 0);
        
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(marketId);
        assertEq(token.balanceOf(user1) - user1BalanceBefore, 95 ether, "User1 proportional share");
        
        uint256 user2BalanceBefore = token.balanceOf(user2);
        vm.prank(user2);
        market.claimWinnings(marketId);
        assertEq(token.balanceOf(user2) - user2BalanceBefore, 190 ether, "User2 proportional share");
    }
    
    function testOwnableInheritance() public {
        // Test that ownership functions work via Ownable
        assertEq(market.owner(), owner, "Owner should be set correctly");
        
        // Transfer ownership
        vm.prank(owner);
        market.transferOwnership(user1);
        assertEq(market.owner(), user1, "Ownership should be transferred");
        
        // Old owner cannot set fees
        vm.prank(owner);
        vm.expectRevert();
        market.setFees(100, 100);
        
        // New owner can set fees
        vm.prank(user1);
        market.setFees(100, 100);
        assertEq(market.protocolFeeRate(), 100, "New owner can update fees");
    }
    
    // ============================================
    // Market Pausing Tests
    // ============================================
    
    function testJudgeCanPauseMarket() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // Verify market is not paused initially
        PredictionMarket.Market memory marketData = market.getMarket(marketId);
        assertFalse(marketData.paused, "Market should not be paused initially");
        
        // Judge pauses the market
        vm.prank(judge);
        market.pauseMarket(marketId);
        
        // Verify market is now paused
        marketData = market.getMarket(marketId);
        assertTrue(marketData.paused, "Market should be paused after pause");
    }
    
    function testNonJudgeCannotPauseMarket() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // User1 tries to pause the market - should fail
        vm.prank(user1);
        vm.expectRevert();
        market.pauseMarket(marketId);
        
        // Creator tries to pause the market - should fail
        vm.prank(creator);
        vm.expectRevert();
        market.pauseMarket(marketId);
        
        // Owner tries to pause the market - should fail
        vm.prank(owner);
        vm.expectRevert();
        market.pauseMarket(marketId);
    }
    
    function testCannotPlacePredictionOnPausedMarket() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // User1 places prediction before pause - should succeed
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 50 ether);
        vm.stopPrank();
        
        // Judge pauses the market
        vm.prank(judge);
        market.pauseMarket(marketId);
        
        // User1 tries to place another prediction - should fail
        vm.prank(user1);
        vm.expectRevert();
        market.placePrediction(marketId, 0, 50 ether);
        
        // User2 tries to place prediction - should fail
        vm.startPrank(user2);
        token.approve(address(market), 100 ether);
        vm.expectRevert();
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
    }
    
    function testPausedMarketCanStillBeResolved() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // User1 places prediction
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // Judge pauses the market
        vm.prank(judge);
        market.pauseMarket(marketId);
        
        // Judge resolves the paused market - should succeed
        vm.prank(judge);
        market.resolveMarket(marketId, 0);
        
        // Verify market is resolved
        PredictionMarket.Market memory marketData = market.getMarket(marketId);
        assertTrue(marketData.resolved, "Market should be resolved");
        assertTrue(marketData.paused, "Market should still show as paused");
    }
    
    function testCannotPauseAlreadyResolvedMarket() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // User1 places prediction
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // Judge resolves the market
        vm.prank(judge);
        market.resolveMarket(marketId, 0);
        
        // Try to pause already resolved market - should fail
        vm.prank(judge);
        vm.expectRevert();
        market.pauseMarket(marketId);
    }
    
    function testCannotPauseAlreadyPausedMarket() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Test?", judge, outcomes);
        vm.stopPrank();
        
        // Judge pauses the market
        vm.prank(judge);
        market.pauseMarket(marketId);
        
        // Try to pause again - should fail
        vm.prank(judge);
        vm.expectRevert();
        market.pauseMarket(marketId);
    }
    
    function testFrontrunningPreventionScenario() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        uint256 marketId = market.createMarket("Will it happen?", judge, outcomes);
        vm.stopPrank();
        
        // User1 places 100 tokens on outcome 0
        vm.startPrank(user1);
        token.approve(address(market), 100 ether);
        market.placePrediction(marketId, 0, 100 ether);
        vm.stopPrank();
        
        // User2 places 50 tokens on outcome 1
        vm.startPrank(user2);
        token.approve(address(market), 50 ether);
        market.placePrediction(marketId, 1, 50 ether);
        vm.stopPrank();
        
        // Total pool: 150 ether
        // Outcome 0 pool: 100 ether
        // Outcome 1 pool: 50 ether
        
        // Judge decides outcome 1 will win and pauses the market first
        vm.prank(judge);
        market.pauseMarket(marketId);
        
        // User1 tries to frontrun by placing more on outcome 1 - should fail
        vm.startPrank(user1);
        token.approve(address(market), 500 ether);
        vm.expectRevert();
        market.placePrediction(marketId, 1, 500 ether);
        vm.stopPrank();
        
        // Judge resolves to outcome 1
        vm.prank(judge);
        market.resolveMarket(marketId, 1);
        
        // User2 should be the only winner with their 50 tokens
        // Total: 150, Protocol fee: 3 (2%), Creator fee: 4.5 (3%), Pool after fees: 142.5
        // User2 gets all of it since they're the only one on outcome 1
        uint256 user2BalanceBefore = token.balanceOf(user2);
        vm.prank(user2);
        market.claimWinnings(marketId);
        uint256 user2Received = token.balanceOf(user2) - user2BalanceBefore;
        
        assertEq(user2Received, 142.5 ether, "User2 should receive entire pool after fees");
        
        // User1 should have no winnings on outcome 1
        vm.prank(user1);
        vm.expectRevert();
        market.claimWinnings(marketId);
    }
}

