import type { Team } from '../interfaces/Team';

// Service pour récupérer les données des équipes depuis une API réelle
export const fetchTeams = async (): Promise<Team[]> => {
  try {
    // Option 1: API CoinGecko pour les fan tokens
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=fan-token&order=market_cap_desc&per_page=100&page=1');
    
    let apiTeams: Team[] = [];
    
    if (response.ok) {
      const data = await response.json();
      
      // Mapper les données de l'API vers notre interface Team
      apiTeams = data.map((token: any) => ({
        id: token.id,
        name: token.name,
        symbol: token.symbol.toUpperCase(),
        sport: mapTokenToSport(token.symbol), // Fonction helper pour déterminer le sport
        logo: token.image,
        description: token.name
      }));
    }
    
    // Ajouter manuellement les équipes manquantes de Chiliz
    const additionalTeams: Team[] = [
      // Esports
      { id: 'og-esports', name: 'OG Esports', symbol: 'OG', sport: 'Esports', country: 'Europe' },
      { id: 'navi', name: 'Natus Vincere', symbol: 'NAVI', sport: 'Esports', country: 'Ukraine' },
      { id: 'alliance', name: 'Alliance', symbol: 'ALL', sport: 'Esports', country: 'Suède' },
      
      // NBA
      { id: 'lakers', name: 'Los Angeles Lakers', symbol: 'LAL', sport: 'NBA', country: 'USA' },
      { id: 'warriors', name: 'Golden State Warriors', symbol: 'GSW', sport: 'NBA', country: 'USA' },
      { id: 'bulls', name: 'Chicago Bulls', symbol: 'CHI', sport: 'NBA', country: 'USA' },
      
      // NFL
      { id: 'patriots', name: 'New England Patriots', symbol: 'NE', sport: 'NFL', country: 'USA' },
      { id: 'cowboys', name: 'Dallas Cowboys', symbol: 'DAL', sport: 'NFL', country: 'USA' },
      
      // Formule 1
      { id: 'alpine-f1', name: 'Alpine F1 Team', symbol: 'ALPINE', sport: 'Formule 1', country: 'France' },
      { id: 'aston-martin', name: 'Aston Martin F1', symbol: 'AM', sport: 'Formule 1', country: 'Angleterre' },
      { id: 'ferrari', name: 'Scuderia Ferrari', symbol: 'FER', sport: 'Formule 1', country: 'Italie' },
      
      // MMA/UFC
      { id: 'ufc', name: 'UFC', symbol: 'UFC', sport: 'MMA', country: 'USA' },
      { id: 'pfl', name: 'Professional Fighters League', symbol: 'PFL', sport: 'MMA', country: 'USA' },
      
      // Tennis
      { id: 'davis-cup', name: 'Davis Cup', symbol: 'DAVIS', sport: 'Tennis', country: 'International' },
      
      // Hockey
      { id: 'canadiens', name: 'Montreal Canadiens', symbol: 'MTL', sport: 'Hockey', country: 'Canada' },
      
      // Cricket
      { id: 'rcb', name: 'Royal Challengers Bangalore', symbol: 'RCB', sport: 'Cricket', country: 'Inde' },
      
      // Football supplémentaires (équipes nationales)
      { id: 'argentina-nt', name: 'Argentine', symbol: 'ARG', sport: 'Football', country: 'Argentine' },
      { id: 'portugal-nt', name: 'Portugal', symbol: 'POR', sport: 'Football', country: 'Portugal' },
      { id: 'spain-nt', name: 'Espagne', symbol: 'ESP', sport: 'Football', country: 'Espagne' },
    ];
    
    // Combiner les équipes de l'API avec les équipes additionnelles
    const allTeams = [...apiTeams, ...additionalTeams];
    
    // Supprimer les doublons par symbole
    const uniqueTeams = allTeams.filter((team, index, self) => 
      index === self.findIndex(t => t.symbol === team.symbol)
    );
    
    return uniqueTeams;
    
  } catch (error) {
    console.error('Erreur lors de la récupération des équipes:', error);
    
    // Fallback complet : équipes connues si l'API échoue
    return [
      // Football
      { id: 'psg', name: 'Paris Saint-Germain', symbol: 'PSG', sport: 'Football', country: 'France' },
      { id: 'bar', name: 'FC Barcelona', symbol: 'BAR', sport: 'Football', country: 'Espagne' },
      { id: 'juv', name: 'Juventus', symbol: 'JUV', sport: 'Football', country: 'Italie' },
      { id: 'city', name: 'Manchester City', symbol: 'CITY', sport: 'Football', country: 'Angleterre' },
      { id: 'arsenal', name: 'Arsenal FC', symbol: 'AFC', sport: 'Football', country: 'Angleterre' },
      { id: 'milan', name: 'AC Milan', symbol: 'ACM', sport: 'Football', country: 'Italie' },
      { id: 'inter', name: 'Inter Milan', symbol: 'INTER', sport: 'Football', country: 'Italie' },
      { id: 'roma', name: 'AS Roma', symbol: 'ASR', sport: 'Football', country: 'Italie' },
      { id: 'atletico', name: 'Atlético Madrid', symbol: 'ATM', sport: 'Football', country: 'Espagne' },
      
      // Esports
      { id: 'og', name: 'OG Esports', symbol: 'OG', sport: 'Esports', country: 'Europe' },
      { id: 'navi', name: 'Natus Vincere', symbol: 'NAVI', sport: 'Esports', country: 'Ukraine' },
      { id: 'alliance', name: 'Alliance', symbol: 'ALL', sport: 'Esports', country: 'Suède' },
      
      // NBA
      { id: 'lakers', name: 'Los Angeles Lakers', symbol: 'LAL', sport: 'NBA', country: 'USA' },
      { id: 'warriors', name: 'Golden State Warriors', symbol: 'GSW', sport: 'NBA', country: 'USA' },
      
      // NFL
      { id: 'patriots', name: 'New England Patriots', symbol: 'NE', sport: 'NFL', country: 'USA' },
      
      // Formule 1
      { id: 'alpine', name: 'Alpine F1 Team', symbol: 'ALPINE', sport: 'Formule 1', country: 'France' },
      { id: 'aston', name: 'Aston Martin F1', symbol: 'AM', sport: 'Formule 1', country: 'Angleterre' },
      
      // MMA
      { id: 'ufc', name: 'UFC', symbol: 'UFC', sport: 'MMA', country: 'USA' },
    ];
  }
};

