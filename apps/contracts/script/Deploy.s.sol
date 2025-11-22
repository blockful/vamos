// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Vamos.sol";

/**
 * @title Deploy
 * @notice Simple deployment script for Vamos contract
 * @dev Set TOKEN_ADDRESS, PROTOCOL_FEE_RATE, and CREATOR_FEE_RATE environment variables
 */
contract Deploy is Script {
    function run() external {
        // Get configuration from environment variables
        address predictionToken = vm.envOr("TOKEN_ADDRESS", address(0));
        uint256 protocolFeeRate = vm.envOr("PROTOCOL_FEE_RATE", uint256(200)); // Default: 2%
        uint256 creatorFeeRate = vm.envOr("CREATOR_FEE_RATE", uint256(300)); // Default: 3%
        
        require(predictionToken != address(0), "TOKEN_ADDRESS not set");
        
        vm.startBroadcast();
        
        // Deploy Vamos
        Vamos vamos = new Vamos(predictionToken, protocolFeeRate, creatorFeeRate);
        
        console.log("=== VAMOS DEPLOYMENT ===");
        console.log("Vamos deployed at:", address(vamos));
        console.log("Prediction token:", address(vamos.predictionToken()));
        console.log("Protocol fee rate:", vamos.protocolFeeRate(), "basis points");
        console.log("Creator fee rate:", vamos.creatorFeeRate(), "basis points");
        console.log("Owner:", vamos.owner());
        
        vm.stopBroadcast();
    }
}

