// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./interfaces/IERC20.sol";
import "./interfaces/IFanMerchMarketplace.sol";

/**
 * @title FanMerchMarketplace
 * @dev Marketplace pour acheter des produits de merchandising avec CHZ natif ou Fan Tokens
 */
contract FanMerchMarketplace is IFanMerchMarketplace {



    // ============ VARIABLES D'ÉTAT ============
    
    address public owner;
    
    uint256 public nextProductId;
    uint256 public totalPurchases;
    
    // Mappings
    mapping(uint256 => Product) public products;
    mapping(uint256 => Purchase) public purchases;
    mapping(address => bool) public authorizedFanTokens;
    mapping(address => uint256[]) public userPurchases;

    // ============ MODIFIEURS ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "FanMerch: Not the owner");
        _;
    }
    
    modifier validProduct(uint256 _productId) {
        require(_productId < nextProductId, "FanMerch: Product does not exist");
        require(products[_productId].active, "FanMerch: Product is not active");
        _;
    }
    
    modifier validQuantity(uint256 _quantity) {
        require(_quantity > 0, "FanMerch: Quantity must be greater than 0");
        _;
    }

    // ============ CONSTRUCTEUR ============
    
    constructor() {
        owner = msg.sender;
        nextProductId = 1;
    }

    // ============ FONCTIONS PRINCIPALES ============
    
    /**
     * @dev Ajouter un nouveau produit au marketplace
     * @param _name Nom du produit
     * @param _category Catégorie du produit
     * @param _priceInCHZ Prix en CHZ natif (en wei, 18 décimales)
     * @param _priceInFanToken Prix en Fan Token (en unités entières)
     * @param _fanTokenAddress Adresse du fan token accepté
     * @param _metadataURI URI des métadonnées
     * @param _minFanTokenBalance Minimum de fan tokens requis pour accéder (0 = pas de limite)
     */
    function addProduct(
        string memory _name,
        string memory _category,
        uint256 _priceInCHZ,
        uint256 _priceInFanToken,
        address _fanTokenAddress,
        string memory _metadataURI,
        uint256 _minFanTokenBalance
    ) external onlyOwner {
        require(bytes(_name).length > 0, "FanMerch: Name cannot be empty");
        require(_priceInCHZ > 0, "FanMerch: CHZ price must be greater than 0");
        require(_priceInFanToken > 0, "FanMerch: Fan token price must be greater than 0");
        require(_fanTokenAddress != address(0), "FanMerch: Invalid fan token address");
        
        // Autoriser le fan token s'il ne l'est pas déjà
        if (!authorizedFanTokens[_fanTokenAddress]) {
            authorizedFanTokens[_fanTokenAddress] = true;
        }
        
        products[nextProductId] = Product({
            id: nextProductId,
            name: _name,
            category: _category,
            priceInCHZ: _priceInCHZ,
            priceInFanToken: _priceInFanToken,
            fanTokenAddress: _fanTokenAddress,
            active: true,
            metadataURI: _metadataURI,
            accessConditions: AccessConditions({
                minFanTokenBalance: _minFanTokenBalance
            })
        });
        
        emit ProductAdded(nextProductId, _name, _priceInCHZ, _priceInFanToken, _fanTokenAddress);
        emit ProductAccessUpdated(nextProductId, _minFanTokenBalance);
        nextProductId++;
    }
    
    /**
     * @dev Définir les conditions d'accès pour un produit
     * @param _productId ID du produit
     * @param _minFanTokenBalance Minimum de fan tokens requis
     */
    function setProductAccessConditions(
        uint256 _productId,
        uint256 _minFanTokenBalance
    ) external onlyOwner {
        require(_productId < nextProductId, "FanMerch: Product does not exist");
        
        products[_productId].accessConditions = AccessConditions({
            minFanTokenBalance: _minFanTokenBalance
        });
        
        emit ProductAccessUpdated(_productId, _minFanTokenBalance);
    }

    /**
     * @dev Vérifier si un utilisateur peut acheter un produit
     * @param _user Adresse de l'utilisateur
     * @param _productId ID du produit
     * @return canBuy True si l'utilisateur peut acheter, false sinon
     * @return reason Raison en cas d'impossibilité d'achat
     */
    function canUserBuyProduct(address _user, uint256 _productId) 
        external 
        view 
        returns (bool canBuy, string memory reason) 
    {
        require(_productId < nextProductId, "FanMerch: Product does not exist");
        
        Product memory product = products[_productId];
        
        // Vérifier si le produit est actif
        if (!product.active) {
            return (false, "Product is not active");
        }
        
        // Si pas de minimum requis, tout le monde peut acheter
        if (product.accessConditions.minFanTokenBalance == 0) {
            return (true, "");
        }
        
        IERC20 fanToken = IERC20(product.fanTokenAddress);
        uint256 userBalance = fanToken.balanceOf(_user);
        
        // Vérifier le minimum de fan tokens
        if (userBalance < product.accessConditions.minFanTokenBalance) {
            return (false, "Insufficient fan token balance");
        }
        
        return (true, "");
    }

    /**
     * @dev Vérifier les conditions d'accès avant l'achat
     */
    modifier hasAccess(uint256 _productId) {
        (bool canBuy, string memory reason) = this.canUserBuyProduct(msg.sender, _productId);
        require(canBuy, reason);
        _;
    }
    
    /**
     * @dev Acheter un produit avec CHZ natif
     * @param _productId ID du produit
     * @param _quantity Quantité à acheter
     */
    function buyWithCHZ(uint256 _productId, uint256 _quantity) 
        external 
        payable
        validProduct(_productId) 
        validQuantity(_quantity) 
        hasAccess(_productId)
    {
        Product memory product = products[_productId];
        uint256 totalPrice = product.priceInCHZ * _quantity;
        
        // Vérifier que l'utilisateur a envoyé suffisamment de CHZ
        require(msg.value >= totalPrice, "FanMerch: Insufficient CHZ sent");
        
        // Rembourser l'excédent s'il y en a
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        // Enregistrer l'achat (address(0) pour CHZ natif)
        _recordPurchase(_productId, _quantity, address(0), totalPrice);
        
        emit ProductPurchased(msg.sender, _productId, _quantity, address(0), totalPrice, block.timestamp);
    }
    
    /**
     * @dev Acheter un produit avec un Fan Token
     * @param _productId ID du produit
     * @param _quantity Quantité à acheter
     */
    function buyWithFanToken(uint256 _productId, uint256 _quantity) 
        external 
        validProduct(_productId) 
        validQuantity(_quantity) 
        hasAccess(_productId)
    {
        Product memory product = products[_productId];
        address fanTokenAddress = product.fanTokenAddress;
        uint256 totalPrice = product.priceInFanToken * _quantity;
        
        require(authorizedFanTokens[fanTokenAddress], "FanMerch: Fan token not authorized");
        
        // Vérifier que l'utilisateur a suffisamment de Fan Tokens
        IERC20 fanToken = IERC20(fanTokenAddress);
        require(fanToken.balanceOf(msg.sender) >= totalPrice, "FanMerch: Insufficient fan token balance");
        require(fanToken.allowance(msg.sender, address(this)) >= totalPrice, "FanMerch: Insufficient fan token allowance");
        
        // Transférer les Fan Tokens vers le contrat
        require(fanToken.transferFrom(msg.sender, address(this), totalPrice), "FanMerch: Fan token transfer failed");
        
        // Enregistrer l'achat
        _recordPurchase(_productId, _quantity, fanTokenAddress, totalPrice);
        
        emit ProductPurchased(msg.sender, _productId, _quantity, fanTokenAddress, totalPrice, block.timestamp);
    }

    // ============ FONCTIONS INTERNES ============
    
    /**
     * @dev Enregistrer un achat
     */
    function _recordPurchase(uint256 _productId, uint256 _quantity, address _paymentToken, uint256 _totalPrice) internal {
        purchases[totalPurchases] = Purchase({
            productId: _productId,
            quantity: _quantity,
            buyer: msg.sender,
            paymentToken: _paymentToken,
            totalPrice: _totalPrice,
            timestamp: block.timestamp
        });
        
        userPurchases[msg.sender].push(totalPurchases);
        totalPurchases++;
    }

    // ============ FONCTIONS DE LECTURE ============
    
    /**
     * @dev Obtenir les informations d'un produit
     */
    function getProduct(uint256 _productId) external view returns (Product memory) {
        require(_productId < nextProductId, "FanMerch: Product does not exist");
        return products[_productId];
    }
    
    /**
     * @dev Obtenir tous les achats d'un utilisateur
     */
    function getUserPurchases(address _user) external view returns (uint256[] memory) {
        return userPurchases[_user];
    }
    
    /**
     * @dev Obtenir les détails d'un achat
     */
    function getPurchase(uint256 _purchaseId) external view returns (Purchase memory) {
        require(_purchaseId < totalPurchases, "FanMerch: Purchase does not exist");
        return purchases[_purchaseId];
    }

    /**
     * @dev Obtenir tous les produits actifs (optimisé pour le frontend)
     */
    function getAllActiveProducts() external view returns (Product[] memory) {
        uint256 activeCount = 0;
        
        // Compter les produits actifs
        for (uint256 i = 1; i < nextProductId; i++) {
            if (products[i].active) {
                activeCount++;
            }
        }
        
        // Créer un tableau avec les produits actifs
        Product[] memory activeProducts = new Product[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i < nextProductId; i++) {
            if (products[i].active) {
                activeProducts[currentIndex] = products[i];
                currentIndex++;
            }
        }
        
        return activeProducts;
    }

    /**
     * @dev Obtenir les produits par catégorie
     */
    function getProductsByCategory(string memory _category) external view returns (Product[] memory) {
        uint256 categoryCount = 0;
        
        // Compter les produits de la catégorie
        for (uint256 i = 1; i < nextProductId; i++) {
            if (products[i].active && 
                keccak256(abi.encodePacked(products[i].category)) == keccak256(abi.encodePacked(_category))) {
                categoryCount++;
            }
        }
        
        // Créer un tableau avec les produits de la catégorie
        Product[] memory categoryProducts = new Product[](categoryCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i < nextProductId; i++) {
            if (products[i].active && 
                keccak256(abi.encodePacked(products[i].category)) == keccak256(abi.encodePacked(_category))) {
                categoryProducts[currentIndex] = products[i];
                currentIndex++;
            }
        }
        
        return categoryProducts;
    }







    /**
     * @dev Obtenir les statistiques du marketplace
     */
    function getMarketplaceStats() external view returns (
        uint256 totalProducts,
        uint256 totalSales,
        uint256 totalRevenueCHZ,
        uint256 totalRevenueFanTokens
    ) {
        totalProducts = nextProductId - 1;
        totalSales = totalPurchases;
        
        for (uint256 i = 0; i < totalPurchases; i++) {
            Purchase memory purchase = purchases[i];
            if (purchase.paymentToken == address(0)) {
                totalRevenueCHZ += purchase.totalPrice;
            } else {
                totalRevenueFanTokens += purchase.totalPrice;
            }
        }
    }

    /**
     * @dev Vérifier si un produit est actif
     */
    function isProductActive(uint256 _productId) external view returns (bool) {
        if (_productId >= nextProductId) {
            return false;
        }
        return products[_productId].active;
    }

    // ============ FONCTIONS D'ADMINISTRATION ============
    
    /**
     * @dev Activer/désactiver un produit
     */
    function toggleProductStatus(uint256 _productId) external onlyOwner {
        require(_productId < nextProductId, "FanMerch: Product does not exist");
        products[_productId].active = !products[_productId].active;
    }
    
    /**
     * @dev Autoriser un nouveau fan token
     */
    function authorizeFanToken(address _fanTokenAddress) external onlyOwner {
        require(_fanTokenAddress != address(0), "FanMerch: Invalid fan token address");
        authorizedFanTokens[_fanTokenAddress] = true;
    }
    
    /**
     * @dev Retirer les fonds CHZ
     */
    function withdrawCHZ(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "FanMerch: Insufficient CHZ balance");
        
        if (_amount == 0) {
            _amount = address(this).balance;
        }
        
        payable(owner).transfer(_amount);
        emit FundsWithdrawn(address(0), _amount, owner);
    }
    
    /**
     * @dev Retirer les fan tokens
     */
    function withdrawFanTokens(address _fanTokenAddress, uint256 _amount) external onlyOwner {
        require(_fanTokenAddress != address(0), "FanMerch: Invalid fan token address");
        require(authorizedFanTokens[_fanTokenAddress], "FanMerch: Fan token not authorized");
        
        IERC20 fanToken = IERC20(_fanTokenAddress);
        uint256 balance = fanToken.balanceOf(address(this));
        
        if (_amount == 0) {
            _amount = balance;
        }
        
        require(_amount <= balance, "FanMerch: Insufficient fan token balance");
        require(fanToken.transfer(owner, _amount), "FanMerch: Fan token transfer failed");
        
        emit FundsWithdrawn(_fanTokenAddress, _amount, owner);
    }
    
    /**
     * @dev Transférer la propriété du contrat
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "FanMerch: Invalid new owner address");
        owner = _newOwner;
    }
} 