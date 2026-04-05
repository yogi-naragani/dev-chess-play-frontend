import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse, User } from '../models/user.model';

export interface Instructor {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  studentsCount: number;
  status: string;
  createdAt: string;
}

export interface Student {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  rating: number;
  puzzleRating: number;
  gamesPlayed: number;
  status: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  level: string;
  lessonCount: number;
  createdAt: string;
}

export interface MoveSequence {
  id: string;
  title: string;
  category: string;
  openingName: string;
  difficulty: string;
  moves: string[];
  tags: string[];
  createdAt: string;
}

export interface Puzzle {
  id: string;
  fen: string;
  solutionMoves: string[];
  rating: number;
  category: string;
  themes: string[];
  createdAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  format: string;
  timeControl: string;
  maxPlayers: number;
  currentPlayers: number;
  status: string;
  startDate: string;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  activeLessons: number;
  totalGames: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface AnalyticsData {
  totalUsers: number;
  totalGames: number;
  totalLessons: number;
  totalVideos: number;
  totalPuzzles: number;
  userDistribution: { students: number; instructors: number; admins: number };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_BASE_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_BASE_URL}/admin/dashboard`, {
      headers: this.getHeaders()
    });
  }

  // Instructors
  getInstructors(page = 1, limit = 10, search = ''): Observable<PaginatedResponse<Instructor>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PaginatedResponse<Instructor>>(`${this.API_BASE_URL}/admin/instructors`, {
      headers: this.getHeaders(),
      params
    });
  }

  getInstructor(id: string): Observable<Instructor> {
    return this.http.get<Instructor>(`${this.API_BASE_URL}/admin/instructors/${id}`, {
      headers: this.getHeaders()
    });
  }

  createInstructor(data: Partial<Instructor> & { password?: string }): Observable<Instructor> {
    return this.http.post<Instructor>(`${this.API_BASE_URL}/admin/instructors`, data, {
      headers: this.getHeaders()
    });
  }

  updateInstructor(id: string, data: Partial<Instructor>): Observable<Instructor> {
    return this.http.put<Instructor>(`${this.API_BASE_URL}/admin/instructors/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteInstructor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/admin/instructors/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Students
  getStudents(page = 1, limit = 10, search = '', sort = ''): Observable<PaginatedResponse<Student>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    if (sort) params = params.set('sort', sort);
    return this.http.get<PaginatedResponse<Student>>(`${this.API_BASE_URL}/admin/students`, {
      headers: this.getHeaders(),
      params
    });
  }

  getStudent(id: string): Observable<Student> {
    return this.http.get<Student>(`${this.API_BASE_URL}/admin/students/${id}`, {
      headers: this.getHeaders()
    });
  }

  createStudent(data: Partial<Student> & { password?: string }): Observable<Student> {
    return this.http.post<Student>(`${this.API_BASE_URL}/admin/students`, data, {
      headers: this.getHeaders()
    });
  }

  updateStudent(id: string, data: Partial<Student>): Observable<Student> {
    return this.http.put<Student>(`${this.API_BASE_URL}/admin/students/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/admin/students/${id}`, {
      headers: this.getHeaders()
    });
  }

  getStudentProgress(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_BASE_URL}/admin/students/${id}/progress`, {
      headers: this.getHeaders()
    });
  }

  // Courses
  getCourses(page = 1, limit = 10): Observable<PaginatedResponse<Course>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedResponse<Course>>(`${this.API_BASE_URL}/admin/courses`, {
      headers: this.getHeaders(),
      params
    });
  }

  getCourse(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.API_BASE_URL}/admin/courses/${id}`, {
      headers: this.getHeaders()
    });
  }

  createCourse(data: Partial<Course>): Observable<Course> {
    return this.http.post<Course>(`${this.API_BASE_URL}/admin/courses`, data, {
      headers: this.getHeaders()
    });
  }

  updateCourse(id: string, data: Partial<Course>): Observable<Course> {
    return this.http.put<Course>(`${this.API_BASE_URL}/admin/courses/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/admin/courses/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Move Sequences
  getMoveSequences(page = 1, limit = 10, category = '', difficulty = ''): Observable<PaginatedResponse<MoveSequence>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (category) params = params.set('category', category);
    if (difficulty) params = params.set('difficulty', difficulty);
    return this.http.get<PaginatedResponse<MoveSequence>>(`${this.API_BASE_URL}/admin/move-sequences`, {
      headers: this.getHeaders(),
      params
    });
  }

  getMoveSequence(id: string): Observable<MoveSequence> {
    return this.http.get<MoveSequence>(`${this.API_BASE_URL}/admin/move-sequences/${id}`, {
      headers: this.getHeaders()
    });
  }

  createMoveSequence(data: Partial<MoveSequence>): Observable<MoveSequence> {
    return this.http.post<MoveSequence>(`${this.API_BASE_URL}/admin/move-sequences`, data, {
      headers: this.getHeaders()
    });
  }

  updateMoveSequence(id: string, data: Partial<MoveSequence>): Observable<MoveSequence> {
    return this.http.put<MoveSequence>(`${this.API_BASE_URL}/admin/move-sequences/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteMoveSequence(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/admin/move-sequences/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Puzzles
  getPuzzles(page = 1, limit = 10, category = '', theme = ''): Observable<PaginatedResponse<Puzzle>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (category) params = params.set('category', category);
    if (theme) params = params.set('theme', theme);
    return this.http.get<PaginatedResponse<Puzzle>>(`${this.API_BASE_URL}/admin/puzzles`, {
      headers: this.getHeaders(),
      params
    });
  }

  getPuzzle(id: string): Observable<Puzzle> {
    return this.http.get<Puzzle>(`${this.API_BASE_URL}/admin/puzzles/${id}`, {
      headers: this.getHeaders()
    });
  }

  createPuzzle(data: Partial<Puzzle>): Observable<Puzzle> {
    return this.http.post<Puzzle>(`${this.API_BASE_URL}/admin/puzzles`, data, {
      headers: this.getHeaders()
    });
  }

  updatePuzzle(id: string, data: Partial<Puzzle>): Observable<Puzzle> {
    return this.http.put<Puzzle>(`${this.API_BASE_URL}/admin/puzzles/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deletePuzzle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/admin/puzzles/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Tournaments
  getTournaments(page = 1, limit = 10): Observable<PaginatedResponse<Tournament>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedResponse<Tournament>>(`${this.API_BASE_URL}/admin/tournaments`, {
      headers: this.getHeaders(),
      params
    });
  }

  getTournament(id: string): Observable<Tournament> {
    return this.http.get<Tournament>(`${this.API_BASE_URL}/admin/tournaments/${id}`, {
      headers: this.getHeaders()
    });
  }

  createTournament(data: Partial<Tournament>): Observable<Tournament> {
    return this.http.post<Tournament>(`${this.API_BASE_URL}/admin/tournaments`, data, {
      headers: this.getHeaders()
    });
  }

  updateTournament(id: string, data: Partial<Tournament>): Observable<Tournament> {
    return this.http.put<Tournament>(`${this.API_BASE_URL}/admin/tournaments/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteTournament(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/admin/tournaments/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Analytics
  getAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.API_BASE_URL}/admin/analytics`, {
      headers: this.getHeaders()
    });
  }
}
