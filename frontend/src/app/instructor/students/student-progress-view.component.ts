import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface StudentDetail {
  id: string;
  name: string;
  username: string;
  currentRating: number;
  puzzleRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  lessonsAttended: number;
  accuracy: number;
  ratingHistory: { date: string; rating: number }[];
  recentGames: { id: string; opponent: string; result: string; date: string; opening: string }[];
  lessonHistory: { id: string; title: string; date: string; attended: boolean }[];
}

@Component({
  selector: 'app-student-progress-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    RouterModule
  ],
  templateUrl: './student-progress-view.component.html',
  styleUrl: './student-progress-view.component.css'
})
export class StudentProgressViewComponent implements OnInit {
  studentId: string = '';
  student: StudentDetail | null = null;
  loading = true;
  gameColumns = ['opponent', 'result', 'opening', 'date'];
  lessonColumns = ['title', 'date', 'attended'];

  private readonly API_URL = 'http://localhost:3000/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    if (this.studentId) {
      this.loadStudent();
    }
  }

  loadStudent(): void {
    this.loading = true;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<StudentDetail>(`${this.API_URL}/instructor/students/${this.studentId}/progress`, { headers }).subscribe({
      next: (data) => {
        this.student = data;
        this.loading = false;
      },
      error: () => {
        this.student = null;
        this.loading = false;
      }
    });
  }

  getWinRate(): number {
    if (!this.student || this.student.gamesPlayed === 0) return 0;
    return Math.round((this.student.wins / this.student.gamesPlayed) * 100);
  }

  getResultColor(result: string): string {
    switch (result) {
      case 'win': return '#4caf50';
      case 'loss': return '#f44336';
      case 'draw': return '#ff9800';
      default: return '#999';
    }
  }
}
