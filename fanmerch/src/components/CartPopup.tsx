import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import type { PaymentMethod } from '../contexts/CartContext';

const CartPopup: React.FC = () => {
  const { items, isOpen, totalItems, totalPriceInCHZ, closeCart, updateQuantity, removeItem, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CHZ');

  if (!isOpen) return null;

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    // TODO: Intégration smart contracts
    console.log('Checkout avec:', {
      paymentMethod,
      items,
      totalPriceInCHZ
    });
    
    // Pour l'instant, on vide le panier et ferme
    clearCart();
    alert(`Commande validée ! Paiement en ${paymentMethod}`);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        onClick={closeCart}
      />
      
      {/* Pop-up du panier */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-700 z-[60] transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">
              Panier ({totalItems})
            </h2>
            <button
              onClick={closeCart}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenu du panier */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Votre panier est vide
                </h3>
                <p className="text-gray-400 text-sm">
                  Ajoutez des produits pour commencer vos achats
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 bg-gray-800 rounded-lg p-3">
                    {/* Image du produit */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Détails du produit */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {item.category}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-bold text-red-400">
                          {item.priceInCHZ} CHZ
                        </span>
                        {item.priceInFanToken && (
                          <span className="text-xs text-gray-500">
                            ou {item.priceInFanToken} FT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contrôles quantité */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-10 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg border-2 border-red-500"
                      >
                        <span className="text-white font-bold text-xl leading-none">−</span>
                      </button>
                      
                      <span className="text-white font-bold text-xl min-w-[3rem] text-center bg-gray-700 px-3 py-2 rounded-lg border border-gray-600">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg border-2 border-red-500"
                      >
                        <span className="text-white font-bold text-xl leading-none">+</span>
                      </button>
                    </div>

                    {/* Bouton supprimer */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer avec total et checkout */}
          {items.length > 0 && (
            <div className="border-t border-gray-700 p-4 space-y-4">
              {/* Sélection méthode de paiement */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Méthode de paiement
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPaymentMethod('CHZ')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'CHZ'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    CHZ
                  </button>
                  <button
                    onClick={() => setPaymentMethod('FAN_TOKEN')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'FAN_TOKEN'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Fan Token
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-2 border-t border-gray-600">
                <span className="text-lg font-medium text-white">Total:</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-400">
                    {totalPriceInCHZ.toFixed(2)} CHZ
                  </div>
                  {paymentMethod === 'FAN_TOKEN' && (
                    <div className="text-sm text-gray-400">
                      ou ~{(totalPriceInCHZ * 10).toFixed(0)} FT
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Payer avec {paymentMethod === 'CHZ' ? 'CHZ' : 'Fan Token'}
                </button>
                
                <button
                  onClick={clearCart}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg text-sm transition-colors"
                >
                  Vider le panier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPopup; 