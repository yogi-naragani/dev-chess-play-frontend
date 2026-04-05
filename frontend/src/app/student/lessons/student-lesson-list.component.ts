import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { LessonService, Lesson } from '../../services/lesson.service';

@Component({
  selector: 'app-student-lesson-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatTableModule
  ],
  templateUrl: './student-lesson-list.component.html',
  styleUrl: './student-lesson-list.component.css'
})
export class StudentLessonListComponent implements OnInit {
  lessons: Lesson[] = [];
  loading = true;
  error = '';
  displayedColumns = ['title', 'instructor', 'date', 'status', 'actions'];

  constructor(private lessonService: LessonService) {}

  ngOnInit(): void {
    this.loadLessons();
  }

  loadLessons(): void {
    this.loading = true;
    this.lessonService.getLessons().subscribe({
      next: (res) => {
        this.lessons = res.lessons || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load lessons';
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'in_progress': return 'accent';
      case 'completed': return 'default';
      case 'cancelled': return 'warn';
      default: return 'default';
    }
  }

  isLive(lesson: Lesson): boolean {
    return lesson.status === 'in_progress';
  }
}
