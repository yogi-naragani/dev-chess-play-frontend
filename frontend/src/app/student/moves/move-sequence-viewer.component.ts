import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChessBoardComponent } from '../../shared/chess-board/chess-board.component';
import { MovesService, MoveSequence } from '../../services/moves.service';

@Component({
  selector: 'app-move-sequence-viewer',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatListModule, MatProgressSpinnerModule,
    ChessBoardComponent
  ],
  templateUrl: './move-sequence-viewer.component.html',
  styleUrl: './move-sequence-viewer.component.css'
})
export class MoveSequenceViewerComponent implements OnInit {
  @ViewChild(ChessBoardComponent) board!: ChessBoardComponent;

  sequence: MoveSequence | null = null;
  loading = true;
  error = '';
  currentMoveIndex = -1;

  constructor(
    private route: ActivatedRoute,
    private movesService: MovesService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSequence(id);
    }
  }

  loadSequence(id: string): void {
    this.loading = true;
    this.movesService.getMoveSequence(id).subscribe({
      next: (seq) => {
        this.sequence = seq;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load move sequence';
        this.loading = false;
      }
    });
  }

  get currentFen(): string {
    if (!this.sequence || this.currentMoveIndex < 0) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    return this.sequence.moves[this.currentMoveIndex]?.fen ||
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  goToStart(): void {
    this.currentMoveIndex = -1;
  }

  goBack(): void {
    if (this.currentMoveIndex >= 0) {
      this.currentMoveIndex--;
    }
  }

  goForward(): void {
    if (this.sequence && this.currentMoveIndex < this.sequence.moves.length - 1) {
      this.currentMoveIndex++;
    }
  }

  goToEnd(): void {
    if (this.sequence) {
      this.currentMoveIndex = this.sequence.moves.length - 1;
    }
  }

  goToMove(index: number): void {
    this.currentMoveIndex = index;
  }

  get canGoBack(): boolean {
    return this.currentMoveIndex >= 0;
  }

  get canGoForward(): boolean {
    return !!this.sequence && this.currentMoveIndex < this.sequence.moves.length - 1;
  }
}
