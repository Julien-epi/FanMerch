import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { WalletOptions } from './WalletOptions';
import { Account } from './Account';
import MegaMenuBoutique from './MegaMenuBoutique';
import { useCart } from '../contexts/CartContext';

const Navbar: React.FC = () => {
  const { isConnected } = useAccount();
  const { totalItems, toggleCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Fermer le mega menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        megaMenuRef.current &&
        !megaMenuRef.current.contains(event.target as Node)
      ) {
        setIsMegaMenuOpen(false);
      }
    }
    if (isMegaMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMegaMenuOpen]);

  const navigationItems = [
    { name: 'Shop', href: '#boutique', mega: true },
    ...(isConnected ? [{ name: 'My Purchases', href: '/my-purchases', mega: false }] : []),
    { name: 'Admin', href: '/admin', mega: false },
  ];

  return (
    <>
      <nav className="bg-black shadow-lg sticky top-0 z-50 w-full border-b border-red-600/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="text-2xl font-extrabold text-white tracking-tight select-none">
                  FanMerch
                </span>
              </Link>
            </div>

            {/* Navigation Desktop */}
            <div className="hidden md:flex md:space-x-8">
              {navigationItems.map((item) => (
                item.mega ? (
                  <button
                    key={item.name}
                    onClick={() => setIsMegaMenuOpen((open) => !open)}
                    className="text-gray-300 hover:text-red-400 font-medium px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none hover:bg-red-600/10 border border-transparent hover:border-red-600/30"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-gray-300 hover:text-red-400 font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-red-600/10 border border-transparent hover:border-red-600/30"
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>

            {/* Wallet Section */}
            <div className="flex items-center space-x-4">
              {/* Bouton panier */}
              <button
                onClick={toggleCart}
                className="relative p-2 text-gray-300 hover:text-white transition-colors focus:outline-none hover:bg-red-600/10 rounded-lg"
                aria-label="Cart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13h10M13 13v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6m4-6V7a1 1 0 00-1-1H9a1 1 0 00-1 1v0" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
              
              <div className="hidden sm:block">
                {isConnected ? <Account /> : <WalletOptions />}
              </div>
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white hover:text-red-400 focus:outline-none transition-colors duration-200"
                  aria-label="Open menu"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out bg-black border-t border-red-600/20 ${isMobileMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              item.mega ? (
                <button
                  key={item.name}
                  onClick={() => {
                    setIsMegaMenuOpen((open) => !open);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block text-gray-300 hover:text-red-400 px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-red-600/10 w-full text-left"
                >
                  {item.name}
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block text-gray-300 hover:text-red-400 px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-red-600/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            ))}
            <div className="pt-2 border-t border-red-600/20">
              {isConnected ? <Account /> : <WalletOptions />}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mega Menu */}
      {isMegaMenuOpen && (
        <div ref={megaMenuRef} className="fixed left-0 top-16 w-full z-40">
          <MegaMenuBoutique onClose={() => setIsMegaMenuOpen(false)} />
        </div>
      )}
    </>
  );
};

export default Navbar; 