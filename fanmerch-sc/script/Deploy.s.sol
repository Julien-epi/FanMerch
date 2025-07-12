// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/PSGFanToken.sol";
import "../src/FanMerchMarketplace.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy PSG token
        PSGFanTokenMock psgToken = new PSGFanTokenMock();
        
        // Deploy marketplace
        FanMerchMarketplace marketplace = new FanMerchMarketplace();

        // Add one test product (accessible à tous)
        marketplace.addProduct(
            "PSG Jersey",
            "Jerseys",
            75 ether,  // 75 CHZ
            85,        // 85 PSG
            address(psgToken),
            "https://psg.fr/jersey.jpg",
            0          // Minimum fan tokens requis (0 = pas de limite)
        );

        // Add one VIP product (100+ fan tokens requis)
        marketplace.addProduct(
            "PSG Jersey VIP Edition",
            "Jerseys",
            150 ether, // 150 CHZ
            120,       // 120 PSG
            address(psgToken),
            "https://psg.fr/jersey-vip.jpg",
            100        // Minimum 100 fan tokens requis
        );

        // Add one premium product (50+ fan tokens requis)
        marketplace.addProduct(
            "PSG Sweat Premium",
            "Sweats",
            95 ether,  // 95 CHZ
            75,        // 75 PSG
            address(psgToken),
            "https://psg.fr/sweat-premium.jpg",
            50         // Minimum 50 fan tokens requis
        );
        
        // Mint tokens for testing
        psgToken.mint(msg.sender, 100000);

        vm.stopBroadcast();

        // Logs
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("PSG Token:", address(psgToken));
        console.log("Marketplace:", address(marketplace));
        console.log("You now have 200,000 PSG tokens!");
    }
} 