import { http, createConfig } from 'wagmi'
import { chiliz } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

// Import des ABIs
import FanMerchMarketplaceABI from './contracts/FanMerchMarketplace.json';
import PSGFanTokenABI from './contracts/PSGFanToken.json';
import type { Abi } from 'viem';

const projectId = 'd83f5f36a06949dff3298190b0e4167b'

const chilizSpicyTestnet = {
  id: 88882,
  name: "Chiliz Spicy Testnet",
  network: "chiliz-spicy-testnet",
  nativeCurrency: {
    name: "CHZ",
    symbol: "CHZ",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://spicy-rpc.chiliz.com"] },
    public: { http: ["https://spicy-rpc.chiliz.com"] },
  },
  blockExplorers: {
    default: { name: "Chiliz Explorer", url: "https://spicy-explorer.chiliz.com" },
  },
  testnet: true,
};

export const config = createConfig({
  chains: [chiliz, chilizSpicyTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [chiliz.id]: http(),
    [chilizSpicyTestnet.id]: http(),
  },
})

// === CONFIGURATION DES CONTRATS ===

// Adresses des contrats déployés
export const CONTRACT_ADDRESSES = {
  PSGFanToken: "0x0ABB672dae65c936E3A35bb787C69f0d200a6895",
  FanMerchMarketplace: "0x0b8C14bf46EF8f2A3C02FB95EB61A707e9ADfa68"
} as const;

// ABIs des contrats
export const ABIS = {
  FanMerchMarketplace: FanMerchMarketplaceABI.abi as Abi,
  PSGFanToken: PSGFanTokenABI.abi as Abi
} as const;

// Configuration réseau
export const NETWORK_CONFIG = {
  chainId: 88882,
  name: "Chiliz Spicy Testnet",
  rpcUrl: "https://spicy-rpc.chiliz.com",
  blockExplorer: "https://spicy-explorer.chiliz.com"
} as const;

// Constantes utiles
export const DECIMALS = {
  CHZ: 18,
  PSG: 0
} as const; 