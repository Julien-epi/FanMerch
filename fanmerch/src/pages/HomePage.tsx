import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import Navbar from '../components/Navbar';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-blue-900/20"></div>
        <div className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="relative">
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  FanMerch
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                The first decentralized marketplace for sports collectibles powered by{' '}
                <span className="text-yellow-400 font-semibold">Chiliz fan tokens</span>
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <button
                  onClick={() => navigate('/merch/psg')}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
                >
                  🛍️ Explore Shop
                </button>
                {!isConnected && (
                  <button
                    onClick={() => {/* Le bouton de connexion est dans la navbar */}}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-gray-600 hover:border-gray-500"
                  >
                    🔗 Connect Wallet
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl font-bold text-white mb-2">🏆</div>
                  <div className="text-2xl font-bold text-red-400">PSG</div>
                  <div className="text-gray-400">Official Partnership</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl font-bold text-white mb-2">⛓️</div>
                  <div className="text-2xl font-bold text-yellow-400">Chiliz</div>
                  <div className="text-gray-400">Blockchain Powered</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl font-bold text-white mb-2">🎯</div>
                  <div className="text-2xl font-bold text-blue-400">Exclusive</div>
                  <div className="text-gray-400">Fan Token Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose FanMerch?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of sports merchandise with blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-red-600/50 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-red-600/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Authentic Products</h3>
              <p className="text-gray-400">
                Every product is verified and authenticated through smart contracts, ensuring you get genuine merchandise.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-yellow-600/50 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Fan Token Rewards</h3>
              <p className="text-gray-400">
                Pay with your team's fan tokens and unlock exclusive discounts and VIP access to limited editions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-blue-600/50 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-400">
                Built on Chiliz blockchain for instant transactions and minimal fees. Shop without waiting.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-purple-600/50 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-purple-600/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Decentralized</h3>
              <p className="text-gray-400">
                No middlemen, no hidden fees. Direct transactions between fans and the marketplace.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-green-600/50 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-green-600/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Secure Payments</h3>
              <p className="text-gray-400">
                Multiple payment options: CHZ tokens, fan tokens, with full cryptographic security.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-orange-600/50 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-orange-600/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Exclusive Access</h3>
              <p className="text-gray-400">
                VIP products only available to verified fan token holders. Be part of the exclusive club.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-2xl p-8 md:p-12 border border-red-600/30">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Shopping?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of fans already using FanMerch to buy authentic sports merchandise with their fan tokens.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/merch/psg')}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
              >
                🚀 Start Shopping Now
              </button>
              {isConnected && (
                <button
                  onClick={() => navigate('/my-purchases')}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-gray-600 hover:border-gray-500"
                >
                  📋 View My Purchases
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold text-white">FanMerch</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <span className="text-sm">Powered by Chiliz Blockchain</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Live on Spicy Testnet</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 