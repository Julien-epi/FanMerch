// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./interfaces/IERC20.sol";

/**
 * @title PSGFanTokenMock
 * @dev Fan Token officiel du PSG sans décimales (comme les vrais fan tokens Chiliz)
 * Supply initial: 100,000 PSG tokens
 */
contract PSGFanTokenMock is IERC20 {
    string public constant name = "Paris Saint-Germain Fan Token";
    string public constant symbol = "PSG";
    uint8 public constant decimals = 0;
    uint256 public totalSupply;
    
    // Métadonnées étendues pour une meilleure reconnaissance
    string public constant version = "1.0.0";
    string public constant description = "Official PSG Fan Token Mock for testing marketplace";
    string public constant website = "https://psg.fr";
    string public constant logo = "https://logos.covalenthq.com/tokens/137/0x4a5c681d95e7b09ce67bd5b50e8c04b0d6d6d8e7.png";
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    address public owner;
    
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "PSG: Not the owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Supply initial de 100,000 PSG tokens (sans décimales)
        uint256 initialSupply = 100000;
        _mint(msg.sender, initialSupply);
        
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address ownerAddr, address spender) public view override returns (uint256) {
        return _allowances[ownerAddr][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "PSG: Transfer amount exceeds allowance");
        
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        
        return true;
    }
    
    // Fonction pour augmenter l'allowance (évite les race conditions)
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender] + addedValue);
        return true;
    }
    
    // Fonction pour diminuer l'allowance
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        uint256 currentAllowance = _allowances[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "PSG: Decreased allowance below zero");
        _approve(msg.sender, spender, currentAllowance - subtractedValue);
        return true;
    }
    
    // Fonctions administratives
    
    /**
     * @dev Mint des tokens PSG supplémentaires (réservé au owner)
     * @param to Adresse qui recevra les tokens
     * @param amount Nombre de tokens à mint (en unités entières)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Brûler des tokens PSG (réservé au owner)
     * @param from Adresse depuis laquelle brûler
     * @param amount Nombre de tokens à brûler
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
    
    /**
     * @dev Transférer la propriété du contrat
     * @param newOwner Nouvelle adresse propriétaire
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PSG: New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    /**
     * @dev Renoncer à la propriété du contrat
     */
    function renounceOwnership() external onlyOwner {
        address oldOwner = owner;
        owner = address(0);
        emit OwnershipTransferred(oldOwner, address(0));
    }
    
    // Fonctions internes
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "PSG: Transfer from zero address");
        require(to != address(0), "PSG: Transfer to zero address");
        require(_balances[from] >= amount, "PSG: Transfer amount exceeds balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        
        emit Transfer(from, to, amount);
    }
    
    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "PSG: Mint to zero address");
        require(amount > 0, "PSG: Mint amount must be positive");
        
        totalSupply += amount;
        _balances[to] += amount;
        
        emit Transfer(address(0), to, amount);
        emit Mint(to, amount);
    }
    
    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "PSG: Burn from zero address");
        require(_balances[from] >= amount, "PSG: Burn amount exceeds balance");
        require(amount > 0, "PSG: Burn amount must be positive");
        
        _balances[from] -= amount;
        totalSupply -= amount;
        
        emit Transfer(from, address(0), amount);
        emit Burn(from, amount);
    }
    
    function _approve(address ownerAddr, address spender, uint256 amount) internal {
        require(ownerAddr != address(0), "PSG: Approve from zero address");
        require(spender != address(0), "PSG: Approve to zero address");
        
        _allowances[ownerAddr][spender] = amount;
        emit Approval(ownerAddr, spender, amount);
    }
    
    // Fonctions de vue supplémentaires
    
    /**
     * @dev Retourne les informations complètes du token
     */
    function tokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        address tokenOwner,
        string memory tokenVersion,
        string memory tokenDescription
    ) {
        return (name, symbol, decimals, totalSupply, owner, version, description);
    }
    
    /**
     * @dev Retourne les métadonnées étendues
     */
    function tokenMetadata() external view returns (
        string memory tokenWebsite,
        string memory tokenLogo,
        string memory tokenDescription,
        string memory tokenVersion
    ) {
        return (website, logo, description, version);
    }
    
    /**
     * @dev Vérifier si une adresse peut transférer un montant donné
     * @param account Adresse à vérifier
     * @param amount Montant à vérifier
     */
    function canTransfer(address account, uint256 amount) external view returns (bool) {
        return _balances[account] >= amount;
    }
    
    /**
     * @dev Vérifier si le contrat supporte une interface (ERC165)
     * @param interfaceId Interface ID à vérifier
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC20).interfaceId ||
               interfaceId == 0x01ffc9a7; // ERC165 interface ID
    }
} 