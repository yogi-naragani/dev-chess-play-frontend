import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface InstructorStudent {
  id: string;
  name: string;
  username: string;
  rating: number;
  puzzleRating: number;
  lastActive: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-instructor-student-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './instructor-student-list.component.html',
  styleUrl: './instructor-student-list.component.css'
})
export class InstructorStudentListComponent implements OnInit {
  students: InstructorStudent[] = [];
  filteredStudents: InstructorStudent[] = [];
  loading = true;
  searchQuery = '';

  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading = true;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<{ students: InstructorStudent[] }>(`${this.API_URL}/instructor/students`, { headers }).subscribe({
      next: (res) => {
        this.students = res.students;
        this.filteredStudents = this.students;
        this.loading = false;
      },
      error: () => {
        this.students = [];
        this.filteredStudents = [];
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredStudents = this.students.filter(s =>
      s.name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q)
    );
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getLastActiveText(date: string): string {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
