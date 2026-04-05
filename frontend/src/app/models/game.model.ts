export type GameResult = 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ABANDONED';

export interface Game {
  id: string;
  whiteId: string;
  blackId: string;
  pgn?: string;
  fen?: string;
  result?: GameResult;
  timeControl: number;
  ratingChange?: number;
  isRated: boolean;
  tournamentId?: string;
  createdAt: string;
  white?: { id: string; username: string; firstName: string; lastName: string; rating: number };
  black?: { id: string; username: string; firstName: string; lastName: string; rating: number };
  moves?: GameMove[];
}

export interface GameMove {
  move: string;
  san: string;
  fen: string;
  timestamp: string;
  timeLeft: number;
}

export interface MatchData {
  gameId: string;
  timeControl: number;
  white: { id: string; username: string };
  black: { id: string; username: string };
}
