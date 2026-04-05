import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChessBoardComponent } from '../../shared/chess-board/chess-board.component';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-move-sequence-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ChessBoardComponent
  ],
  templateUrl: './move-sequence-editor.component.html',
  styleUrls: ['./move-sequence-editor.component.css']
})
export class MoveSequenceEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  isEditMode = false;
  sequenceId: string | null = null;
  loading = false;
  saving = false;

  moves: string[] = [];
  currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  tagInput = '';

  categories = ['Opening', 'Middlegame', 'Endgame', 'Tactics', 'Strategy'];
  difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Master'];
  tags: string[] = [];

  ngOnInit(): void {
    this.sequenceId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.sequenceId;

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      openingName: [''],
      difficulty: ['', Validators.required]
    });

    if (this.isEditMode && this.sequenceId) {
      this.loadSequence(this.sequenceId);
    }
  }

  loadSequence(id: string): void {
    this.loading = true;
    this.adminService.getMoveSequence(id).subscribe({
      next: (seq) => {
        this.form.patchValue({
          title: seq.title,
          category: seq.category,
          openingName: seq.openingName,
          difficulty: seq.difficulty
        });
        this.moves = seq.moves || [];
        this.tags = seq.tags || [];
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load move sequence', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onMoveMade(event: { from: string; to: string; san: string; fen: string }): void {
    this.moves.push(event.san);
    this.currentFen = event.fen;
  }

  removeLastMove(): void {
    if (this.moves.length > 0) {
      this.moves.pop();
    }
  }

  clearMoves(): void {
    this.moves = [];
    this.currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  addTag(): void {
    const tag = this.tagInput.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.tagInput = '';
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const data = {
      ...this.form.value,
      moves: this.moves,
      tags: this.tags
    };

    if (this.isEditMode && this.sequenceId) {
      this.adminService.updateMoveSequence(this.sequenceId, data).subscribe({
        next: () => {
          this.snackBar.open('Move sequence updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/moves']);
        },
        error: () => {
          this.snackBar.open('Failed to update move sequence', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    } else {
      this.adminService.createMoveSequence(data).subscribe({
        next: () => {
          this.snackBar.open('Move sequence created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/moves']);
        },
        error: () => {
          this.snackBar.open('Failed to create move sequence', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/moves']);
  }
}
