import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LessonService, Lesson } from '../../services/lesson.service';
import { ChessBoardComponent } from '../../shared/chess-board/chess-board.component';

interface MoveEntry {
  number: number;
  white: string;
  black?: string;
}

@Component({
  selector: 'app-live-lesson',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    RouterModule,
    ChessBoardComponent
  ],
  templateUrl: './live-lesson.component.html',
  styleUrl: './live-lesson.component.css'
})
export class LiveLessonComponent implements OnInit, OnDestroy {
  @ViewChild(ChessBoardComponent) chessBoard!: ChessBoardComponent;

  lesson: Lesson | null = null;
  loading = true;
  lessonId: string = '';
  moves: MoveEntry[] = [];
  moveCount = 0;
  currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  connectedStudents: { id: string; name: string; online: boolean }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.lessonId = this.route.snapshot.paramMap.get('id') || '';
    if (this.lessonId) {
      this.loadLesson();
    }
  }

  ngOnDestroy(): void {
    // Cleanup socket connections would go here
  }

  loadLesson(): void {
    this.loading = true;
    this.lessonService.getLesson(this.lessonId).subscribe({
      next: (lesson) => {
        this.lesson = lesson;
        this.connectedStudents = (lesson.students || []).map(s => ({
          ...s,
          online: Math.random() > 0.3
        }));
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load lesson', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onMoveMade(event: { from: string; to: string; san: string; fen: string }): void {
    this.currentFen = event.fen;
    this.moveCount++;

    if (this.moveCount % 2 === 1) {
      this.moves.push({ number: Math.ceil(this.moveCount / 2), white: event.san });
    } else {
      const lastMove = this.moves[this.moves.length - 1];
      if (lastMove) {
        lastMove.black = event.san;
      }
    }
  }

  undoMove(): void {
    if (this.chessBoard) {
      this.chessBoard.undoMove();
      this.moveCount = Math.max(0, this.moveCount - 1);
      if (this.moveCount % 2 === 0 && this.moves.length > 0) {
        this.moves.pop();
      } else if (this.moves.length > 0) {
        this.moves[this.moves.length - 1].black = undefined;
      }
    }
  }

  resetBoard(): void {
    if (this.chessBoard) {
      this.chessBoard.resetBoard();
      this.moves = [];
      this.moveCount = 0;
      this.currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
  }

  endLesson(): void {
    if (confirm('End this lesson?')) {
      this.lessonService.endLesson(this.lessonId).subscribe({
        next: () => {
          this.snackBar.open('Lesson ended', 'Close', { duration: 3000 });
          this.router.navigate(['/instructor/lessons']);
        },
        error: () => {
          this.snackBar.open('Failed to end lesson', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
