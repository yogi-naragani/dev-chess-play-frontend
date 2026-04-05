import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProgressService, StudentProgress } from '../../services/progress.service';

@Component({
  selector: 'app-my-progress',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatListModule,
    MatProgressBarModule
  ],
  templateUrl: './my-progress.component.html',
  styleUrl: './my-progress.component.css'
})
export class MyProgressComponent implements OnInit {
  progress: StudentProgress | null = null;
  loading = true;
  error = '';

  constructor(private progressService: ProgressService) {}

  ngOnInit(): void {
    this.loadProgress();
  }

  loadProgress(): void {
    this.loading = true;
    this.progressService.getMyProgress().subscribe({
      next: (p) => {
        this.progress = p;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load progress data';
        this.loading = false;
      }
    });
  }

  get winRate(): number {
    if (!this.progress || this.progress.gamesPlayed === 0) return 0;
    return Math.round((this.progress.wins / this.progress.gamesPlayed) * 100);
  }

  get totalGames(): number {
    return this.progress?.gamesPlayed || 0;
  }
}
