import React, { useState } from 'react';
import { parseEther } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, ABIS } from '../config';
import { uploadToPinata } from '../config/uploadConfig';
import Navbar from '../components/Navbar';

// Confirmation modal popup
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  status: 'success' | 'error' | 'partial';
  title: string;
  message: string;
  details?: string;
  txHash?: string;
}> = ({ isOpen, onClose, status, title, message, details, txHash }) => {
  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'partial': return '⚠️';
      default: return '💬';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-800 border-green-600';
      case 'error': return 'bg-red-800 border-red-600';
      case 'partial': return 'bg-yellow-800 border-yellow-600';
      default: return 'bg-gray-800 border-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="text-center">
          <div className="text-4xl mb-4">{getStatusIcon()}</div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-300 mb-4">{message}</p>
          
          {details && (
            <div className={`p-3 rounded-lg mb-4 ${getStatusColor()}`}>
              <p className="text-sm text-gray-200">{details}</p>
            </div>
          )}
          
          {txHash && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Transaction Hash:</p>
              <p className="text-xs text-blue-400 font-mono break-all">{txHash}</p>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPage: React.FC = () => {
  const { isConnected } = useAccount();
  const { writeContract, isPending, error, data: hash } = useWriteContract();
  const { isSuccess: isConfirmed, isError: isConfirmError } = useWaitForTransactionReceipt({
    hash,
  });

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    priceInCHZ: '',
    priceInFanToken: '',
    fanTokenAddress: CONTRACT_ADDRESSES.PSGFanToken,
    imageUrl: '',
    minFanTokenBalance: '0'
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ipfsUrl, setIpfsUrl] = useState<string>('');

  // States for confirmation popup
  const [modal, setModal] = useState<{
    isOpen: boolean;
    status: 'success' | 'error' | 'partial';
    title: string;
    message: string;
    details?: string;
    txHash?: string;
  }>({
    isOpen: false,
    status: 'success',
    title: '',
    message: '',
    details: '',
    txHash: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File is too large. Maximum 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setModal({
        isOpen: true,
        status: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to add products.',
        details: 'Use the connect button in the navigation bar.'
      });
      return;
    }

    if (!imageFile) {
      setModal({
        isOpen: true,
        status: 'error',
        title: 'Image Required',
        message: 'Please select an image for the product.',
        details: 'The image will be stored permanently on IPFS.'
      });
      return;
    }

    try {
      setUploadingImage(true);
      
      // Direct upload to Pinata IPFS
      const uploadedUrl = await uploadToPinata(imageFile);
      console.log('✅ Image uploaded to IPFS:', uploadedUrl);
      setIpfsUrl(uploadedUrl);
      
      setUploadingImage(false);
      
      // Convert prices
      const priceInCHZ = parseEther(formData.priceInCHZ);
      const priceInFanToken = BigInt(parseInt(formData.priceInFanToken));

      writeContract({
        address: CONTRACT_ADDRESSES.FanMerchMarketplace as `0x${string}`,
        abi: ABIS.FanMerchMarketplace,
        functionName: 'addProduct',
        args: [
          formData.name,
          formData.category,
          priceInCHZ,
          priceInFanToken,
          formData.fanTokenAddress as `0x${string}`,
          uploadedUrl,
          BigInt(parseInt(formData.minFanTokenBalance))
        ]
      });
      
    } catch (error) {
      setUploadingImage(false);
      console.error('Error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('Configure your JWT Token')) {
          errorDetails = 'Add your Pinata JWT Token in uploadConfig.ts';
        }
      }
      
      setModal({
        isOpen: true,
        status: 'error',
        title: 'IPFS Upload Error',
        message: errorMessage,
        details: errorDetails
      });
    }
  };

  // Handle transaction results
  React.useEffect(() => {
    if (hash && isConfirmed) {
      // Complete success: IPFS + Blockchain
      setModal({
        isOpen: true,
        status: 'success',
        title: 'Product Added Successfully!',
        message: 'The product has been successfully added to IPFS and blockchain.',
        details: `Image stored on IPFS: ${ipfsUrl}`,
        txHash: hash
      });
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        priceInCHZ: '',
        priceInFanToken: '',
        fanTokenAddress: CONTRACT_ADDRESSES.PSGFanToken,
        imageUrl: '',
        minFanTokenBalance: '0'
      });
      setImageFile(null);
      setImagePreview('');
      setIpfsUrl('');
      
    } else if (hash && isConfirmError) {
      // Blockchain error but IPFS OK
      setModal({
        isOpen: true,
        status: 'partial',
        title: 'Blockchain Problem',
        message: 'Image was uploaded to IPFS but the blockchain transaction failed.',
        details: 'Check the transaction logs for more details.',
        txHash: hash
      });
    } else if (error && !hash) {
      // Complete error
      setModal({
        isOpen: true,
        status: 'error',
        title: 'Transaction Error',
        message: 'Unable to send transaction to blockchain.',
        details: error.message || 'Unknown error'
      });
    }
  }, [hash, isConfirmed, isConfirmError, error, ipfsUrl]);

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const categories = [
    'Jerseys',
    'Hoodies',
    'T-Shirts',
    'Accessories',
    'Shoes',
    'Caps',
    'Scarves',
    'Collectibles'
  ];

  const isLoading = isPending || uploadingImage;

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              🛠️ Administration - Add Product
            </h1>
            <p className="text-gray-400">
              Add collector items to the decentralized marketplace
            </p>
            <p className="text-gray-500 text-sm mt-2">
              📡 Images stored on Pinata IPFS for permanent and decentralized storage
            </p>
            {!isConnected && (
              <div className="mt-4 p-3 bg-yellow-800 border border-yellow-600 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  ⚠️ Please connect your wallet to add products
                </p>
              </div>
            )}
          </div>

          {/* Add form */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <form onSubmit={addProduct} className="space-y-6">
              
              {/* Product name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: PSG Collector Jersey 2024"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price in CHZ *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="priceInCHZ"
                    value={formData.priceInCHZ}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: 75.00"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price in PSG Token *
                  </label>
                  <input
                    type="number"
                    name="priceInFanToken"
                    value={formData.priceInFanToken}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: 85"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Fan Token Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fan Token Address *
                </label>
                <input
                  type="text"
                  name="fanTokenAddress"
                  value={formData.fanTokenAddress}
                  onChange={handleInputChange}
                  required
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  PSG Token contract address (pre-filled)
                </p>
              </div>

              {/* Minimum fan tokens required */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum fan tokens required <span className="text-purple-400">(Exclusivity)</span>
                </label>
                <input
                  type="number"
                  name="minFanTokenBalance"
                  value={formData.minFanTokenBalance}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Ex: 50"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  If 0 = accessible to all | If &gt; 0 = minimum PSG tokens required to buy
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  💡 Examples: 0 (everyone), 25 (supporters), 50 (premium), 100 (VIP)
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Image * <span className="text-purple-400">(Pinata IPFS)</span>
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {imagePreview && (
                    <div className="w-20 h-20 bg-gray-600 rounded-lg overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Accepted formats: JPG, PNG, GIF (max 5MB) - Permanent storage on Pinata IPFS
                </p>
              </div>

              {/* Add button */}
              <button
                type="submit"
                disabled={!isConnected || isLoading || !imageFile}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  isConnected && !isLoading && imageFile
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {uploadingImage ? '📡 Uploading to Pinata IPFS...' : 
                 isPending ? '⏳ Adding Product...' : 
                 '✅ Add Product'}
              </button>
            </form>
          </div>

          {/* Product preview */}
          {formData.name && imagePreview && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">📦 Product Preview</h3>
              <div className="bg-gray-700 rounded-lg p-4 max-w-sm">
                <img 
                  src={imagePreview} 
                  alt={formData.name}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <h4 className="font-bold text-white mb-2">{formData.name}</h4>
                <p className="text-gray-400 text-sm mb-2">{formData.category}</p>
                <div className="flex justify-between">
                  <span className="text-blue-400 font-medium">{formData.priceInCHZ} CHZ</span>
                  <span className="text-red-400 font-medium">{formData.priceInFanToken} PSG</span>
                </div>
                {formData.minFanTokenBalance && parseInt(formData.minFanTokenBalance) > 0 && (
                  <div className="mt-2 text-center">
                    <span className="text-purple-400 text-sm font-medium bg-purple-900 px-2 py-1 rounded">
                      🔒 {formData.minFanTokenBalance} PSG required
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation popup */}
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        status={modal.status}
        title={modal.title}
        message={modal.message}
        details={modal.details}
        txHash={modal.txHash}
      />
    </div>
  );
};

export default AdminPage; 