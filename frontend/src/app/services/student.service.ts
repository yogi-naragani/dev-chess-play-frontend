import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActiveSession {
  id: string;
  instructorId: string;
  instructor: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  gameRoomId: string;
  meetingId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSessionsResponse {
  message: string;
  sessions: ActiveSession[];
}

export interface JoinLessonRequest {
  gameRoomId: string;
  meetingId: string;
}

export interface JoinLessonResponse {
  message: string;
  lessonId?: string;
  gameRoomId: string;
  meetingId: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getActiveSessions(): Observable<ActiveSessionsResponse> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ActiveSessionsResponse>(`${this.apiUrl}/sessions/active`, { headers });
  }

  joinLesson(gameRoomId: string, meetingId: string): Observable<JoinLessonResponse> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const body: JoinLessonRequest = {
      gameRoomId,
      meetingId
    };

    return this.http.post<JoinLessonResponse>(`${this.apiUrl}/students/join-lesson`, body, { headers });
  }

  // Future methods for student-specific functionality
  getStudentLessons(): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/students/lessons`, { headers });
  }

  leaveLesson(lessonId: string): Observable<any> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/students/leave-lesson`, { lessonId }, { headers });
  }
}
