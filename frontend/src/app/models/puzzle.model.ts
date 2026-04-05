export interface Puzzle {
  _id: string;
  fen: string;
  solution: string[];
  category: string;
  themes?: string[];
  rating: number;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface PuzzleAttempt {
  correct: boolean;
  solution: string[];
}
