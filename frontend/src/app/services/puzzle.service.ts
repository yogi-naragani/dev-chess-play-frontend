import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  fen: string;
  solution: string[];
  rating: number;
  category: string;
  themes: string[];
  playerColor: 'w' | 'b';
}

export interface PuzzleAttempt {
  id: string;
  puzzleId: string;
  puzzleTitle: string;
  solved: boolean;
  ratingChange: number;
  timeSpent: number;
  attemptedAt: string;
}

export interface DailyPuzzle {
  puzzle: Puzzle;
  completed: boolean;
}

export interface PuzzleSolveResult {
  correct: boolean;
  ratingChange: number;
  newRating: number;
  solution: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PuzzleService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getDailyPuzzle(): Observable<DailyPuzzle> {
    return this.http.get<DailyPuzzle>(`${this.apiUrl}/puzzles/daily`, { headers: this.getHeaders() });
  }

  getPuzzles(params?: { category?: string; minRating?: number; maxRating?: number; page?: number; limit?: number }): Observable<{ data: Puzzle[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.minRating) httpParams = httpParams.set('minRating', params.minRating.toString());
    if (params?.maxRating) httpParams = httpParams.set('maxRating', params.maxRating.toString());
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<{ data: Puzzle[]; total: number }>(
      `${this.apiUrl}/puzzles`,
      { headers: this.getHeaders(), params: httpParams }
    );
  }

  getPuzzle(id: string): Observable<Puzzle> {
    return this.http.get<Puzzle>(`${this.apiUrl}/puzzles/${id}`, { headers: this.getHeaders() });
  }

  submitSolution(puzzleId: string, moves: string[], timeSpent: number): Observable<PuzzleSolveResult> {
    return this.http.post<PuzzleSolveResult>(
      `${this.apiUrl}/puzzles/${puzzleId}/solve`,
      { moves, timeSpent },
      { headers: this.getHeaders() }
    );
  }

  getMyAttempts(page: number = 1, limit: number = 10): Observable<{ data: PuzzleAttempt[]; total: number }> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<{ data: PuzzleAttempt[]; total: number }>(
      `${this.apiUrl}/puzzles/attempts/me`,
      { headers: this.getHeaders(), params }
    );
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/puzzles/categories`, { headers: this.getHeaders() });
  }

  requestHint(puzzleId: string, moveIndex: number): Observable<{ hint: string }> {
    return this.http.post<{ hint: string }>(
      `${this.apiUrl}/puzzles/${puzzleId}/hint`,
      { moveIndex },
      { headers: this.getHeaders() }
    );
  }
}
