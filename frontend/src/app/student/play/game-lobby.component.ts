import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { GameService, OnlineStudent, Game } from '../../services/game.service';

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatListModule,
    MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatChipsModule
  ],
  templateUrl: './game-lobby.component.html',
  styleUrl: './game-lobby.component.css'
})
export class GameLobbyComponent implements OnInit {
  onlineStudents: OnlineStudent[] = [];
  recentGames: Game[] = [];
  loading = true;
  inQueue = false;
  queueTimeControl = '10+0';
  challengeTimeControl = '10+0';
  timeControls = ['3+0', '5+0', '10+0', '15+10', '30+0'];

  constructor(
    private gameService: GameService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.gameService.getOnlineStudents().subscribe({
      next: (students) => {
        this.onlineStudents = students;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.gameService.getMyGames(undefined, 1, 5).subscribe({
      next: (res) => this.recentGames = res.data || [],
      error: () => {}
    });
  }

  playComputer(): void {
    this.router.navigate(['/student/play/computer']);
  }

  joinQueue(): void {
    this.inQueue = true;
    this.gameService.joinQueue(this.queueTimeControl).subscribe({
      next: (res) => {
        if (res.gameId) {
          this.router.navigate(['/student/play/game', res.gameId]);
        } else {
          this.snackBar.open('Waiting for opponent...', 'Cancel', { duration: 30000 }).onAction().subscribe(() => {
            this.leaveQueue();
          });
        }
      },
      error: () => {
        this.inQueue = false;
        this.snackBar.open('Failed to join queue', 'Close', { duration: 3000 });
      }
    });
  }

  leaveQueue(): void {
    this.gameService.leaveQueue().subscribe({
      next: () => {
        this.inQueue = false;
        this.snackBar.open('Left queue', 'Close', { duration: 2000 });
      },
      error: () => {}
    });
  }

  challengeStudent(student: OnlineStudent): void {
    this.gameService.challengeStudent(student.id, this.challengeTimeControl).subscribe({
      next: () => {
        this.snackBar.open(`Challenge sent to ${student.username}!`, 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to send challenge', 'Close', { duration: 3000 });
      }
    });
  }

  getResultText(game: Game): string {
    if (!game.result) return game.status;
    return game.result;
  }
}
