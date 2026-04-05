import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService, DashboardStats, ActivityItem } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  loading = true;
  stats: DashboardStats = {
    totalStudents: 0,
    totalInstructors: 0,
    activeLessons: 0,
    totalGames: 0,
    recentActivity: []
  };

  statCards = [
    { title: 'Total Students', value: 0, icon: 'school', color: '#1976d2' },
    { title: 'Instructors', value: 0, icon: 'person', color: '#388e3c' },
    { title: 'Active Lessons', value: 0, icon: 'class', color: '#f57c00' },
    { title: 'Games Played', value: 0, icon: 'sports_esports', color: '#7b1fa2' }
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.statCards[0].value = data.totalStudents;
        this.statCards[1].value = data.totalInstructors;
        this.statCards[2].value = data.activeLessons;
        this.statCards[3].value = data.totalGames;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'game': 'sports_esports',
      'lesson': 'class',
      'user': 'person',
      'tournament': 'emoji_events',
      'course': 'library_books',
      'puzzle': 'extension'
    };
    return icons[type] || 'info';
  }
}
