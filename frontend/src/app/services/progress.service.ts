import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StudentProgress {
  currentRating: number;
  ratingHistory: { date: string; rating: number }[];
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  lessonsAttended: number;
  puzzleRating: number;
  puzzlesSolved: number;
  accuracy: number;
  openingRepertoire: { name: string; games: number; winRate: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getMyProgress(): Observable<StudentProgress> {
    return this.http.get<StudentProgress>(`${this.apiUrl}/progress/me`, { headers: this.getHeaders() });
  }

  getRatingHistory(period: string = '6months'): Observable<{ date: string; rating: number }[]> {
    return this.http.get<{ date: string; rating: number }[]>(
      `${this.apiUrl}/progress/rating-history?period=${period}`,
      { headers: this.getHeaders() }
    );
  }

  getGameStats(): Observable<{ wins: number; losses: number; draws: number }> {
    return this.http.get<{ wins: number; losses: number; draws: number }>(
      `${this.apiUrl}/progress/game-stats`,
      { headers: this.getHeaders() }
    );
  }

  getOpeningStats(): Observable<{ name: string; games: number; winRate: number }[]> {
    return this.http.get<{ name: string; games: number; winRate: number }[]>(
      `${this.apiUrl}/progress/openings`,
      { headers: this.getHeaders() }
    );
  }
}
