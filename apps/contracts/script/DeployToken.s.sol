// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/PredictionToken.sol";

/**
 * @title DeployToken
 * @notice Deploy PredictionToken only
 */
contract DeployToken is Script {
    function run() external {
        string memory tokenName = vm.envOr("TOKEN_NAME", string("Vamos Token"));
        string memory tokenSymbol = vm.envOr("TOKEN_SYMBOL", string("VAMOS"));
        
        vm.startBroadcast();
        
        PredictionToken token = new PredictionToken(tokenName, tokenSymbol);
        
        console.log("Token deployed at:", address(token));
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Owner:", token.owner());
        
        vm.stopBroadcast();
    }
}

