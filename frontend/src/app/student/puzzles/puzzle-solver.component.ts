import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ChessBoardComponent } from '../../shared/chess-board/chess-board.component';
import { PuzzleService, Puzzle, PuzzleSolveResult } from '../../services/puzzle.service';

@Component({
  selector: 'app-puzzle-solver',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatChipsModule, ChessBoardComponent
  ],
  templateUrl: './puzzle-solver.component.html',
  styleUrl: './puzzle-solver.component.css'
})
export class PuzzleSolverComponent implements OnInit, OnDestroy {
  @ViewChild(ChessBoardComponent) board!: ChessBoardComponent;

  puzzle: Puzzle | null = null;
  loading = true;
  error = '';
  playerMoves: string[] = [];
  timerSeconds = 0;
  timerInterval: any;
  solved = false;
  failed = false;
  result: PuzzleSolveResult | null = null;
  hintText = '';
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private puzzleService: PuzzleService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPuzzle(id);
    }
  }

  loadPuzzle(id: string): void {
    this.loading = true;
    this.puzzleService.getPuzzle(id).subscribe({
      next: (puzzle) => {
        this.puzzle = puzzle;
        this.loading = false;
        this.startTimer();
      },
      error: () => {
        this.error = 'Failed to load puzzle';
        this.loading = false;
      }
    });
  }

  startTimer(): void {
    this.timerSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  onMoveMade(event: { from: string; to: string; san: string; fen: string }): void {
    if (this.solved || this.failed) return;
    this.playerMoves.push(event.san);
  }

  submitSolution(): void {
    if (!this.puzzle || this.playerMoves.length === 0) return;
    this.submitting = true;
    this.stopTimer();

    this.puzzleService.submitSolution(this.puzzle.id, this.playerMoves, this.timerSeconds).subscribe({
      next: (res) => {
        this.result = res;
        this.submitting = false;
        if (res.correct) {
          this.solved = true;
          this.snackBar.open('Correct! Well done!', 'Close', { duration: 3000 });
        } else {
          this.failed = true;
          this.snackBar.open('Incorrect. Try again!', 'Close', { duration: 3000 });
        }
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Failed to submit solution', 'Close', { duration: 3000 });
      }
    });
  }

  requestHint(): void {
    if (!this.puzzle) return;
    this.puzzleService.requestHint(this.puzzle.id, this.playerMoves.length).subscribe({
      next: (res) => {
        this.hintText = res.hint;
        this.snackBar.open(`Hint: ${res.hint}`, 'Close', { duration: 5000 });
      },
      error: () => {
        this.snackBar.open('No hints available', 'Close', { duration: 3000 });
      }
    });
  }

  resetPuzzle(): void {
    this.playerMoves = [];
    this.solved = false;
    this.failed = false;
    this.result = null;
    this.hintText = '';
    this.startTimer();
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
