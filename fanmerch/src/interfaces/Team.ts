export interface Team {
  id: string;
  name: string;
  symbol: string;
  sport: string;
  country?: string;
  logo?: string;
  description?: string;
}

export interface Sport {
  name: string;
  teams: Team[];
} 