import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Homework {
  id: string;
  title: string;
  description: string;
  type: 'solve_position' | 'watch_video' | 'review_game';
  data: {
    fen?: string;
    videoId?: string;
    gameId?: string;
    expectedMoves?: string[];
  };
  dueDate: string;
  assignedStudentIds: string[];
  assignedStudents?: { id: string; name: string }[];
  instructorId: string;
  submissionsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkCreateRequest {
  title: string;
  description: string;
  type: 'solve_position' | 'watch_video' | 'review_game';
  data: Record<string, any>;
  dueDate: string;
  assignedStudentIds: string[];
}

export interface Submission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  answer: any;
  grade?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface HomeworkListResponse {
  assignments: Homework[];
  total: number;
}

export interface SubmissionListResponse {
  submissions: Submission[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class HomeworkService {
  private readonly API_URL = `${environment.apiUrl}/homework`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAssignments(): Observable<HomeworkListResponse> {
    return this.http.get<HomeworkListResponse>(this.API_URL, {
      headers: this.getHeaders()
    });
  }

  getAssignment(id: string): Observable<Homework> {
    return this.http.get<Homework>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders()
    });
  }

  createAssignment(homework: HomeworkCreateRequest): Observable<Homework> {
    return this.http.post<Homework>(this.API_URL, homework, {
      headers: this.getHeaders()
    });
  }

  updateAssignment(id: string, homework: Partial<HomeworkCreateRequest>): Observable<Homework> {
    return this.http.put<Homework>(`${this.API_URL}/${id}`, homework, {
      headers: this.getHeaders()
    });
  }

  deleteAssignment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders()
    });
  }

  getSubmissions(homeworkId: string): Observable<SubmissionListResponse> {
    return this.http.get<SubmissionListResponse>(`${this.API_URL}/${homeworkId}/submissions`, {
      headers: this.getHeaders()
    });
  }

  gradeSubmission(homeworkId: string, submissionId: string, grade: number, feedback: string): Observable<Submission> {
    return this.http.put<Submission>(
      `${this.API_URL}/${homeworkId}/submissions/${submissionId}/grade`,
      { grade, feedback },
      { headers: this.getHeaders() }
    );
  }
}
