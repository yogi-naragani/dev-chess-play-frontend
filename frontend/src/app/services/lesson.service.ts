import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  courseId: string;
  courseName?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  studentIds: string[];
  students?: { id: string; name: string }[];
  instructorId: string;
  gameRoomId?: string;
  meetingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonCreateRequest {
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  courseId: string;
  studentIds: string[];
}

export interface LessonListResponse {
  lessons: Lesson[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private readonly API_URL = `${environment.apiUrl}/lessons`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getLessons(status?: string): Observable<LessonListResponse> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<LessonListResponse>(this.API_URL, {
      headers: this.getHeaders(),
      params
    });
  }

  getLesson(id: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders()
    });
  }

  createLesson(lesson: LessonCreateRequest): Observable<Lesson> {
    return this.http.post<Lesson>(this.API_URL, lesson, {
      headers: this.getHeaders()
    });
  }

  updateLesson(id: string, lesson: Partial<LessonCreateRequest>): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.API_URL}/${id}`, lesson, {
      headers: this.getHeaders()
    });
  }

  deleteLesson(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders()
    });
  }

  startLesson(id: string): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.API_URL}/${id}/start`, {}, {
      headers: this.getHeaders()
    });
  }

  endLesson(id: string): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.API_URL}/${id}/end`, {}, {
      headers: this.getHeaders()
    });
  }

  getUpcomingLessons(): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.API_URL}/upcoming`, {
      headers: this.getHeaders()
    });
  }
}
