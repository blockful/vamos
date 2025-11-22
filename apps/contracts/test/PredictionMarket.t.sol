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
    
    address public creator = address(1);
    address public resolver = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    
    function setUp() public {
        token = new MockERC20();
        nstToken = new NonStandardToken();
        
        // Deploy market with standard token
        market = new PredictionMarket(address(token));
        
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
            resolver,
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
        PredictionMarket nstMarket = new PredictionMarket(address(nstToken));
        
        // Create market with non-standard token (doesn't return bool)
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        
        uint256 marketId = nstMarket.createMarket(
            "Will it rain tomorrow?",
            resolver,
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
            resolver,
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
        vm.prank(resolver);
        market.resolveMarket(marketId, 0);
        
        // Calculate expected winnings
        uint256 user1WinningsExpected = market.calculatePotentialWinnings(marketId, user1, 0);
        uint256 user2WinningsExpected = market.calculatePotentialWinnings(marketId, user2, 0);
        
        // User1 should get: (100 / 300) * 300 = 100 tokens
        // User2 should get: (200 / 300) * 300 = 200 tokens
        assertEq(user1WinningsExpected, 100 ether, "User1 should win 100 tokens");
        assertEq(user2WinningsExpected, 200 ether, "User2 should win 200 tokens");
        
        // Claim winnings
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(marketId);
        uint256 user1Received = token.balanceOf(user1) - user1BalanceBefore;
        
        assertEq(user1Received, 100 ether, "User1 should receive 100 tokens");
    }
    
    function testClaimWinningsFullScenario() public {
        // Create market
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        
        uint256 marketId = market.createMarket(
            "Standard token market?",
            resolver,
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
        vm.prank(resolver);
        market.resolveMarket(marketId, 0);
        
        // Claim winnings
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(marketId);
        uint256 user1Received = token.balanceOf(user1) - user1BalanceBefore;
        
        // User1 should receive exactly 150 tokens (entire pool, as only winner)
        assertEq(user1Received, 150 ether, "User1 should receive exact winnings");
        
        // Verify user2 has no winnings on the winning outcome
        assertEq(market.getUserPrediction(marketId, user2, 0), 0, "User2 should have no predictions on winning outcome");
    }
}

