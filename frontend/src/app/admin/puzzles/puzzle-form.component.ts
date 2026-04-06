import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChessBoardComponent } from '../../shared/chess-board/chess-board.component';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-puzzle-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ChessBoardComponent
  ],
  templateUrl: './puzzle-form.component.html',
  styleUrls: ['./puzzle-form.component.css']
})
export class PuzzleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  isEditMode = false;
  puzzleId: string | null = null;
  loading = false;
  saving = false;

  previewFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  solutionMovesInput = '';
  selectedThemes: string[] = [];

  categories = ['Tactics', 'Endgame', 'Opening', 'Middlegame'];
  allThemes = ['Fork', 'Pin', 'Skewer', 'Discovery', 'Mate in 1', 'Mate in 2', 'Mate in 3',
    'Sacrifice', 'Deflection', 'Zugzwang', 'Interference', 'Back Rank', 'Trapped Piece',
    'Promotion', 'Clearance', 'Overloaded Piece', 'X-Ray'];

  ngOnInit(): void {
    this.puzzleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.puzzleId;

    this.form = this.fb.group({
      fen: ['', Validators.required],
      category: ['', Validators.required],
      rating: [1200, [Validators.required, Validators.min(100), Validators.max(3000)]]
    });

    this.form.get('fen')?.valueChanges.subscribe((fen: string) => {
      if (fen && fen.trim()) {
        this.previewFen = fen.trim();
      }
    });

    if (this.isEditMode && this.puzzleId) {
      this.loadPuzzle(this.puzzleId);
    }
  }

  loadPuzzle(id: string): void {
    this.loading = true;
    this.adminService.getPuzzle(id).subscribe({
      next: (puzzle) => {
        this.form.patchValue({
          fen: puzzle.fen,
          category: puzzle.category,
          rating: puzzle.rating
        });
        this.previewFen = puzzle.fen;
        this.solutionMovesInput = puzzle.solutionMoves?.join(' ') || '';
        this.selectedThemes = puzzle.themes || [];
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load puzzle', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  toggleTheme(theme: string): void {
    const index = this.selectedThemes.indexOf(theme);
    if (index >= 0) {
      this.selectedThemes.splice(index, 1);
    } else {
      this.selectedThemes.push(theme);
    }
  }

  isThemeSelected(theme: string): boolean {
    return this.selectedThemes.includes(theme);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const solutionMoves = this.solutionMovesInput.trim().split(/\s+/).filter(m => m.length > 0);
    const data = {
      ...this.form.value,
      solutionMoves,
      themes: this.selectedThemes
    };

    if (this.isEditMode && this.puzzleId) {
      this.adminService.updatePuzzle(this.puzzleId, data).subscribe({
        next: () => {
          this.snackBar.open('Puzzle updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/puzzles']);
        },
        error: () => {
          this.snackBar.open('Failed to update puzzle', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    } else {
      this.adminService.createPuzzle(data).subscribe({
        next: () => {
          this.snackBar.open('Puzzle created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/puzzles']);
        },
        error: () => {
          this.snackBar.open('Failed to create puzzle', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/puzzles']);
  }
}