// Helper pour mapper les tokens aux sports
const mapTokenToSport = (symbol: string): string => {
  const footballTeams = ['PSG', 'BAR', 'JUV', 'CITY', 'AFC', 'ACM', 'INTER', 'ASR', 'ATM', 'CHZ', 'SANTOS', 'GAL', 'LAZIO', 'ARG', 'POR', 'ESP'];
  const esportsTeams = ['OG', 'NAVI', 'ALLIANCE', 'ALL'];
  const nflTeams = ['PATRIOTS', 'NE', 'DAL'];
  const nbaTeams = ['LAKERS', 'LAL', 'GSW', 'CHI'];
  const f1Teams = ['ALPINE', 'AM', 'FER'];
  const mmaTeams = ['UFC', 'PFL'];
  const tennisTeams = ['DAVIS'];
  const hockeyTeams = ['MTL'];
  const cricketTeams = ['RCB'];
  
  const upperSymbol = symbol.toUpperCase();
  
  if (footballTeams.includes(upperSymbol)) return 'Football';
  if (esportsTeams.includes(upperSymbol)) return 'Esports';
  if (nflTeams.includes(upperSymbol)) return 'NFL';
  if (nbaTeams.includes(upperSymbol)) return 'NBA';
  if (f1Teams.includes(upperSymbol)) return 'Formule 1';
  if (mmaTeams.includes(upperSymbol)) return 'MMA';
  if (tennisTeams.includes(upperSymbol)) return 'Tennis';
  if (hockeyTeams.includes(upperSymbol)) return 'Hockey';
  if (cricketTeams.includes(upperSymbol)) return 'Cricket';
  
  return 'Football'; // Par défaut
}; 