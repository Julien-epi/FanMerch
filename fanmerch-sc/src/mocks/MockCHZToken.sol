// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IERC20.sol";

/**
 * @title MockCHZToken
 * @dev Mock du token CHZ avec 18 décimales pour les tests
 */
contract MockCHZToken is IERC20 {
    string public name = "Chiliz";
    string public symbol = "CHZ";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "MockCHZ: Not the owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        // Mint initial supply (1M CHZ)
        uint256 initialSupply = 1000000 * 10**18;
        _mint(msg.sender, initialSupply);
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
        require(currentAllowance >= amount, "MockCHZ: Transfer amount exceeds allowance");
        
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        
        return true;
    }
    
    // Fonction pour mint des tokens de test
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "MockCHZ: Transfer from zero address");
        require(to != address(0), "MockCHZ: Transfer to zero address");
        require(_balances[from] >= amount, "MockCHZ: Transfer amount exceeds balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        
        emit Transfer(from, to, amount);
    }
    
    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "MockCHZ: Mint to zero address");
        
        totalSupply += amount;
        _balances[to] += amount;
        
        emit Transfer(address(0), to, amount);
    }
    
    function _approve(address ownerAddr, address spender, uint256 amount) internal {
        require(ownerAddr != address(0), "MockCHZ: Approve from zero address");
        require(spender != address(0), "MockCHZ: Approve to zero address");
        
        _allowances[ownerAddr][spender] = amount;
        emit Approval(ownerAddr, spender, amount);
    }
} 