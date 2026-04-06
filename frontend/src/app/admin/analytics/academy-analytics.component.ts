import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService, AnalyticsData } from '../../services/admin.service';

@Component({
  selector: 'app-academy-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './academy-analytics.component.html',
  styleUrls: ['./academy-analytics.component.css']
})
export class AcademyAnalyticsComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = true;
  analytics: AnalyticsData | null = null;

  statCards: { title: string; value: number; icon: string; color: string }[] = [];

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.adminService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.buildStatCards(data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  buildStatCards(data: AnalyticsData): void {
    this.statCards = [
      { title: 'Total Users', value: data.totalUsers, icon: 'people', color: '#1976d2' },
      { title: 'Total Games', value: data.totalGames, icon: 'sports_esports', color: '#388e3c' },
      { title: 'Total Lessons', value: data.totalLessons, icon: 'class', color: '#f57c00' },
      { title: 'Total Videos', value: data.totalVideos, icon: 'video_library', color: '#7b1fa2' },
      { title: 'Total Puzzles', value: data.totalPuzzles, icon: 'extension', color: '#c62828' }
    ];
  }

  getDistributionPercent(value: number): number {
    if (!this.analytics) return 0;
    const total = this.analytics.userDistribution.students +
                  this.analytics.userDistribution.instructors +
                  this.analytics.userDistribution.admins;
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
