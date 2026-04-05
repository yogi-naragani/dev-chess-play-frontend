import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MoveSequence {
  id: string;
  title: string;
  description: string;
  opening: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  moves: { fen: string; san: string; annotation?: string }[];
  createdBy: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovesService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getMoveSequences(params?: { search?: string; category?: string; difficulty?: string; page?: number; limit?: number }): Observable<{ data: MoveSequence[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.difficulty) httpParams = httpParams.set('difficulty', params.difficulty);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<{ data: MoveSequence[]; total: number }>(
      `${this.apiUrl}/moves`,
      { headers: this.getHeaders(), params: httpParams }
    );
  }

  getMoveSequence(id: string): Observable<MoveSequence> {
    return this.http.get<MoveSequence>(`${this.apiUrl}/moves/${id}`, { headers: this.getHeaders() });
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/moves/categories`, { headers: this.getHeaders() });
  }
}
