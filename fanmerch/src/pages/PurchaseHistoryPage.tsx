import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES, ABIS } from '../config';
import Navbar from '../components/Navbar';

interface Purchase {
  id: number;
  productId: bigint;
  quantity: bigint;
  buyer: string;
  paymentToken: string;
  totalPrice: bigint;
  timestamp: bigint;
}

interface Product {
  id: bigint;
  name: string;
  category: string;
  priceInCHZ: bigint;
  priceInFanToken: bigint;
  fanTokenAddress: string;
  active: boolean;
  metadataURI: string;
  accessConditions: {
    minFanTokenBalance: bigint;
  };
}

const PurchaseHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const { data: userPurchaseIds } = useReadContract({
    address: CONTRACT_ADDRESSES.FanMerchMarketplace as `0x${string}`,
    abi: ABIS.FanMerchMarketplace,
    functionName: 'getUserPurchases',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isConnected }
  });

    // Traitement des données pour créer un tableau complet
  const enrichedPurchases = useMemo(() => {
    if (!userPurchaseIds || !Array.isArray(userPurchaseIds)) return [];
    
    return userPurchaseIds.map((purchaseId: any) => {
      const id = Number(purchaseId);
      return { purchaseId: id };
    });
  }, [userPurchaseIds]);

  const formatDate = (timestamp: number | bigint) => {
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: string | bigint, paymentToken: string) => {
    if (paymentToken === "0x0000000000000000000000000000000000000000") {
      // CHZ natif
      const priceBigInt = typeof price === 'bigint' ? price : BigInt(price);
      return `${parseFloat(formatEther(priceBigInt)).toFixed(2)} CHZ`;
    } else {
      // Fan Token (PSG) - 0 décimales
      const priceNumber = typeof price === 'bigint' ? price.toString() : price;
      return `${priceNumber} PSG`;
    }
  };

  const getProductImage = (metadataURI: string, productName: string) => {
    // Utiliser l'URI des métadonnées (Pinata/IPFS) si disponible
    if (metadataURI && metadataURI.trim() !== '') {
      // Convertir IPFS en HTTP si nécessaire
      if (metadataURI.startsWith('ipfs://')) {
        return metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      // Si c'est déjà une URL HTTP, l'utiliser directement
      if (metadataURI.startsWith('http')) {
        return metadataURI;
      }
      // Si c'est un hash IPFS simple, ajouter le préfixe
      if (metadataURI.startsWith('Qm') || metadataURI.startsWith('baf')) {
        return `https://ipfs.io/ipfs/${metadataURI}`;
      }
    }
    
    // Fallback : images par défaut basées sur le nom du produit
    if (productName.toLowerCase().includes('jersey') || productName.toLowerCase().includes('maillot')) {
      return 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop';
    } else if (productName.toLowerCase().includes('sweat')) {
      return 'https://images.unsplash.com/photo-1556821840-3a9fbc8d56a1?w=400&h=400&fit=crop';
    } else if (productName.toLowerCase().includes('scarf') || productName.toLowerCase().includes('écharpe')) {
      return 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop';
  };

  const getTransactionHash = (productId: bigint, timestamp: bigint) => {
    // Récupérer les hashes stockés dans le localStorage
    const storedTxHashes = JSON.parse(localStorage.getItem('fanmerch_tx_hashes') || '{}');
    
    // Rechercher le hash correspondant au produit et à la période
    const targetTimestamp = Number(timestamp) * 1000; // Convertir en milliseconds
    const timeTolerance = 60000; // 1 minute de tolérance
    
    for (const [txHash, txData] of Object.entries(storedTxHashes)) {
      const txInfo = txData as { productId: number; productName: string; timestamp: number; paymentMethod: string };
      
      // Vérifier si le produit et le timestamp correspondent (avec tolérance)
      if (txInfo.productId === Number(productId) && 
          Math.abs(txInfo.timestamp - targetTimestamp) < timeTolerance) {
        return txHash;
      }
    }
    
    return null;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gray-800 rounded-lg p-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-2">Connection required</h2>
              <p className="text-gray-400 mb-6">
                Please connect your wallet to view your purchase history.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Back to home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* En-tête */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
              
              <div className="h-6 w-px bg-gray-600"></div>
              
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  🛍️ My Purchases
                </h1>
                <p className="text-gray-400">
                  Your purchase history on the decentralized marketplace
                </p>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total purchases</p>
                    <p className="text-2xl font-bold text-white">
                      {userPurchaseIds && Array.isArray(userPurchaseIds) ? userPurchaseIds.length : 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Connected wallet</p>
                    <p className="text-sm font-mono text-white">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Network</p>
                    <p className="text-sm font-bold text-white">Chiliz Spicy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des achats */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Purchase history</h2>
            </div>

            {!userPurchaseIds || !Array.isArray(userPurchaseIds) || userPurchaseIds.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No purchases yet
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  You haven't made any purchases on the marketplace yet.
                </p>
                <button
                  onClick={() => navigate('/merch/psg')}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Discover products
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {enrichedPurchases.map(({ purchaseId }) => (
                  <PurchaseItem 
                    key={purchaseId} 
                    purchaseId={purchaseId} 
                    formatDate={formatDate}
                    formatPrice={formatPrice}
                    getProductImage={getProductImage}
                    getTransactionHash={getTransactionHash}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour afficher un achat individuel
const PurchaseItem: React.FC<{
  purchaseId: number;
  formatDate: (timestamp: number | bigint) => string;
  formatPrice: (price: string | bigint, paymentToken: string) => string;
  getProductImage: (metadataURI: string, productName: string) => string;
  getTransactionHash: (productId: bigint, timestamp: bigint) => string | null;
}> = ({ purchaseId, formatDate, formatPrice, getProductImage, getTransactionHash }) => {
  
  const { data: purchaseData } = useReadContract({
    address: CONTRACT_ADDRESSES.FanMerchMarketplace as `0x${string}`,
    abi: ABIS.FanMerchMarketplace,
    functionName: 'getPurchase',
    args: [purchaseId],
  });

  // Récupérer le produit directement avec son ID une fois qu'on a les données d'achat
  const { data: productData } = useReadContract({
    address: CONTRACT_ADDRESSES.FanMerchMarketplace as `0x${string}`,
    abi: ABIS.FanMerchMarketplace,
    functionName: 'getProduct',
    args: [purchaseData ? (purchaseData as Purchase).productId : 0],
    query: { enabled: !!purchaseData }
  });

  if (!purchaseData || !productData) {
    return (
      <div className="p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-24"></div>
          </div>
          <div className="text-right">
            <div className="h-6 bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  const purchase = purchaseData as Purchase;
  const product = productData as Product;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center relative">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
            </svg>
            <img 
              src={getProductImage(product.metadataURI, product.name)} 
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                const currentTarget = e.currentTarget;
                currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white">
              {product.name}
            </h3>
            <p className="text-sm text-gray-400">
              {product.category}
            </p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Confirmed
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(purchase.timestamp)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-white">
            {formatPrice(purchase.totalPrice, purchase.paymentToken)}
          </p>
          <p className="text-sm text-gray-400">
            Quantity: {Number(purchase.quantity)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            <span className="font-medium">Method:</span> {purchase.paymentToken === "0x0000000000000000000000000000000000000000" ? 'CHZ' : 'PSG'}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <TransactionLink 
            purchase={purchase} 
            purchaseId={purchaseId}
            getTransactionHash={getTransactionHash}
          />
          <div className="text-xs text-gray-500">
            Purchase #{purchaseId}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour afficher le lien vers la transaction
const TransactionLink: React.FC<{
  purchase: Purchase;
  purchaseId: number;
  getTransactionHash: (productId: bigint, timestamp: bigint) => string | null;
}> = ({ purchase, getTransactionHash }) => {
  // Vérifier le localStorage pour les transactions récentes
  const storedTxHash = getTransactionHash(purchase.productId, purchase.timestamp);

  // Note : L'API Chiliz Spicy semble ne pas être accessible publiquement
  // On compte uniquement sur le localStorage pour les transactions futures
  const txHash = storedTxHash;

  if (txHash) {
    return (
      <a
        href={`https://spicy-explorer.chiliz.com/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-400 hover:text-green-300 text-sm underline flex items-center space-x-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span>View transaction</span>
      </a>
    );
  }

  // Si aucune transaction trouvée, ne rien afficher
  return null;
};

export default PurchaseHistoryPage; 