export interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: 'SWISS' | 'ROUND_ROBIN';
  timeControl: number;
  maxPlayers: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  currentRound: number;
  _count?: { entries: number; games: number };
  entries?: TournamentEntry[];
  games?: any[];
}

export interface TournamentEntry {
  id: string;
  tournamentId: string;
  userId: string;
  score: number;
  rank?: number;
  user?: { id: string; username: string; firstName: string; lastName: string; rating: number };
}
