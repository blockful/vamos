// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/PredictionToken.sol";

/**
 * @title MintTokens
 * @notice Script to mint PredictionTokens to specified addresses
 * @dev Set TOKEN_ADDRESS, RECIPIENT, and AMOUNT environment variables
 */
contract MintTokens is Script {
    function run() external {
        // Get configuration from environment variables
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT");
        uint256 amount = vm.envUint("AMOUNT");
        
        console.log("=== MINT TOKENS ===");
        console.log("Token:", tokenAddress);
        console.log("Recipient:", recipient);
        console.log("Amount:", amount);
        
        PredictionToken token = PredictionToken(tokenAddress);
        
        vm.startBroadcast();
        
        token.mint(recipient, amount);
        
        console.log("Minted successfully!");
        console.log("New balance:", token.balanceOf(recipient));
        
        vm.stopBroadcast();
    }
}

