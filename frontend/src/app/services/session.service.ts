import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Session {
  id: number;
  instructorId: string;
  gameRoomId: string;
  meetingId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResponse {
  message: string;
  session: Session;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly API_BASE_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createSession(): Observable<SessionResponse> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<SessionResponse>(`${this.API_BASE_URL}/sessions`, {}, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getSession(sessionId: number): Observable<Session> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<Session>(`${this.API_BASE_URL}/sessions/${sessionId}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateSession(sessionId: number, updates: Partial<Session>): Observable<Session> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<Session>(`${this.API_BASE_URL}/sessions/${sessionId}`, updates, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  endSession(sessionId: number): Observable<any> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.API_BASE_URL}/sessions/${sessionId}/end`, {}, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    console.error('Session service error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
