# 🚀 FanMerch Smart Contracts

Smart contracts pour la marketplace de Fan Tokens sur Chiliz.

## 📋 **Contrats**

- **PSGFanToken** : Token ERC20 PSG avec 0 décimales
- **FanMerchMarketplace** : Marketplace pour acheter des produits avec CHZ ou PSG

## 🔧 **Configuration requise**

```bash
# Installer Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## 🛠️ **Correction de l'erreur MCOPY**

L'erreur `[invalid opcode: MCOPY]` était due à :
- Version EVM trop récente
- Opcodes non supportés par Chiliz Spicy

### **Corrections appliquées :**

1. **foundry.toml** : EVM version "shanghai"
2. **Solidity** : Version fixée à 0.8.19
3. **Compatibilité** : Opcodes compatibles Chiliz

## 🚀 **Déploiement**

```bash
# Nettoyer et compiler
forge clean
forge build

# Déployer sur Chiliz Spicy
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://spicy-rpc.chiliz.com \
  --broadcast \
  --verify \
  --etherscan-api-key dummy \
  --private-key $PRIVATE_KEY

# Ou avec un wallet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://spicy-rpc.chiliz.com \
  --broadcast \
  --verify \
  --etherscan-api-key dummy \
  --wallet-interactive
```

## 📝 **Variables d'environnement**

```bash
# .env
PRIVATE_KEY=votre_clé_privée_ici
RPC_URL=https://spicy-rpc.chiliz.com
```

## 🔍 **Vérification**

```bash
# Vérifier les contrats
cast call $PSG_TOKEN_ADDRESS "totalSupply()" --rpc-url $RPC_URL
cast call $MARKETPLACE_ADDRESS "nextProductId()" --rpc-url $RPC_URL
```

## 🌐 **Réseau Chiliz Spicy**

- **RPC** : https://spicy-rpc.chiliz.com
- **Chain ID** : 88882
- **Explorer** : https://spicy-explorer.chiliz.com
- **Faucet** : https://spicy-faucet.chiliz.com

## 📊 **Derniers contrats déployés**

== Logs ==
  === DEPLOYMENT SUCCESSFUL ===
  PSG Token: 0x0ABB672dae65c936E3A35bb787C69f0d200a6895
  Marketplace: 0x0b8C14bf46EF8f2A3C02FB95EB61A707e9ADfa68
  You now have 200,000 PSG tokens!

## Setting up 1 EVM.

## 🎯 **Utilisation**

1. **Mint PSG tokens** : `mint(to, amount)`
2. **Ajouter produit** : `addProduct(name, category, priceInCHZ, priceInFanToken, fanTokenAddress, metadataURI)`
3. **Acheter avec CHZ** : `buyWithCHZ(productId, quantity) payable`
4. **Acheter avec PSG** : `buyWithFanToken(productId, quantity)`

## 🔐 **Sécurité**

- Contrats audités pour les vulnerabilités communes
- Utilisation de OpenZeppelin pour les standards ERC20
- Modifiers pour la sécurité des fonctions admin

## 🐛 **Résolution des problèmes**

### Erreur MCOPY
- ✅ **Corrigé** : EVM version "shanghai"
- ✅ **Corrigé** : Solidity 0.8.19 fixe

### Gas trop élevé
- Utiliser `--gas-limit 3000000` si nécessaire

### Vérification échouée
- Attendre quelques minutes après le déploiement
- Réessayer avec `forge verify-contract`

