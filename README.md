# FanMerch

Marketplace token-gated développée en solo dans le cadre du hackathon **Chiliz — Hacking Paris (juillet 2025)**.

Le concept : permettre aux partenaires Socios.com (clubs sportifs) de vendre des produits exclusifs réservés aux détenteurs de leur fan token. L'accès aux articles est conditionné à la détention du token correspondant directement sur le wallet de l'utilisateur — pas de compte, pas de validation manuelle, tout est vérifié on-chain.

## Stack

- **Blockchain** : Chiliz Chain
- **Smart contracts** : Solidity, Foundry
- **Front** : TypeScript, React, Viem / Wagmi
- **Wallet** : intégration via WalletConnect

## Structure du repo

- `fanmerch-sc/` — smart contracts (logique de vérification de détention du token, gestion des produits)
- `fanmerch/` — application front (connexion wallet, catalogue, parcours d'achat)

## Contexte

Hackathon de 48h en solo. Pas de prix gagné, mais un bon terrain pour pousser un projet token-gated de bout en bout sur une chaîne EVM autre qu'Ethereum mainnet — et apprendre à composer avec les contraintes spécifiques de Chiliz.
