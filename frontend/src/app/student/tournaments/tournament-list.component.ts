import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TournamentService, Tournament } from '../../services/tournament.service';

@Component({
  selector: 'app-tournament-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './tournament-list.component.html',
  styleUrl: './tournament-list.component.css'
})
export class TournamentListComponent implements OnInit {
  tournaments: Tournament[] = [];
  loading = true;
  error = '';
  selectedStatus = '';

  constructor(
    private tournamentService: TournamentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTournaments();
  }

  loadTournaments(): void {
    this.loading = true;
    this.tournamentService.getTournaments(this.selectedStatus || undefined).subscribe({
      next: (tournaments) => {
        this.tournaments = tournaments;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load tournaments';
        this.loading = false;
      }
    });
  }

  filterByStatus(status: string): void {
    this.selectedStatus = this.selectedStatus === status ? '' : status;
    this.loadTournaments();
  }

  joinTournament(tournament: Tournament, event: Event): void {
    event.stopPropagation();
    this.tournamentService.joinTournament(tournament.id).subscribe({
      next: () => {
        this.snackBar.open(`Joined ${tournament.name}!`, 'Close', { duration: 3000 });
        this.loadTournaments();
      },
      error: () => {
        this.snackBar.open('Failed to join tournament', 'Close', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return '#1565c0';
      case 'active': return '#2e7d32';
      case 'completed': return '#757575';
      default: return '#757575';
    }
  }

  getFormatIcon(format: string): string {
    switch (format) {
      case 'swiss': return 'swap_vert';
      case 'round-robin': return 'loop';
      case 'elimination': return 'account_tree';
      default: return 'emoji_events';
    }
  }
}
