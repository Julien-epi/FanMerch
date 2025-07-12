// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {FanMerchMarketplace} from "../src/FanMerchMarketplace.sol";
import {PSGFanTokenMock} from "../src/PSGFanToken.sol";

contract FanMerchMarketplaceTest is Test {
    FanMerchMarketplace public marketplace;
    PSGFanTokenMock public psgFanToken;
    
    address public owner;
    address public user1;
    address public user2;
    
    // Constantes pour les tests
    uint256 constant MAILLOT_PRICE_CHZ = 75 * 10**18;      // 75 CHZ
    uint256 constant MAILLOT_PRICE_PSG = 85;               // 85 PSG (sans décimales)
    
    uint256 constant ECHARPE_PRICE_CHZ = 35 * 10**18;      // 35 CHZ
    uint256 constant ECHARPE_PRICE_PSG = 40;               // 40 PSG
    
    function setUp() public {
        // Créer les adresses de test
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Déployer les tokens
        psgFanToken = new PSGFanTokenMock();
        
        // Déployer le marketplace
        marketplace = new FanMerchMarketplace();
        
        // Distribuer des tokens aux utilisateurs de test
        _setupUserBalances();
        
        // Ajouter des produits de test
        _setupTestProducts();
    }
    
    function _setupUserBalances() internal {
        // Donner des CHZ natifs aux utilisateurs (fait dans les tests individuels)
        // vm.deal() est utilisé dans chaque test selon les besoins
        
        // Donner des PSG tokens aux utilisateurs  
        psgFanToken.mint(user1, 5000); // 5,000 PSG
        psgFanToken.mint(user2, 2000); // 2,000 PSG
    }
    
    function _setupTestProducts() internal {
        // Produit 1: Maillot PSG (accessible à tous)
        marketplace.addProduct(
            "Maillot PSG Domicile 2024/25",
            "Maillots",
            MAILLOT_PRICE_CHZ,
            MAILLOT_PRICE_PSG,
            address(psgFanToken),
            "https://ipfs.io/ipfs/QmPSGjersey2024",
            0          // Minimum fan tokens requis (0 = pas de limite)
        );
        
        // Produit 2: Écharpe PSG (accessible à tous)
        marketplace.addProduct(
            "PSG Official Scarf", 
            "Accessories",
            ECHARPE_PRICE_CHZ,
            ECHARPE_PRICE_PSG,
            address(psgFanToken),
            "https://ipfs.io/ipfs/QmPSGscarf2024",
            0          // Minimum fan tokens requis (0 = pas de limite)
        );
    }

    // ============ TESTS DE DÉPLOIEMENT ============
    
    function test_DeploymentSuccess() public {
        assertEq(marketplace.owner(), owner);
        assertEq(marketplace.nextProductId(), 3); // 2 produits + 1
        assertEq(marketplace.totalPurchases(), 0);
    }
    
    function test_PSGTokenDeployment() public {
        assertEq(psgFanToken.name(), "Paris Saint-Germain Fan Token");
        assertEq(psgFanToken.symbol(), "PSG");
        assertEq(psgFanToken.decimals(), 0);
        assertEq(psgFanToken.totalSupply(), 107000); // 100k initial + 7k distribués dans setup
    }

    // ============ TESTS D'ACHAT AVEC CHZ ============
    
    function test_BuyMaillotWithCHZ() public {
        uint256 quantity = 1;
        uint256 expectedPrice = MAILLOT_PRICE_CHZ * quantity;
        
        // Donner des CHZ natifs à user1
        vm.deal(user1, 10000 * 10**18);
        
        vm.prank(user1);
        marketplace.buyWithCHZ{value: expectedPrice}(1, quantity);
        
        // Vérifier l'achat
        assertEq(marketplace.totalPurchases(), 1);
        
        FanMerchMarketplace.Purchase memory purchase = marketplace.getPurchase(0);
        assertEq(purchase.productId, 1);
        assertEq(purchase.quantity, quantity);
        assertEq(purchase.buyer, user1);
        assertEq(purchase.paymentToken, address(0)); // CHZ natif
        assertEq(purchase.totalPrice, expectedPrice);
        
        // Vérifier les balances CHZ natifs
        assertEq(address(marketplace).balance, expectedPrice);
    }
    
    function test_BuyEcharpeWithCHZ() public {
        uint256 quantity = 2;
        uint256 expectedPrice = ECHARPE_PRICE_CHZ * quantity;
        
        // Donner des CHZ natifs à user1
        vm.deal(user1, 10000 * 10**18);
        
        vm.prank(user1);
        marketplace.buyWithCHZ{value: expectedPrice}(2, quantity);
        
        assertEq(marketplace.totalPurchases(), 1);
        assertEq(address(marketplace).balance, expectedPrice);
    }

    // ============ TESTS D'ACHAT AVEC PSG TOKENS ============
    
    function test_BuyMaillotWithPSG() public {
        uint256 quantity = 1;
        uint256 expectedPrice = MAILLOT_PRICE_PSG * quantity; // 85 PSG
        
        vm.prank(user1);
        psgFanToken.approve(address(marketplace), expectedPrice);
        
        vm.prank(user1);
        marketplace.buyWithFanToken(1, quantity);
        
        // Vérifier l'achat
        assertEq(marketplace.totalPurchases(), 1);
        
        FanMerchMarketplace.Purchase memory purchase = marketplace.getPurchase(0);
        assertEq(purchase.productId, 1);
        assertEq(purchase.quantity, quantity);
        assertEq(purchase.buyer, user1);
        assertEq(purchase.paymentToken, address(psgFanToken));
        assertEq(purchase.totalPrice, expectedPrice);
        
        // Vérifier les balances PSG (sans décimales)
        assertEq(psgFanToken.balanceOf(address(marketplace)), expectedPrice);
        assertEq(psgFanToken.balanceOf(user1), 5000 - expectedPrice);
    }
    
    function test_BuyEcharpeWithPSG() public {
        uint256 quantity = 3;
        uint256 expectedPrice = ECHARPE_PRICE_PSG * quantity; // 120 PSG
        
        vm.prank(user1);
        psgFanToken.approve(address(marketplace), expectedPrice);
        
        vm.prank(user1);
        marketplace.buyWithFanToken(2, quantity);
        
        assertEq(marketplace.totalPurchases(), 1);
        assertEq(psgFanToken.balanceOf(address(marketplace)), expectedPrice);
        assertEq(psgFanToken.balanceOf(user1), 5000 - expectedPrice);
    }

    // ============ TESTS D'ERREURS ============
    
    function test_RevertBuyWithCHZ_InsufficientValue() public {
        // user2 envoie moins de CHZ que le prix requis
        uint256 quantity = 1; // 1 * 75 = 75 CHZ requis
        uint256 expectedPrice = MAILLOT_PRICE_CHZ * quantity;
        uint256 insufficientValue = expectedPrice / 2; // Envoie seulement la moitié
        
        // Donner assez de CHZ à user2 pour pouvoir envoyer la transaction
        vm.deal(user2, 1000 * 10**18);
        
        // La transaction doit échouer car user2 envoie moins que le prix requis
        vm.prank(user2);
        vm.expectRevert("FanMerch: Insufficient CHZ sent");
        marketplace.buyWithCHZ{value: insufficientValue}(1, quantity);
    }
    
    function test_RevertBuyWithPSG_InsufficientBalance() public {
        // user2 n'a que 2000 PSG, essaie d'acheter pour 2550 PSG
        uint256 quantity = 30; // 30 * 85 = 2550 PSG
        uint256 expectedPrice = MAILLOT_PRICE_PSG * quantity;
        
        vm.prank(user2);
        psgFanToken.approve(address(marketplace), expectedPrice);
        
        vm.prank(user2);
        vm.expectRevert();
        marketplace.buyWithFanToken(1, quantity);
    }
    
    function test_RevertBuyWithCHZ_InsufficientBalance() public {
        // Tester avec un produit qui nécessite des fan tokens pour l'accès
        // D'abord, créer un produit VIP qui nécessite 5000 PSG
        marketplace.addProduct(
            "Jersey VIP", 
            "Jerseys",
            100 * 10**18, // 100 CHZ
            50,           // 50 PSG
            address(psgFanToken),
            "https://ipfs.io/ipfs/QmVIP",
            5000          // Minimum 5000 fan tokens requis
        );
        
        // user2 n'a que 2000 PSG, pas assez pour le produit VIP (5000 requis)
        vm.deal(user2, 1000 * 10**18); // Donner assez de CHZ
        
        vm.prank(user2);
        vm.expectRevert("Insufficient fan token balance");
        marketplace.buyWithCHZ{value: 100 * 10**18}(3, 1);
    }
    
    function test_RevertBuyWithPSG_NoApproval() public {
        vm.prank(user1);
        vm.expectRevert();
        marketplace.buyWithFanToken(1, 1);
    }

    // ============ TESTS DES FONCTIONS ADMINISTRATIVES ============
    
    function test_AddProduct() public {
        marketplace.addProduct(
            "Casquette PSG Limited",
            "Accessoires",
            25 * 10**18, // 25 CHZ
            28,          // 28 PSG
            address(psgFanToken),
            "https://ipfs.io/ipfs/QmPSGcap2024",
            0            // Minimum fan tokens requis (0 = pas de limite)
        );
        
        FanMerchMarketplace.Product memory product = marketplace.getProduct(3);
        assertEq(product.name, "Casquette PSG Limited");
        assertEq(product.category, "Accessoires");
        assertEq(product.priceInCHZ, 25 * 10**18);
        assertEq(product.priceInFanToken, 28);
        assertEq(product.fanTokenAddress, address(psgFanToken));
        assertTrue(product.active);
    }
    
    function test_WithdrawCHZFunds() public {
        // Effectuer un achat pour avoir des fonds CHZ natifs
        vm.deal(user1, 10000 * 10**18);
        vm.prank(user1);
        marketplace.buyWithCHZ{value: MAILLOT_PRICE_CHZ}(1, 1);
        
        // Vérifier que le contrat a bien reçu les fonds
        assertEq(address(marketplace).balance, MAILLOT_PRICE_CHZ);
        
        // Retirer les fonds CHZ natifs (owner est address(this))
        uint256 balanceBefore = address(this).balance;
        marketplace.withdrawCHZ(MAILLOT_PRICE_CHZ);
        
        assertEq(address(this).balance, balanceBefore + MAILLOT_PRICE_CHZ);
        assertEq(address(marketplace).balance, 0);
    }
    
    // Fonction pour recevoir des CHZ natifs dans le contrat de test
    receive() external payable {}
    
    function test_WithdrawPSGFunds() public {
        // Effectuer un achat pour avoir des fonds PSG
        vm.prank(user1);
        psgFanToken.approve(address(marketplace), MAILLOT_PRICE_PSG);
        vm.prank(user1);
        marketplace.buyWithFanToken(1, 1);
        
        // Retirer les fonds PSG
        uint256 balanceBefore = psgFanToken.balanceOf(owner);
        marketplace.withdrawFanTokens(address(psgFanToken), MAILLOT_PRICE_PSG);
        
        assertEq(psgFanToken.balanceOf(owner), balanceBefore + MAILLOT_PRICE_PSG);
        assertEq(psgFanToken.balanceOf(address(marketplace)), 0);
    }

    // ============ TESTS DE LECTURE ============
    
    function test_GetProduct() public {
        FanMerchMarketplace.Product memory product = marketplace.getProduct(1);
        assertEq(product.name, "Maillot PSG Domicile 2024/25");
        assertEq(product.category, "Maillots");
        assertEq(product.priceInCHZ, MAILLOT_PRICE_CHZ);
        assertEq(product.priceInFanToken, MAILLOT_PRICE_PSG);
        assertEq(product.fanTokenAddress, address(psgFanToken));
    }
    
    function test_GetUserPurchases() public {
        // Effectuer deux achats
        vm.deal(user1, 10000 * 10**18);
        vm.startPrank(user1);
        marketplace.buyWithCHZ{value: MAILLOT_PRICE_CHZ}(1, 1);
        
        psgFanToken.approve(address(marketplace), ECHARPE_PRICE_PSG);
        marketplace.buyWithFanToken(2, 1);
        vm.stopPrank();
        
        uint256[] memory purchases = marketplace.getUserPurchases(user1);
        assertEq(purchases.length, 2);
        assertEq(purchases[0], 0);
        assertEq(purchases[1], 1);
    }

    // ============ TEST DE SCENARIO COMPLET ============
    
    function test_CompleteScenario() public {
        console.log("=== Complete scenario test ===");
        
        // 1. Check initial balances
        vm.deal(user1, 10000 * 10**18);
        console.log("CHZ balance user1:", user1.balance / 10**18, "CHZ");
        console.log("PSG balance user1:", psgFanToken.balanceOf(user1), "PSG");
        
        // 2. Buy jersey with CHZ natif
        vm.prank(user1);
        marketplace.buyWithCHZ{value: MAILLOT_PRICE_CHZ}(1, 1);
        console.log("Jersey purchase with CHZ successful");
        
        // 3. Buy scarf with PSG
        vm.prank(user1);
        psgFanToken.approve(address(marketplace), ECHARPE_PRICE_PSG);
        vm.prank(user1);
        marketplace.buyWithFanToken(2, 1);
        console.log("Scarf purchase with PSG successful");
        
        // 4. Check final balances
        console.log("CHZ balance user1:", user1.balance / 10**18, "CHZ");
        console.log("PSG balance user1:", psgFanToken.balanceOf(user1), "PSG");
        
        // 5. Check purchases
        assertEq(marketplace.totalPurchases(), 2);
        console.log("Total purchases:", marketplace.totalPurchases());
        
        console.log("=== Test completed successfully ===");
    }
} 