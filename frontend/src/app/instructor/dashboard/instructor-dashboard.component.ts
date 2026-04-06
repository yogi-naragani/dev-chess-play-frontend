import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { LessonService, Lesson } from '../../services/lesson.service';
import { HomeworkService } from '../../services/homework.service';

interface DashboardStats {
  studentCount: number;
  upcomingLessons: number;
  pendingHomework: number;
}

interface Activity {
  icon: string;
  text: string;
  time: string;
}

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    RouterModule
  ],
  templateUrl: './instructor-dashboard.component.html',
  styleUrl: './instructor-dashboard.component.css'
})
export class InstructorDashboardComponent implements OnInit {
  loading = true;
  stats: DashboardStats = { studentCount: 0, upcomingLessons: 0, pendingHomework: 0 };
  upcomingLessons: Lesson[] = [];
  recentActivity: Activity[] = [];

  constructor(
    private lessonService: LessonService,
    private homeworkService: HomeworkService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    this.lessonService.getUpcomingLessons().subscribe({
      next: (lessons) => {
        this.upcomingLessons = lessons.slice(0, 5);
        this.stats.upcomingLessons = lessons.length;
        this.loading = false;
      },
      error: () => {
        this.upcomingLessons = [];
        this.loading = false;
      }
    });

    this.homeworkService.getAssignments().subscribe({
      next: (res) => {
        this.stats.pendingHomework = res.assignments.filter(a => {
          const due = new Date(a.dueDate);
          return due >= new Date();
        }).length;
      },
      error: () => {}
    });

    // Placeholder stats
    this.stats.studentCount = 12;
    this.recentActivity = [
      { icon: 'school', text: 'Lesson "Opening Principles" completed', time: '2 hours ago' },
      { icon: 'assignment', text: 'New homework submission from Alex', time: '3 hours ago' },
      { icon: 'person_add', text: 'New student Maria joined your class', time: '1 day ago' },
      { icon: 'videocam', text: 'Video "Endgame Tactics" uploaded', time: '2 days ago' }
    ];
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
