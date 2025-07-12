import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReadContract, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useCart } from '../contexts/CartContext';
import { CONTRACT_ADDRESSES, ABIS } from '../config';

interface Product {
  id: number;
  name: string;
  category: string;
  priceInCHZ: string;
  priceInFanToken: number;
  image: string;
  fanTokenAddress: string;
  active: boolean;
  minFanTokenBalance: number;
}

const MerchPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { addItem, openCart, totalItems } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const { address, isConnected } = useAccount();

  // Récupérer tous les produits actifs d'un coup (optimisé)
  const { data: allActiveProducts } = useReadContract({
    address: CONTRACT_ADDRESSES.FanMerchMarketplace as `0x${string}`,
    abi: ABIS.FanMerchMarketplace,
    functionName: 'getAllActiveProducts',
  });

  // Récupérer le solde PSG de l'utilisateur connecté
  const { data: userPSGBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.PSGFanToken as `0x${string}`,
    abi: ABIS.PSGFanToken,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });

  // Convertir le solde en nombre (PSG n'a pas de décimales)
  const userTokenBalance = useMemo(() => {
    if (!userPSGBalance || !isConnected) return 0;
    return Number(userPSGBalance);
  }, [userPSGBalance, isConnected]);

  // Vérifier l'accès aux produits
  const checkProductAccess = (product: Product) => {
    if (!isConnected) return { canAccess: false, reason: 'Wallet non connecté' };
    if (product.minFanTokenBalance === 0) return { canAccess: true, reason: '' };
    if (userTokenBalance < product.minFanTokenBalance) {
      return { 
        canAccess: false, 
        reason: `${product.minFanTokenBalance} PSG requis (vous avez ${userTokenBalance})` 
      };
    }
    return { canAccess: true, reason: '' };
  };



  // Formater les produits récupérés
  const contractProducts = useMemo(() => {
    if (!allActiveProducts || !Array.isArray(allActiveProducts)) return [];
    
    return allActiveProducts.map((product: any) => ({
      id: Number(product.id),
      name: product.name,
      category: product.category,
      priceInCHZ: formatEther(product.priceInCHZ),
      priceInFanToken: Number(product.priceInFanToken),
      image: product.metadataURI,
      fanTokenAddress: product.fanTokenAddress,
      active: product.active,
      minFanTokenBalance: Number(product.accessConditions.minFanTokenBalance)
    }));
  }, [allActiveProducts]);

  // Utiliser uniquement les produits du contrat
  const products = contractProducts;

  const handleAddToCart = (product: Product) => {
    const access = checkProductAccess(product);
    
    if (!access.canAccess) {
      alert(`🔒 Accès refusé : ${access.reason}`);
      return;
    }
    
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.priceInCHZ),
      priceInCHZ: parseFloat(product.priceInCHZ),
      priceInFanToken: product.priceInFanToken,
      fanTokenAddress: product.fanTokenAddress,
      image: product.image,
      category: product.category,
      teamId: teamId,
      teamName: `Équipe ${teamId}`
    });
  };

  const categories = ['Tous', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = selectedCategory === 'Tous' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
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
                <p className="text-xl font-semibold text-white">
                  Official Shop
                </p>
                <p className="text-sm text-gray-400">
                                      {teamId ? `Team ${teamId}` : 'Merchandising'} • {products.length} products
                </p>
              </div>
            </div>

                         <div className="flex items-center space-x-4">
               <button 
                 onClick={openCart}
                 className="relative p-2 text-gray-300 hover:text-white transition-colors"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13h10M13 13v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6m4-6V7a1 1 0 00-1-1H9a1 1 0 00-1 1v0" />
                 </svg>
                 {totalItems > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                     {totalItems > 99 ? '99+' : totalItems}
                   </span>
                 )}
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Statut des données */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {contractProducts.length > 0 
                ? `📡 ${contractProducts.length} products retrieved from smart contract`
                : '📭 No products in smart contract - use admin page to add products'
              }
            </p>
            {isConnected && (
              <div className="flex items-center space-x-4">
                <div className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded">
                  💰 {userTokenBalance} PSG Tokens
                </div>
                {userTokenBalance >= 100 && (
                  <div className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded">
                    👑 VIP
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille des produits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-300">No products found</h3>
              <p className="text-gray-500">
                No products available
              </p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-red-500 transition-all duration-200 hover:shadow-xl"
            >
              {/* Image du produit */}
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      // Éviter la boucle infinie en ne remplaçant qu'une seule fois
                      if (!e.currentTarget.src.includes('data:image')) {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNzUgMTUwaDUwdjEwMGgtNTB2LTEwMHoiIGZpbGw9IiM2QjcyODAiLz4KPHN2ZyB4PSIxODciIHk9IjE4NyIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiM2QjcyODAiPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnoiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiNGRkZGRkYiPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTQuMTdsNy41OS03LjU5TDE5IDhsLTkgOXoiLz4KPC9zdmc+Cjwvc3ZnPgo8dGV4dCB4PSIyMDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZCNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2Ij5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
                      }
                    }}
                />
              </div>

              {/* Détails du produit */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                    {product.name}
                  </h3>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>

                  {/* Indicateur d'accès */}
                  {product.minFanTokenBalance > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded">
                          🔒 {product.minFanTokenBalance} PSG requis
                        </span>
                        {isConnected && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            userTokenBalance >= product.minFanTokenBalance 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-red-900 text-red-300'
                          }`}>
                            {userTokenBalance >= product.minFanTokenBalance ? '✅' : '❌'} 
                            {userTokenBalance} PSG
                          </span>
                        )}
                      </div>
                     </div>
                  )}

                  {/* Prix */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400 font-medium">
                        {parseFloat(product.priceInCHZ).toFixed(1)} CHZ
                      </span>
                      <span className="text-red-400 font-medium">
                        {product.priceInFanToken} PSG
                      </span>
                     </div>
                   </div>
                   
                  {/* Bouton d'ajout au panier */}
                  {(() => {
                    const access = checkProductAccess(product);
                    return (
                   <button 
                     onClick={() => handleAddToCart(product)}
                        disabled={!access.canAccess}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                          access.canAccess
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                        title={!access.canAccess ? access.reason : undefined}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13h10M13 13v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6m4-6V7a1 1 0 00-1-1H9a1 1 0 00-1 1v0" />
                        </svg>
                        <span>
                          {access.canAccess ? 'Add to cart' : '🔒 Access denied'}
                        </span>
                   </button>
                    );
                  })()}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchPage; 