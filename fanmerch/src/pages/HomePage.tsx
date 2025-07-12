import React from 'react';
import Navbar from '../components/Navbar';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      {/* Contenu principal - pour l'instant juste un message */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Bienvenue sur FanMerch
          </h1>
          <p className="text-lg text-gray-400 mb-8">
            Découvrez les produits officiels de vos équipes favorites avec les fan tokens Chiliz
          </p>
          
          <div className="text-gray-500">
            <p className="mb-2">
              Cliquez sur "Boutique" dans la navbar pour explorer les sports et équipes
            </p>
            <p>
              Connectez votre wallet Socios pour voir vos fan tokens
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 