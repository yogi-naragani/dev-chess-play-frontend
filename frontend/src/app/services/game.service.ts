import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { SocketService } from './socket.service';
import { environment } from '../../environments/environment';

export interface GameChallenge {
  id: string;
  challengerId: string;
  challengerName: string;
  timeControl: string;
  color: 'w' | 'b' | 'random';
}

export interface Game {
  id: string;
  whitePlayer: { id: string; username: string; rating: number };
  blackPlayer: { id: string; username: string; rating: number };
  status: 'waiting' | 'active' | 'completed' | 'aborted';
  result?: 'white' | 'black' | 'draw';
  fen: string;
  moves: string[];
  timeControl: string;
  whiteTime: number;
  blackTime: number;
  createdAt: string;
}

export interface OnlineStudent {
  id: string;
  username: string;
  rating: number;
  status: 'online' | 'in-game';
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getOnlineStudents(): Observable<OnlineStudent[]> {
    return this.http.get<OnlineStudent[]>(`${this.apiUrl}/games/online-students`, { headers: this.getHeaders() });
  }

  createGame(opponentId: string, timeControl: string, color: 'w' | 'b' | 'random'): Observable<Game> {
    return this.http.post<Game>(
      `${this.apiUrl}/games`,
      { opponentId, timeControl, color },
      { headers: this.getHeaders() }
    );
  }

  createComputerGame(difficulty: string, color: 'w' | 'b' | 'random'): Observable<Game> {
    return this.http.post<Game>(
      `${this.apiUrl}/games/computer`,
      { difficulty, color },
      { headers: this.getHeaders() }
    );
  }

  getGame(id: string): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/games/${id}`, { headers: this.getHeaders() });
  }

  getMyGames(status?: string, page: number = 1, limit: number = 10): Observable<{ data: Game[]; total: number }> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (status) params = params.set('status', status);
    return this.http.get<{ data: Game[]; total: number }>(
      `${this.apiUrl}/games/me`,
      { headers: this.getHeaders(), params }
    );
  }

  makeMove(gameId: string, from: string, to: string, promotion?: string): Observable<{ fen: string; status: string }> {
    return this.http.post<{ fen: string; status: string }>(
      `${this.apiUrl}/games/${gameId}/move`,
      { from, to, promotion },
      { headers: this.getHeaders() }
    );
  }

  resign(gameId: string): Observable<{ result: string }> {
    return this.http.post<{ result: string }>(
      `${this.apiUrl}/games/${gameId}/resign`,
      {},
      { headers: this.getHeaders() }
    );
  }

  offerDraw(gameId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/games/${gameId}/draw`,
      {},
      { headers: this.getHeaders() }
    );
  }

  joinQueue(timeControl: string): Observable<{ message: string; gameId?: string }> {
    return this.http.post<{ message: string; gameId?: string }>(
      `${this.apiUrl}/games/queue`,
      { timeControl },
      { headers: this.getHeaders() }
    );
  }

  leaveQueue(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/games/queue`,
      { headers: this.getHeaders() }
    );
  }

  challengeStudent(studentId: string, timeControl: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/games/challenge`,
      { studentId, timeControl },
      { headers: this.getHeaders() }
    );
  }
}
