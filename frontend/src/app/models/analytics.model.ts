export interface StudentAnalytics {
  studentId: string;
  puzzleRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  lessonsAttended: number;
  openings: Record<string, number>;
  accuracy: Array<{ date: string; value: number }>;
  ratingHistory: Array<{ date: string; rating: number }>;
  puzzlesSolved: number;
}

export interface AcademyAnalytics {
  totalUsers: number;
  totalGames: number;
  totalLessons: number;
  totalVideos: number;
  totalPuzzles: number;
  totalMoveSequences: number;
  activeStudents: number;
  usersByType: Record<string, number>;
  recentGames: any[];
}

export interface AdminDashboard {
  totalStudents: number;
  totalInstructors: number;
  activeGames: number;
  activeLessons: number;
  recentGames: any[];
}
