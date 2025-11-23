// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Vamos.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Simple ERC20 token for demo purposes
 */
contract MockERC20 is ERC20 {
    constructor() ERC20("Demo Token", "DEMO") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title DeployAndDemoLifecycle
 * @notice Comprehensive deployment script that demonstrates the full lifecycle of Vamos:
 * - Deploy token and Vamos contract
 * - Create multiple markets with different configurations
 * - Place predictions from multiple users
 * - Pause a market (frontrunning prevention)
 * - Resolve markets (normal winner, multiple winners, no winners)
 * - Claim winnings and refunds
 */
contract DeployAndDemoLifecycle is Script {
    // Contracts
    Vamos public vamos;
    MockERC20 public token;
    
    // Actors
    address public owner;
    address public creator1;
    address public creator2;
    address public judge1;
    address public judge2;
    address public user1;
    address public user2;
    address public user3;
    
    // Private keys for broadcasting
    uint256 public ownerPk;
    uint256 public creator1Pk;
    uint256 public creator2Pk;
    uint256 public judge1Pk;
    uint256 public judge2Pk;
    uint256 public user1Pk;
    uint256 public user2Pk;
    uint256 public user3Pk;
    
    // Fee configuration
    uint256 public constant PROTOCOL_FEE = 200; // 2%
    uint256 public constant CREATOR_FEE = 300; // 3%
    
    // Market IDs
    uint256 public weatherMarketId;
    uint256 public sportsMarketId;
    uint256 public cryptoMarketId;
    
    function run() external {
        // Setup actors from environment or use default addresses
        setupActors();
        
        // Start broadcasting transactions
        vm.startBroadcast(ownerPk);
        
        console.log("=== VAMOS LIFECYCLE DEMO ===");
        console.log("");
        
        // Step 1: Deploy contracts
        deployContracts();
        
        // Step 2: Mint tokens to users
        mintTokensToUsers();
        
        vm.stopBroadcast();
        
        // Step 3: Create markets
        createMarkets();
        
        // Step 4: Place predictions
        placePredictions();
        
        // Step 5: Demonstrate pause functionality
        demonstratePause();
        
        // Step 6: Resolve markets
        resolveMarkets();
        
        // Step 7: Claim winnings
        claimWinnings();
        
        // Step 8: Display final summary
        displaySummary();
        
        console.log("");
        console.log("=== LIFECYCLE DEMO COMPLETE ===");
    }
    
    function setupActors() internal {
        // Use private key from environment if available, otherwise use Anvil's default accounts
        // Anvil default private keys (see: https://book.getfoundry.sh/reference/anvil/)
        ownerPk = vm.envOr("PRIVATE_KEY_OWNER", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        creator1Pk = vm.envOr("PRIVATE_KEY_CREATOR1", uint256(0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d));
        creator2Pk = vm.envOr("PRIVATE_KEY_CREATOR2", uint256(0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a));
        judge1Pk = vm.envOr("PRIVATE_KEY_JUDGE1", uint256(0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6));
        judge2Pk = vm.envOr("PRIVATE_KEY_JUDGE2", uint256(0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a));
        user1Pk = vm.envOr("PRIVATE_KEY_USER1", uint256(0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba));
        user2Pk = vm.envOr("PRIVATE_KEY_USER2", uint256(0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e));
        user3Pk = vm.envOr("PRIVATE_KEY_USER3", uint256(0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356));
        
        owner = vm.addr(ownerPk);
        creator1 = vm.addr(creator1Pk);
        creator2 = vm.addr(creator2Pk);
        judge1 = vm.addr(judge1Pk);
        judge2 = vm.addr(judge2Pk);
        user1 = vm.addr(user1Pk);
        user2 = vm.addr(user2Pk);
        user3 = vm.addr(user3Pk);
        
        console.log("Actors:");
        console.log("  Owner:", owner);
        console.log("  Creator1:", creator1);
        console.log("  Creator2:", creator2);
        console.log("  Judge1:", judge1);
        console.log("  Judge2:", judge2);
        console.log("  User1:", user1);
        console.log("  User2:", user2);
        console.log("  User3:", user3);
        console.log("");
    }
    
    function deployContracts() internal {
        console.log("Step 1: Deploying Contracts");
        console.log("----------------------------");
        
        // Deploy mock token
        token = new MockERC20();
        console.log("Mock ERC20 deployed at:", address(token));
        
        // Deploy Vamos
        vamos = new Vamos(address(token), PROTOCOL_FEE, CREATOR_FEE);
        console.log("Vamos deployed at:", address(vamos));
        console.log("Protocol Fee Rate:", PROTOCOL_FEE, "basis points (2%)");
        console.log("Creator Fee Rate:", CREATOR_FEE, "basis points (3%)");
        console.log("");
    }
    
    function mintTokensToUsers() internal {
        console.log("Step 2: Minting Tokens to Users");
        console.log("--------------------------------");
        
        uint256 amount = 10000 ether;
        token.mint(user1, amount);
        token.mint(user2, amount);
        token.mint(user3, amount);
        
        console.log("Minted", amount / 1 ether, "DEMO tokens to User1");
        console.log("Minted", amount / 1 ether, "DEMO tokens to User2");
        console.log("Minted", amount / 1 ether, "DEMO tokens to User3");
        console.log("");
    }
    
    function createMarkets() internal {
        console.log("Step 3: Creating Markets");
        console.log("------------------------");
        
        // Market 1: Simple binary weather prediction
        vm.startBroadcast(creator1Pk);
        string[] memory weatherOutcomes = new string[](2);
        weatherOutcomes[0] = "Yes - It will rain";
        weatherOutcomes[1] = "No - It won't rain";
        
        weatherMarketId = vamos.createMarket(
            "Will it rain in San Francisco tomorrow?",
            judge1,
            weatherOutcomes
        );
        console.log("Market #", weatherMarketId, ": Weather prediction created");
        console.log("  Creator:", creator1);
        console.log("  Judge:", judge1);
        vm.stopBroadcast();
        
        // Market 2: Multi-outcome sports prediction
        vm.startBroadcast(creator2Pk);
        string[] memory sportsOutcomes = new string[](3);
        sportsOutcomes[0] = "Team A wins";
        sportsOutcomes[1] = "Team B wins";
        sportsOutcomes[2] = "Draw";
        
        sportsMarketId = vamos.createMarket(
            "Who will win the championship game?",
            judge2,
            sportsOutcomes
        );
        console.log("Market #", sportsMarketId, ": Sports prediction created");
        console.log("  Creator:", creator2);
        console.log("  Judge:", judge2);
        vm.stopBroadcast();
        
        // Market 3: Crypto price prediction (will have no winners)
        vm.startBroadcast(creator1Pk);
        string[] memory cryptoOutcomes = new string[](3);
        cryptoOutcomes[0] = "Price goes up 10%+";
        cryptoOutcomes[1] = "Price stays stable (-10% to +10%)";
        cryptoOutcomes[2] = "Price goes down 10%+";
        
        cryptoMarketId = vamos.createMarket(
            "What will happen to ETH price in 7 days?",
            judge1,
            cryptoOutcomes
        );
        console.log("Market #", cryptoMarketId, ": Crypto prediction created");
        console.log("  Creator:", creator1);
        console.log("  Judge:", judge1);
        vm.stopBroadcast();
        
        console.log("");
    }
    
    function placePredictions() internal {
        console.log("Step 4: Placing Predictions");
        console.log("----------------------------");
        
        // Weather Market Predictions
        console.log("Weather Market #", weatherMarketId, "predictions:");
        
        vm.startBroadcast(user1Pk);
        token.approve(address(vamos), 1000 ether);
        vamos.placePrediction(weatherMarketId, 0, 500 ether); // User1: 500 on "Yes"
        console.log("  User1: 500 DEMO on 'Yes - It will rain'");
        vm.stopBroadcast();
        
        vm.startBroadcast(user2Pk);
        token.approve(address(vamos), 1000 ether);
        vamos.placePrediction(weatherMarketId, 1, 300 ether); // User2: 300 on "No"
        console.log("  User2: 300 DEMO on 'No - It won't rain'");
        vm.stopBroadcast();
        
        vm.startBroadcast(user3Pk);
        token.approve(address(vamos), 1000 ether);
        vamos.placePrediction(weatherMarketId, 0, 200 ether); // User3: 200 on "Yes"
        console.log("  User3: 200 DEMO on 'Yes - It will rain'");
        vm.stopBroadcast();
        
        // Sports Market Predictions
        console.log("Sports Market #", sportsMarketId, "predictions:");
        
        vm.startBroadcast(user1Pk);
        vamos.placePrediction(sportsMarketId, 0, 400 ether); // User1: 400 on "Team A"
        console.log("  User1: 400 DEMO on 'Team A wins'");
        vm.stopBroadcast();
        
        vm.startBroadcast(user2Pk);
        vamos.placePrediction(sportsMarketId, 0, 600 ether); // User2: 600 on "Team A"
        console.log("  User2: 600 DEMO on 'Team A wins'");
        vm.stopBroadcast();
        
        vm.startBroadcast(user3Pk);
        vamos.placePrediction(sportsMarketId, 1, 500 ether); // User3: 500 on "Team B"
        console.log("  User3: 500 DEMO on 'Team B wins'");
        vm.stopBroadcast();
        
        // Crypto Market Predictions (no one will predict the winning outcome)
        console.log("Crypto Market #", cryptoMarketId, "predictions:");
        
        vm.startBroadcast(user1Pk);
        vamos.placePrediction(cryptoMarketId, 0, 100 ether); // User1: 100 on "Up"
        console.log("  User1: 100 DEMO on 'Price goes up 10%+'");
        vm.stopBroadcast();
        
        vm.startBroadcast(user2Pk);
        vamos.placePrediction(cryptoMarketId, 1, 100 ether); // User2: 100 on "Stable"
        console.log("  User2: 100 DEMO on 'Price stays stable'");
        vm.stopBroadcast();
        
        console.log("");
    }
    
    function demonstratePause() internal {
        console.log("Step 5: Demonstrating Pause Functionality");
        console.log("------------------------------------------");
        
        // Judge pauses the sports market before resolution (prevents frontrunning)
        console.log("Judge pausing Sports Market #", sportsMarketId, "to prevent frontrunning...");
        
        vm.broadcast(judge2Pk);
        vamos.pauseMarket(sportsMarketId);
        
        console.log("Sports Market #", sportsMarketId, "is now PAUSED");
        
        console.log("");
    }
    
    function resolveMarkets() internal {
        console.log("Step 6: Resolving Markets");
        console.log("-------------------------");
        
        // Resolve Weather Market - Outcome 0 wins ("Yes - It will rain")
        console.log("Resolving Weather Market #", weatherMarketId, "...");
        console.log("Winning outcome: 0 (Yes - It will rain)");
        
        vm.broadcast(judge1Pk);
        vamos.resolveMarket(weatherMarketId, 0);
        
        Vamos.Market memory weather = vamos.getMarket(weatherMarketId);
        console.log("  Total pool:", weather.totalPool / 1 ether, "DEMO");
        console.log("  Pool after fees:", weather.poolAfterFees / 1 ether, "DEMO");
        console.log("  Protocol fee:", weather.protocolFeeAmount / 1 ether, "DEMO");
        console.log("  Creator fee:", weather.creatorFeeAmount / 1 ether, "DEMO");
        
        // Resolve Sports Market - Outcome 0 wins ("Team A wins")
        console.log("Resolving Sports Market #", sportsMarketId, "...");
        console.log("Winning outcome: 0 (Team A wins)");
        
        vm.broadcast(judge2Pk);
        vamos.resolveMarket(sportsMarketId, 0);
        
        Vamos.Market memory sports = vamos.getMarket(sportsMarketId);
        console.log("  Total pool:", sports.totalPool / 1 ether, "DEMO");
        console.log("  Pool after fees:", sports.poolAfterFees / 1 ether, "DEMO");
        console.log("  Protocol fee:", sports.protocolFeeAmount / 1 ether, "DEMO");
        console.log("  Creator fee:", sports.creatorFeeAmount / 1 ether, "DEMO");
        
        // Resolve Crypto Market - Outcome 2 wins (nobody predicted this - REFUND scenario)
        console.log("Resolving Crypto Market #", cryptoMarketId, "...");
        console.log("Winning outcome: 2 (Price goes down 10%+) - NO WINNERS!");
        
        vm.broadcast(judge1Pk);
        vamos.resolveMarket(cryptoMarketId, 2);
        
        Vamos.Market memory crypto = vamos.getMarket(cryptoMarketId);
        console.log("  Total pool:", crypto.totalPool / 1 ether, "DEMO");
        console.log("  No winners detected - full refund mode");
        console.log("  Pool after fees (refund amount):", crypto.poolAfterFees / 1 ether, "DEMO");
        console.log("  NO FEES TAKEN");
        
        console.log("");
    }
    
    function claimWinnings() internal {
        console.log("Step 7: Claiming Winnings and Refunds");
        console.log("--------------------------------------");
        
        // Weather Market Claims
        console.log("Weather Market #", weatherMarketId, "claims:");
        
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.broadcast(user1Pk);
        vamos.claim(weatherMarketId);
        uint256 user1Received = token.balanceOf(user1) - user1BalanceBefore;
        console.log("  User1 claimed:", user1Received / 1 ether, "DEMO");
        
        uint256 user3BalanceBefore = token.balanceOf(user3);
        vm.broadcast(user3Pk);
        vamos.claim(weatherMarketId);
        uint256 user3Received = token.balanceOf(user3) - user3BalanceBefore;
        console.log("  User3 claimed:", user3Received / 1 ether, "DEMO");
        
        // User2 has no winnings (predicted "No")
        console.log("  User2 predicted wrong outcome - no winnings");
        
        // Sports Market Claims
        console.log("Sports Market #", sportsMarketId, "claims:");
        
        user1BalanceBefore = token.balanceOf(user1);
        vm.broadcast(user1Pk);
        vamos.claim(sportsMarketId);
        user1Received = token.balanceOf(user1) - user1BalanceBefore;
        console.log("  User1 claimed:", user1Received / 1 ether, "DEMO");
        
        uint256 user2BalanceBefore = token.balanceOf(user2);
        vm.broadcast(user2Pk);
        vamos.claim(sportsMarketId);
        uint256 user2Received = token.balanceOf(user2) - user2BalanceBefore;
        console.log("  User2 claimed:", user2Received / 1 ether, "DEMO");
        
        // User3 has no winnings (predicted "Team B")
        console.log("  User3 predicted wrong outcome - no winnings");
        
        // Crypto Market Refunds
        console.log("Crypto Market #", cryptoMarketId, "refunds (no winners):");
        
        user1BalanceBefore = token.balanceOf(user1);
        vm.broadcast(user1Pk);
        vamos.claim(cryptoMarketId);
        user1Received = token.balanceOf(user1) - user1BalanceBefore;
        console.log("  User1 refunded:", user1Received / 1 ether, "DEMO");
        
        user2BalanceBefore = token.balanceOf(user2);
        vm.broadcast(user2Pk);
        vamos.claim(cryptoMarketId);
        user2Received = token.balanceOf(user2) - user2BalanceBefore;
        console.log("  User2 refunded:", user2Received / 1 ether, "DEMO");
        
        console.log("");
    }
    
    function displaySummary() internal view {
        console.log("Step 8: Final Summary");
        console.log("---------------------");
        
        console.log("Contract Balances:");
        console.log("  Vamos contract:", token.balanceOf(address(vamos)) / 1 ether, "DEMO");
        console.log("  Owner (protocol fees):", token.balanceOf(owner) / 1 ether, "DEMO");
        console.log("  Creator1 (creator fees):", token.balanceOf(creator1) / 1 ether, "DEMO");
        console.log("  Creator2 (creator fees):", token.balanceOf(creator2) / 1 ether, "DEMO");
        console.log("");
        
        console.log("User Final Balances:");
        console.log("  User1:", token.balanceOf(user1) / 1 ether, "DEMO");
        console.log("  User2:", token.balanceOf(user2) / 1 ether, "DEMO");
        console.log("  User3:", token.balanceOf(user3) / 1 ether, "DEMO");
        console.log("");
        
        console.log("Markets Summary:");
        console.log("  Total markets created:", vamos.marketCount());
        
        Vamos.Market memory weather = vamos.getMarket(weatherMarketId);
        console.log("  Market #", weatherMarketId);
        console.log("    Resolved:", weather.resolved ? "Yes" : "No");
        console.log("    Winning outcome:", weather.winningOutcome);
        
        Vamos.Market memory sports = vamos.getMarket(sportsMarketId);
        console.log("  Market #", sportsMarketId);
        console.log("    Resolved:", sports.resolved ? "Yes" : "No");
        console.log("    Winning outcome:", sports.winningOutcome);
        console.log("    Paused:", sports.paused ? "Yes" : "No");
        
        Vamos.Market memory crypto = vamos.getMarket(cryptoMarketId);
        console.log("  Market #", cryptoMarketId);
        console.log("    Resolved:", crypto.resolved ? "Yes" : "No");
        console.log("    No Winners:", crypto.noWinners ? "Yes" : "No");
    }
}

