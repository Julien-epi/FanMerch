import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Team, Sport } from '../interfaces/Team';
import { fetchTeams } from '../services/teamService';

interface MegaMenuBoutiqueProps {
  onClose: () => void;
}

const MegaMenuBoutique: React.FC<MegaMenuBoutiqueProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const data = await fetchTeams();
        setTeams(data);
        setError(null);
      } catch (err) {
        setError('Error loading teams');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  // Grouper les équipes par sport
  const groupedSports = teams.reduce((acc: Sport[], team) => {
    const existingSport = acc.find(sport => sport.name === team.sport);
    if (existingSport) {
      existingSport.teams.push(team);
    } else {
      acc.push({ name: team.sport, teams: [team] });
    }
    return acc;
  }, []);

  const handleSportClick = (sportName: string) => {
    setSelectedSport(sportName);
  };

  const handleBackToSports = () => {
    setSelectedSport(null);
  };

  const handleTeamClick = (team: Team) => {
    // Fermer le menu et rediriger vers la page de l'équipe
    onClose();
    // Redirection vers la page merch avec l'ID ou symbol de l'équipe
    navigate(`/merch/${team.symbol || team.id}`);
  };

  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 z-50">
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg mx-4 mt-2 shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              <span className="text-white font-medium">Chargement...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-full left-0 right-0 z-50">
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg mx-4 mt-2 shadow-2xl">
          <div className="p-6 text-center">
            <p className="text-red-400 font-medium mb-2">{error}</p>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue des sports (par défaut)
  if (!selectedSport) {
    return (
      <div className="absolute top-full left-0 right-0 z-50">
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg mt-2 shadow-2xl max-w-lg mx-auto">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Sports</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grille des sports */}
            <div className="grid grid-cols-3 gap-3">
              {groupedSports.map((sport) => (
                <button
                  key={sport.name}
                  onClick={() => handleSportClick(sport.name)}
                  className="group p-3 rounded-lg bg-gray-800/50 hover:bg-red-600/20 border border-gray-700 hover:border-red-500 transition-all duration-200"
                >
                  {/* Icône du sport */}
                  <div className="w-8 h-8 mx-auto mb-2 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-colors duration-200">
                    <span className="text-white text-sm">
                      {sport.name === 'Football' ? '⚽' : 
                       sport.name === 'Esports' ? '🎮' : 
                       sport.name === 'NBA' ? '🏀' : 
                       sport.name === 'NFL' ? '🏈' : 
                       sport.name === 'Formule 1' ? '🏎️' : 
                       sport.name === 'MMA' ? '🥊' : 
                       sport.name === 'Tennis' ? '🎾' : 
                       sport.name === 'Hockey' ? '🏒' : 
                       sport.name === 'Cricket' ? '🏏' : '🏆'}
                    </span>
                  </div>
                  
                  {/* Nom du sport */}
                  <h3 className="text-xs font-medium text-white group-hover:text-red-400 transition-colors duration-200">
                    {sport.name}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue des équipes du sport sélectionné
  const selectedSportData = groupedSports.find(sport => sport.name === selectedSport);
  if (!selectedSportData) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg mt-2 shadow-2xl max-w-2xl mx-auto">
        <div className="p-4">
          {/* Header avec retour */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackToSports}
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Retour</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {selectedSport === 'Football' ? '⚽' : 
                   selectedSport === 'Esports' ? '🎮' : 
                   selectedSport === 'NBA' ? '🏀' : 
                   selectedSport === 'NFL' ? '🏈' : 
                   selectedSport === 'Formule 1' ? '🏎️' : 
                   selectedSport === 'MMA' ? '🥊' : 
                   selectedSport === 'Tennis' ? '🎾' : 
                   selectedSport === 'Hockey' ? '🏒' : 
                   selectedSport === 'Cricket' ? '🏏' : '🏆'}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedSport}</h2>
                  <p className="text-xs text-gray-400">
                    {selectedSportData.teams.length} team{selectedSportData.teams.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Grille des équipes avec scroll */}
          <div className="max-h-60 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {selectedSportData.teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamClick(team)}
                  className="group bg-gray-800/50 hover:bg-red-600/20 p-2 rounded-lg border border-gray-700 hover:border-red-500 transition-all duration-200"
                >
                  {/* Logo de l'équipe */}
                  <div className="w-8 h-8 mx-auto mb-1">
                    {team.logo ? (
                      <img 
                        src={team.logo} 
                        alt={team.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs ${team.logo ? 'hidden' : ''}`}>
                      {team.symbol.charAt(0)}
                    </div>
                  </div>
                  
                  {/* Nom de l'équipe - TOUJOURS BLANC */}
                  <h3 className="font-medium text-white text-center text-xs leading-tight">
                    {team.name}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenuBoutique; 