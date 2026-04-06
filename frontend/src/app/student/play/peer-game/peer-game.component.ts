import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ChessBoardComponent } from '../../../shared/chess-board/chess-board.component';
import { GameService, Game } from '../../../services/game.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-peer-game',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatListModule,
    MatInputModule, MatFormFieldModule, MatSnackBarModule,
    MatDialogModule, ChessBoardComponent
  ],
  templateUrl: './peer-game.component.html',
  styleUrl: './peer-game.component.css'
})
export class PeerGameComponent implements OnInit, OnDestroy {
  @ViewChild(ChessBoardComponent) board!: ChessBoardComponent;

  game: Game | null = null;
  loading = true;
  error = '';
  playerColor: 'w' | 'b' = 'w';
  moveHistory: string[] = [];
  chatMessages: { sender: string; text: string; time: Date }[] = [];
  newMessage = '';
  whiteTime = 600;
  blackTime = 600;
  clockInterval: any;
  gameOver = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadGame(id);
    }
  }

  loadGame(id: string): void {
    this.loading = true;
    this.gameService.getGame(id).subscribe({
      next: (game) => {
        this.game = game;
        this.whiteTime = game.whiteTime;
        this.blackTime = game.blackTime;
        this.moveHistory = game.moves || [];
        const user = this.authService.getCurrentUser();
        this.playerColor = game.whitePlayer.id === user?.id ? 'w' : 'b';
        this.loading = false;
        if (game.status === 'active') {
          this.startClock();
        }
        if (game.status === 'completed') {
          this.gameOver = true;
        }
      },
      error: () => {
        this.error = 'Failed to load game';
        this.loading = false;
      }
    });
  }

  startClock(): void {
    this.clockInterval = setInterval(() => {
      // Decrement active player's clock
      if (this.game) {
        const isWhiteTurn = this.moveHistory.length % 2 === 0;
        if (isWhiteTurn) {
          this.whiteTime = Math.max(0, this.whiteTime - 1);
        } else {
          this.blackTime = Math.max(0, this.blackTime - 1);
        }
      }
    }, 1000);
  }

  onMoveMade(event: { from: string; to: string; san: string; fen: string }): void {
    if (!this.game || this.gameOver) return;
    this.gameService.makeMove(this.game.id, event.from, event.to).subscribe({
      next: (res) => {
        this.moveHistory.push(event.san);
        if (res.status === 'completed') {
          this.gameOver = true;
          this.stopClock();
        }
      },
      error: () => {
        this.snackBar.open('Invalid move', 'Close', { duration: 2000 });
      }
    });
  }

  resign(): void {
    if (!this.game) return;
    this.gameService.resign(this.game.id).subscribe({
      next: () => {
        this.gameOver = true;
        this.stopClock();
        this.snackBar.open('You resigned.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to resign', 'Close', { duration: 3000 });
      }
    });
  }

  offerDraw(): void {
    if (!this.game) return;
    this.gameService.offerDraw(this.game.id).subscribe({
      next: () => {
        this.snackBar.open('Draw offer sent.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to offer draw', 'Close', { duration: 3000 });
      }
    });
  }

  sendChatMessage(): void {
    if (!this.newMessage.trim()) return;
    this.chatMessages.push({ sender: 'You', text: this.newMessage, time: new Date() });
    this.newMessage = '';
  }

  formatClock(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  stopClock(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopClock();
  }
}
