// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IERC20
 * @dev Interface standard pour les tokens ERC20 (CHZ et Fan Tokens)
 */
interface IERC20 {
    /**
     * @dev Retourne le nombre total de tokens en circulation
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Retourne le solde d'un compte
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Transfère des tokens vers un destinataire
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Retourne l'allocation restante entre owner et spender
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Approuve un spender à dépenser des tokens
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Transfère des tokens depuis un compte via allowance
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    /**
     * @dev Retourne le nombre de décimales du token
     */
    function decimals() external view returns (uint8);

    /**
     * @dev Retourne le nom du token
     */
    function name() external view returns (string memory);

    /**
     * @dev Retourne le symbole du token
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Émis lors d'un transfert
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Émis lors d'une approbation
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
} 