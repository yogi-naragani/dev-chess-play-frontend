import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { ChessBoardComponent } from '../../shared/chess-board/chess-board.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    MatBadgeModule, MatListModule, ChessBoardComponent
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css'
})
export class StudentDashboardComponent implements OnInit {
  user: User | null = null;
  loading = true;

  dailyPuzzle = {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    completed: false
  };

  upcomingLessons = [
    { id: '1', title: 'Opening Principles', instructor: 'GM Smith', date: new Date(Date.now() + 86400000), status: 'scheduled' },
    { id: '2', title: 'Endgame Tactics', instructor: 'IM Johnson', date: new Date(Date.now() + 172800000), status: 'scheduled' }
  ];

  recentGames = [
    { id: '1', opponent: 'Alice', result: 'win', date: new Date(Date.now() - 3600000) },
    { id: '2', opponent: 'Bob', result: 'loss', date: new Date(Date.now() - 7200000) },
    { id: '3', opponent: 'Charlie', result: 'draw', date: new Date(Date.now() - 86400000) }
  ];

  pendingHomework = [
    { id: '1', title: 'Sicilian Defense Analysis', dueDate: new Date(Date.now() + 259200000), type: 'position' },
    { id: '2', title: 'Endgame Practice Set', dueDate: new Date(Date.now() + 432000000), type: 'puzzle' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loading = false;
  }

  getResultClass(result: string): string {
    switch (result) {
      case 'win': return 'result-win';
      case 'loss': return 'result-loss';
      case 'draw': return 'result-draw';
      default: return '';
    }
  }
}
