import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { ChessBoardComponent } from '../../shared/chess-board/chess-board.component';
import { PuzzleService, DailyPuzzle, PuzzleAttempt } from '../../services/puzzle.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-puzzle-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    MatListModule, ChessBoardComponent
  ],
  templateUrl: './puzzle-dashboard.component.html',
  styleUrl: './puzzle-dashboard.component.css'
})
export class PuzzleDashboardComponent implements OnInit {
  dailyPuzzle: DailyPuzzle | null = null;
  recentAttempts: PuzzleAttempt[] = [];
  categories: string[] = [];
  puzzleRating = 0;
  loading = true;
  error = '';

  constructor(
    private puzzleService: PuzzleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.puzzleRating = user?.puzzleRating || 1200;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.puzzleService.getDailyPuzzle().subscribe({
      next: (dp) => {
        this.dailyPuzzle = dp;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.puzzleService.getMyAttempts(1, 5).subscribe({
      next: (res) => this.recentAttempts = res.data || [],
      error: () => {}
    });

    this.puzzleService.getCategories().subscribe({
      next: (cats) => this.categories = cats,
      error: () => {}
    });
  }
}
