import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import type { PaymentMethod } from '../contexts/CartContext';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, ABIS } from '../config';

// Types pour les modals
interface PaymentModal {
  isOpen: boolean;
  status: 'pending' | 'success' | 'error';
  title: string;
  message: string;
  details?: string;
  txHash?: string;
}

const CartPopup: React.FC = () => {
  const { 
    items, 
    isOpen, 
    totalItems, 
    totalPriceInCHZ, 
    totalPriceInFanToken,
    closeCart, 
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCart();
  
  const { address, isConnected } = useAccount();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CHZ');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });
  const [modal, setModal] = useState<PaymentModal>({
    isOpen: false,
    status: 'pending',
    title: '',
    message: '',
    details: '',
    txHash: ''
  });

  // Hooks pour les transactions
  const { 
    writeContract: writePurchase, 
    isPending: isPurchasePending, 
    error: purchaseError, 
    data: purchaseHash 
  } = useWriteContract();

  const { 
    writeContract: writeApproval, 
    isPending: isApprovalPending, 
    data: approvalHash 
  } = useWriteContract();

  const { isSuccess: isPurchaseConfirmed, isError: isPurchaseError } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  });

  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Lire l'allowance actuelle pour les fan tokens
  const { data: currentAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.PSGFanToken as `0x${string}`,
    abi: ABIS.PSGFanToken,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACT_ADDRESSES.FanMerchMarketplace as `0x${string}`],
    query: { enabled: !!address && isConnected }
  });

  // Refs pour stabiliser les valeurs
  const itemsRef = useRef(items);
  const deliveryAddressRef = useRef(deliveryAddress);
  const removeItemRef = useRef(removeItem);
  
  // Mettre à jour les refs
  itemsRef.current = items;
  deliveryAddressRef.current = deliveryAddress;
  removeItemRef.current = removeItem;

  // Fonction pour vérifier si une approbation est nécessaire
  const needsApproval = useCallback(() => {
    if (paymentMethod !== 'FAN_TOKEN') return false;
    if (!currentAllowance) return true;
    return Number(currentAllowance) < totalPriceInFanToken;
  }, [paymentMethod, currentAllowance, totalPriceInFanToken]);

  // Fonction pour vérifier si l'adresse est complète
  const isAddressComplete = useCallback(() => {
    const currentAddress = deliveryAddressRef.current;
    return currentAddress.fullName.trim() !== '' &&
           currentAddress.address.trim() !== '' &&
           currentAddress.city.trim() !== '' &&
           currentAddress.postalCode.trim() !== '' &&
           currentAddress.country.trim() !== '';
  }, []);

  // Fonction pour exécuter le paiement
  const executePayment = useCallback(() => {
    try {
      // Pour le MVP, traiter le premier produit du panier
      const currentItems = itemsRef.current;
      const firstItem = currentItems[0];
      const hasMultipleItems = currentItems.length > 1;
      
      if (paymentMethod === 'CHZ') {
        // Achat avec CHZ
        const totalItemPrice = parseEther((firstItem.priceInCHZ * firstItem.quantity).toString());
        
        writePurchase({
          address: CONTRACT_ADDRESSES.FanMerchMarketplace as `0x${string}`,
          abi: ABIS.FanMerchMarketplace,
          functionName: 'buyWithCHZ',
          args: [BigInt(firstItem.id), BigInt(firstItem.quantity)],
          value: totalItemPrice
        });
      } else {
        // Achat avec Fan Token
        writePurchase({
          address: CONTRACT_ADDRESSES.FanMerchMarketplace as `0x${string}`,
          abi: ABIS.FanMerchMarketplace,
          functionName: 'buyWithFanToken',
          args: [BigInt(firstItem.id), BigInt(firstItem.quantity)]
        });
      }

      setModal({
        isOpen: true,
        status: 'pending',
        title: 'Purchase in progress...',
        message: 'Please confirm the transaction in your wallet.',
        details: `${paymentMethod === 'FAN_TOKEN' ? 'Step 2/2: ' : ''}Payment for ${firstItem.name} (${firstItem.quantity}x)${hasMultipleItems ? ' - Other products remain in cart' : ''}`
      });

    } catch (error) {
      console.error('Erreur executePayment:', error);
      setModal({
        isOpen: true,
        status: 'error',
        title: 'Payment error',
        message: 'Unable to process payment.',
        details: 'Check your balance and try again.'
      });
    }
  }, [paymentMethod, writePurchase]);

  // Fonction pour fermer la modal
  const closeModal = useCallback(() => {
    setModal(prev => {
      // Si c'est un succès, fermer aussi le panier
      if (prev.status === 'success') {
        closeCart();
      }
      return { ...prev, isOpen: false };
    });
  }, [closeCart]);

  // Gérer les résultats des transactions
  useEffect(() => {
    if (purchaseHash && isPurchaseConfirmed) {
      const currentItems = itemsRef.current;
      const currentDeliveryAddress = deliveryAddressRef.current;
      const currentRemoveItem = removeItemRef.current;
      
      const purchasedItem = currentItems[0]; // Le produit qui vient d'être acheté
      const hasMultipleItems = currentItems.length > 1;
      
      setModal({
        isOpen: true,
        status: 'success',
        title: 'Purchase successful!',
        message: `${purchasedItem.name} purchased successfully!`,
        details: `Payment made with ${paymentMethod === 'CHZ' ? 'CHZ' : 'PSG Fan Token'}. Delivery to: ${currentDeliveryAddress.fullName}, ${currentDeliveryAddress.city}, ${currentDeliveryAddress.country}${hasMultipleItems ? '. Other products still in cart.' : ''}`,
        txHash: purchaseHash
      });
      
      // Supprimer seulement le produit acheté du panier
      currentRemoveItem(purchasedItem.id);
      
      // Stocker le hash de transaction pour l'historique des achats
      const existingTxHashes = JSON.parse(localStorage.getItem('fanmerch_tx_hashes') || '{}');
      existingTxHashes[purchaseHash] = {
        productId: purchasedItem.id,
        productName: purchasedItem.name,
        timestamp: Date.now(),
        paymentMethod: paymentMethod
      };
      localStorage.setItem('fanmerch_tx_hashes', JSON.stringify(existingTxHashes));
      
      setDeliveryAddress({
        fullName: '',
        address: '',
        city: '',
        postalCode: '',
        country: ''
      });
    } else if (purchaseHash && isPurchaseError) {
      setModal({
        isOpen: true,
        status: 'error',
        title: 'Purchase error',
        message: 'Purchase transaction failed.',
        details: 'Check your balance and try again.',
        txHash: purchaseHash
      });
    } else if (purchaseError) {
      setModal({
        isOpen: true,
        status: 'error',
        title: 'Transaction error',
        message: 'Unable to send transaction.',
        details: purchaseError.message || 'Unknown error'
      });
    }
  }, [purchaseHash, isPurchaseConfirmed, isPurchaseError, purchaseError, paymentMethod]);

  // Gérer l'approbation des fan tokens - lancer automatiquement le paiement
  useEffect(() => {
    if (approvalHash && isApprovalConfirmed) {
      // Lancer automatiquement le paiement après approbation réussie
      executePayment();
    }
  }, [approvalHash, isApprovalConfirmed, executePayment]);

  // Variables dérivées
  const isLoading = isPurchasePending || isApprovalPending;

  // Condition de sortie APRÈS tous les hooks
  if (!isOpen) return null;

  // Fonctions utilitaires (non hooks)
  const handleAddressSubmit = () => {
    if (!isAddressComplete()) {
      setModal({
        isOpen: true,
        status: 'error',
        title: 'Incomplete address',
        message: 'Please fill in all address fields.',
        details: 'Your address is required for product delivery.'
      });
      return;
    }
    setShowAddressForm(false);
    proceedToPayment();
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!isConnected) {
      setModal({
        isOpen: true,
        status: 'error',
        title: 'Wallet not connected',
        message: 'Please connect your wallet to continue.',
        details: 'Use the connect button in the navigation bar.'
      });
      return;
    }

    // Vérifier l'adresse de livraison
    if (!isAddressComplete()) {
      setShowAddressForm(true);
      return;
    }

    proceedToPayment();
  };

  const proceedToPayment = async () => {
    try {
      // Si paiement avec Fan Token et approbation nécessaire, faire l'approbation d'abord
      if (paymentMethod === 'FAN_TOKEN' && needsApproval()) {
        setModal({
          isOpen: true,
          status: 'pending',
          title: 'Approval in progress...',
          message: 'Please confirm the approval in your wallet.',
          details: 'Step 1/2: Authorization to use your PSG tokens'
        });

        // Approuver une grande quantité pour éviter les approbations futures
        const approvalAmount = BigInt(totalPriceInFanToken * 10);
        
        writeApproval({
          address: CONTRACT_ADDRESSES.PSGFanToken as `0x${string}`,
          abi: ABIS.PSGFanToken,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.FanMerchMarketplace as `0x${string}`, approvalAmount]
        });

        // Le paiement sera lancé automatiquement après confirmation de l'approbation
        return;
      }

      // Paiement direct (CHZ ou Fan Token déjà approuvé)
      executePayment();

    } catch (error) {
      console.error('Erreur checkout:', error);
      setModal({
        isOpen: true,
        status: 'error',
        title: 'Payment error',
        message: 'Unable to process payment.',
        details: 'Check your balance and try again.'
      });
    }
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
              Cart ({totalItems})
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
                  Your cart is empty
                </h3>
                <p className="text-gray-400 text-sm">
                  Add products to start shopping
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
                        <span className="text-xs text-gray-500">
                          or {item.priceInFanToken} PSG
                        </span>
                      </div>
                    </div>

                    {/* Contrôles quantité */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
                        disabled={isLoading}
                      >
                        <span className="text-white font-bold text-sm">−</span>
                      </button>
                      
                      <span className="text-white font-bold text-lg min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
                        disabled={isLoading}
                      >
                        <span className="text-white font-bold text-sm">+</span>
                      </button>
                    </div>

                    {/* Bouton supprimer */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      disabled={isLoading}
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
              {/* Note MVP pour plusieurs produits */}
              {items.length > 1 && (
                <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-blue-300 font-medium">MVP - One product at a time</p>
                      <p className="text-xs text-blue-400">
                        For this demo, we process one product per transaction. Others remain in your cart.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Sélection méthode de paiement */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Payment method
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPaymentMethod('CHZ')}
                    disabled={isLoading}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'CHZ'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    CHZ
                  </button>
                  <button
                    onClick={() => setPaymentMethod('FAN_TOKEN')}
                    disabled={isLoading}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'FAN_TOKEN'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    PSG Token
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-2 border-t border-gray-600">
                <span className="text-lg font-medium text-white">Total:</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-400">
                    {paymentMethod === 'CHZ' 
                      ? `${totalPriceInCHZ.toFixed(2)} CHZ`
                      : `${totalPriceInFanToken} PSG`
                    }
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="space-y-2">
                {/* Bouton de paiement unique */}
                <button
                  onClick={handleCheckout}
                  disabled={isLoading || !isConnected}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading 
                    ? (paymentMethod === 'FAN_TOKEN' && needsApproval() ? 'Approval in progress...' : 'Transaction in progress...')
                    : isAddressComplete()
                      ? `Pay with ${paymentMethod === 'CHZ' ? 'CHZ' : 'PSG Token'}`
                      : `📦 Address + Pay with ${paymentMethod === 'CHZ' ? 'CHZ' : 'PSG Token'}`
                  }
                </button>
                
                <button
                  onClick={clearCart}
                  disabled={isLoading}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  Clear cart
                </button>
              </div>

              {/* Statut de connexion */}
              {!isConnected && (
                <div className="text-center">
                  <p className="text-sm text-yellow-400">
                    Connect your wallet to pay
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Formulaire d'adresse de livraison */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-2">
                📦 Delivery address
              </h3>
              <p className="text-sm text-gray-400">
                Please enter your address to receive your products
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddressSubmit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full name *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.fullName}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.address}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: 123 Peace Street"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Paris"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Postal code *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.postalCode}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="75001"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Country *
                </label>
                <select
                  value={deliveryAddress.country}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select a country</option>
                  <option value="France">France</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="Canada">Canada</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Spain">Spain</option>
                  <option value="Italy">Italy</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              {/* Icône de statut */}
              <div className="mx-auto mb-4">
                {modal.status === 'success' && (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {modal.status === 'error' && (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {modal.status === 'pending' && (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}

              </div>

              {/* Titre et message */}
              <h3 className="text-lg font-medium text-white mb-2">
                {modal.title}
              </h3>
              <p className="text-gray-300 mb-4">
                {modal.message}
              </p>
              
              {/* Détails */}
              {modal.details && (
                <p className="text-sm text-gray-400 mb-4">
                  {modal.details}
                </p>
              )}

              {/* Hash de transaction */}
              {modal.txHash && (
                <div className="mb-4 space-y-2">
                  <a
                    href={`https://spicy-explorer.chiliz.com/tx/${modal.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline block"
                  >
                    View transaction
                  </a>
                  {modal.status === 'success' && (
                    <a
                      href="/my-purchases"
                      className="text-green-400 hover:text-green-300 text-sm underline block"
                    >
                      View my purchases
                    </a>
                  )}
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex space-x-3">
                <button
                  onClick={closeModal}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartPopup;