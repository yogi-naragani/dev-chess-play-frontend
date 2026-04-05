import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LessonService, Lesson } from '../../services/lesson.service';

@Component({
  selector: 'app-lesson-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './lesson-list.component.html',
  styleUrl: './lesson-list.component.css'
})
export class LessonListComponent implements OnInit {
  displayedColumns = ['title', 'date', 'status', 'students', 'actions'];
  lessons: Lesson[] = [];
  filteredLessons: Lesson[] = [];
  loading = true;
  statusFilter = '';

  constructor(private lessonService: LessonService) {}

  ngOnInit(): void {
    this.loadLessons();
  }

  loadLessons(): void {
    this.loading = true;
    this.lessonService.getLessons(this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.lessons = res.lessons;
        this.filteredLessons = this.lessons;
        this.loading = false;
      },
      error: () => {
        this.lessons = [];
        this.filteredLessons = [];
        this.loading = false;
      }
    });
  }

  onStatusFilterChange(): void {
    if (this.statusFilter) {
      this.filteredLessons = this.lessons.filter(l => l.status === this.statusFilter);
    } else {
      this.filteredLessons = this.lessons;
    }
  }

  startLesson(lesson: Lesson): void {
    this.lessonService.startLesson(lesson.id).subscribe({
      next: () => this.loadLessons(),
      error: () => {}
    });
  }

  deleteLesson(lesson: Lesson): void {
    if (confirm(`Delete lesson "${lesson.title}"?`)) {
      this.lessonService.deleteLesson(lesson.id).subscribe({
        next: () => this.loadLessons(),
        error: () => {}
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'in_progress': return 'accent';
      case 'completed': return 'warn';
      default: return '';
    }
  }
}
