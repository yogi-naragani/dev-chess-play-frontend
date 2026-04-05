import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ChessBoardComponent } from '../../../shared/chess-board/chess-board.component';
import { StockfishService } from '../../../services/stockfish.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-computer-game',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatButtonToggleModule,
    ChessBoardComponent
  ],
  templateUrl: './computer-game.component.html',
  styleUrl: './computer-game.component.css'
})
export class ComputerGameComponent implements OnInit, OnDestroy {
  @ViewChild(ChessBoardComponent) board!: ChessBoardComponent;

  difficulty = 'intermediate';
  playerColor: 'w' | 'b' = 'w';
  colorChoice: 'w' | 'b' | 'random' = 'w';
  difficulties = ['beginner', 'intermediate', 'advanced', 'master'];
  gameStarted = false;
  currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  moveHistory: string[] = [];
  thinking = false;
  stockfishReady = false;
  gameOver = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private stockfishService: StockfishService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initStockfish();
  }

  async initStockfish(): Promise<void> {
    try {
      await this.stockfishService.init();
      this.stockfishReady = true;

      const bestMoveSub = this.stockfishService.bestMove$.subscribe(bestMove => {
        if (this.thinking && this.board) {
          this.thinking = false;
          // Parse UCI move format (e.g., "e2e4")
          const from = bestMove.substring(0, 2);
          const to = bestMove.substring(2, 4);
          const promotion = bestMove.length > 4 ? bestMove[4] : undefined;

          try {
            const move = this.board.chess.move({ from: from as any, to: to as any, promotion: promotion as any });
            if (move) {
              this.moveHistory.push(move.san);
              this.currentFen = this.board.chess.fen();
              this.board.loadFen(this.currentFen);
              this.checkGameEnd();
            }
          } catch {
            console.error('Stockfish returned invalid move:', bestMove);
          }
        }
      });
      this.subscriptions.push(bestMoveSub);
    } catch {
      this.snackBar.open('Failed to initialize chess engine', 'Close', { duration: 5000 });
    }
  }

  startGame(): void {
    if (this.colorChoice === 'random') {
      this.playerColor = Math.random() > 0.5 ? 'w' : 'b';
    } else {
      this.playerColor = this.colorChoice;
    }

    this.currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.moveHistory = [];
    this.gameOver = false;
    this.gameStarted = true;

    // If player is black, make engine's first move
    if (this.playerColor === 'b') {
      this.makeEngineMove();
    }
  }

  onMoveMade(event: { from: string; to: string; san: string; fen: string }): void {
    if (this.gameOver) return;
    this.moveHistory.push(event.san);
    this.currentFen = event.fen;

    if (!this.checkGameEnd()) {
      this.makeEngineMove();
    }
  }

  makeEngineMove(): void {
    if (!this.stockfishReady || this.gameOver) return;
    this.thinking = true;
    this.stockfishService.getBestMove(this.currentFen, this.difficulty);
  }

  getHint(): void {
    if (!this.stockfishReady || this.gameOver) return;
    this.stockfishService.getHint(this.currentFen);
    this.snackBar.open('Calculating best move...', '', { duration: 2000 });
  }

  checkGameEnd(): boolean {
    if (!this.board) return false;
    const chess = this.board.chess;
    if (chess.isCheckmate() || chess.isDraw() || chess.isStalemate()) {
      this.gameOver = true;
      return true;
    }
    return false;
  }

  newGame(): void {
    this.gameStarted = false;
    this.gameOver = false;
    this.moveHistory = [];
    this.currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.stockfishService.destroy();
  }
}
