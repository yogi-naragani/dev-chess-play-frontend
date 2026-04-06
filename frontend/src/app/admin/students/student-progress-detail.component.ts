import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../services/admin.service';

interface GameHistoryItem {
  id: string;
  opponent: string;
  result: string;
  ratingChange: number;
  date: string;
  opening: string;
}

interface LessonAttendance {
  id: string;
  lessonName: string;
  date: string;
  attended: boolean;
  score: number | null;
}

interface StudentProgress {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    rating: number;
    puzzleRating: number;
    gamesPlayed: number;
  };
  ratingHistory: { date: string; rating: number }[];
  gameHistory: GameHistoryItem[];
  lessonAttendance: LessonAttendance[];
  stats: {
    wins: number;
    losses: number;
    draws: number;
    averageAccuracy: number;
    puzzlesSolved: number;
    lessonsAttended: number;
  };
}

@Component({
  selector: 'app-student-progress-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-progress-detail.component.html',
  styleUrls: ['./student-progress-detail.component.css']
})
export class StudentProgressDetailComponent implements OnInit {
  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  studentId: string | null = null;
  loading = true;
  progress: StudentProgress | null = null;

  gameColumns: string[] = ['opponent', 'result', 'ratingChange', 'opening', 'date'];
  lessonColumns: string[] = ['lessonName', 'date', 'attended', 'score'];

  ratingCards: { title: string; value: string | number; icon: string; color: string }[] = [];

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('id');
    if (this.studentId) {
      this.loadProgress(this.studentId);
    }
  }

  loadProgress(id: string): void {
    this.loading = true;
    this.adminService.getStudentProgress(id).subscribe({
      next: (data: StudentProgress) => {
        this.progress = data;
        this.buildRatingCards();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  buildRatingCards(): void {
    if (!this.progress) return;
    const { student, stats } = this.progress;
    this.ratingCards = [
      { title: 'Game Rating', value: student.rating, icon: 'trending_up', color: '#1976d2' },
      { title: 'Puzzle Rating', value: student.puzzleRating, icon: 'extension', color: '#7b1fa2' },
      { title: 'Games Played', value: student.gamesPlayed, icon: 'sports_esports', color: '#388e3c' },
      { title: 'Win Rate', value: stats.wins + stats.losses + stats.draws > 0
          ? Math.round((stats.wins / (stats.wins + stats.losses + stats.draws)) * 100) + '%'
          : 'N/A', icon: 'emoji_events', color: '#f57c00' },
      { title: 'Puzzles Solved', value: stats.puzzlesSolved, icon: 'psychology', color: '#c62828' },
      { title: 'Lessons Attended', value: stats.lessonsAttended, icon: 'class', color: '#00838f' }
    ];
  }

  getRatingChangeClass(change: number): string {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  }

  formatRatingChange(change: number): string {
    return change > 0 ? `+${change}` : `${change}`;
  }

  goBack(): void {
    this.router.navigate(['/admin/students']);
  }
}
