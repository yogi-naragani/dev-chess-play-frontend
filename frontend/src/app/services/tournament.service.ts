import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  format: 'swiss' | 'round-robin' | 'elimination';
  status: 'upcoming' | 'active' | 'completed';
  timeControl: string;
  maxPlayers: number;
  currentPlayers: number;
  startDate: string;
  endDate: string;
  createdBy: string;
}

export interface TournamentStanding {
  rank: number;
  playerId: string;
  playerName: string;
  rating: number;
  score: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface TournamentPairing {
  round: number;
  board: number;
  whitePlayer: { id: string; name: string; rating: number };
  blackPlayer: { id: string; name: string; rating: number };
  result?: string;
  gameId?: string;
}

export interface TournamentDetail extends Tournament {
  standings: TournamentStanding[];
  pairings: TournamentPairing[];
  isRegistered: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTournaments(status?: string): Observable<Tournament[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Tournament[]>(
      `${this.apiUrl}/tournaments`,
      { headers: this.getHeaders(), params }
    );
  }

  getTournament(id: string): Observable<TournamentDetail> {
    return this.http.get<TournamentDetail>(
      `${this.apiUrl}/tournaments/${id}`,
      { headers: this.getHeaders() }
    );
  }

  joinTournament(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/tournaments/${id}/join`,
      {},
      { headers: this.getHeaders() }
    );
  }

  leaveTournament(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/tournaments/${id}/leave`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getMyTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(
      `${this.apiUrl}/tournaments/me`,
      { headers: this.getHeaders() }
    );
  }
}
