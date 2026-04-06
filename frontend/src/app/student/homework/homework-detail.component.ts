import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ChessBoardComponent } from '../../shared/chess-board/chess-board.component';
import { HomeworkService, Homework } from '../../services/homework.service';

@Component({
  selector: 'app-homework-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    MatInputModule, MatFormFieldModule, MatSnackBarModule,
    ChessBoardComponent
  ],
  templateUrl: './homework-detail.component.html',
  styleUrl: './homework-detail.component.css'
})
export class HomeworkDetailComponent implements OnInit {
  homework: Homework | null = null;
  loading = true;
  error = '';
  answer = '';
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private homeworkService: HomeworkService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadHomework(id);
    }
  }

  loadHomework(id: string): void {
    this.loading = true;
    this.homeworkService.getAssignment(id).subscribe({
      next: (hw) => {
        this.homework = hw;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load assignment';
        this.loading = false;
      }
    });
  }

  submitAnswer(): void {
    if (!this.homework || !this.answer.trim()) return;
    this.submitting = true;
    // The submission would go through homework service
    // For now, show a success message
    setTimeout(() => {
      this.submitting = false;
      this.snackBar.open('Answer submitted successfully!', 'Close', { duration: 3000 });
    }, 1000);
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'solve_position': return 'Solve Position';
      case 'watch_video': return 'Watch Video';
      case 'review_game': return 'Review Game';
      default: return type;
    }
  }
}
