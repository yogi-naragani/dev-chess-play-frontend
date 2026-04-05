export interface MoveSequence {
  _id: string;
  title: string;
  category: string;
  opening?: string;
  pgn?: string;
  moves: ChessMove[];
  difficulty: string;
  tags?: string[];
  createdBy: string;
  createdAt: string;
}

export interface ChessMove {
  move: string;
  annotation?: string;
  fen: string;
  moveNumber: number;
}
