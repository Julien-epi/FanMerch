// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IFanMerchMarketplace
 * @dev Interface pour la marketplace de merchandising avec Fan Tokens
 */
interface IFanMerchMarketplace {
    
    // ============ ÉNUMÉRATIONS ============
    
    enum TokenType {
        CHZ,
        FAN_TOKEN
    }

    // ============ STRUCTURES ============
    
    struct Product {
        uint256 id;
        string name;
        string category;
        uint256 priceInCHZ;
        uint256 priceInFanToken;
        address fanTokenAddress;
        bool active;
        string metadataURI;
        AccessConditions accessConditions;
    }
    
    struct AccessConditions {
        uint256 minFanTokenBalance;
    }
    
    struct Purchase {
        uint256 productId;
        uint256 quantity;
        address buyer;
        address paymentToken;
        uint256 totalPrice;
        uint256 timestamp;
    }

    // ============ ÉVÉNEMENTS ============
    
    event ProductPurchased(
        address indexed buyer,
        uint256 indexed productId,
        uint256 quantity,
        address paymentToken,
        uint256 totalPrice,
        uint256 timestamp
    );
    
    event ProductAdded(
        uint256 indexed productId,
        string name,
        uint256 priceInCHZ,
        uint256 priceInFanToken,
        address fanTokenAddress
    );
    
    event ProductAccessUpdated(
        uint256 indexed productId,
        uint256 minFanTokenBalance
    );
    
    event FundsWithdrawn(
        address indexed token,
        uint256 amount,
        address indexed to
    );
    
    // ============ FONCTIONS PUBLIQUES ============
    
    /**
     * @dev Ajouter un nouveau produit (admin only)
     */
    function addProduct(
        string memory _name,
        string memory _category,
        uint256 _priceInCHZ,
        uint256 _priceInFanToken,
        address _fanTokenAddress,
        string memory _metadataURI,
        uint256 _minFanTokenBalance
    ) external;

    /**
     * @dev Définir les conditions d'accès (admin only)
     */
    function setProductAccessConditions(
        uint256 _productId,
        uint256 _minFanTokenBalance
    ) external;

    /**
     * @dev Vérifier si un utilisateur peut acheter un produit
     */
    function canUserBuyProduct(address _user, uint256 _productId) 
        external 
        view 
        returns (bool canBuy, string memory reason);

    /**
     * @dev Acheter avec CHZ natif
     */
    function buyWithCHZ(uint256 _productId, uint256 _quantity) external payable;

    /**
     * @dev Acheter avec Fan Token
     */
    function buyWithFanToken(uint256 _productId, uint256 _quantity) external;

    /**
     * @dev Obtenir un produit par ID
     */
    function getProduct(uint256 _productId) external view returns (Product memory);

    /**
     * @dev Obtenir tous les produits actifs
     */
    function getAllActiveProducts() external view returns (Product[] memory);

    /**
     * @dev Obtenir les produits par catégorie
     */
    function getProductsByCategory(string memory _category) external view returns (Product[] memory);

    /**
     * @dev Obtenir les achats d'un utilisateur
     */
    function getUserPurchases(address _user) external view returns (uint256[] memory);

    /**
     * @dev Obtenir les détails d'un achat
     */
    function getPurchase(uint256 _purchaseId) external view returns (Purchase memory);

    /**
     * @dev Obtenir les statistiques du marketplace
     */
    function getMarketplaceStats() external view returns (
        uint256 totalProducts,
        uint256 totalSales,
        uint256 totalRevenueCHZ,
        uint256 totalRevenueFanTokens
    );

    /**
     * @dev Vérifier si un produit est actif
     */
    function isProductActive(uint256 _productId) external view returns (bool);

    /**
     * @dev Retirer les fonds CHZ (admin only)
     */
    function withdrawCHZ(uint256 _amount) external;

    /**
     * @dev Retirer les fan tokens (admin only)
     */
    function withdrawFanTokens(address _fanTokenAddress, uint256 _amount) external;

    /**
     * @dev Changer le propriétaire (admin only)
     */
    function transferOwnership(address _newOwner) external;

    // ============ VARIABLES PUBLIQUES ============
    
    function owner() external view returns (address);
    function nextProductId() external view returns (uint256);
    function totalPurchases() external view returns (uint256);
    function authorizedFanTokens(address) external view returns (bool);
} 