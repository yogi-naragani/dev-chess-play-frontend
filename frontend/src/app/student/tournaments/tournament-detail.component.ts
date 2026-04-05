import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TournamentService, TournamentDetail, TournamentStanding, TournamentPairing } from '../../services/tournament.service';

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatTableModule, MatChipsModule, MatTabsModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './tournament-detail.component.html',
  styleUrl: './tournament-detail.component.css'
})
export class TournamentDetailComponent implements OnInit {
  tournament: TournamentDetail | null = null;
  loading = true;
  error = '';
  standingsColumns = ['rank', 'player', 'rating', 'score', 'record'];
  pairingsColumns = ['board', 'white', 'result', 'black'];
  selectedRound = 1;

  constructor(
    private route: ActivatedRoute,
    private tournamentService: TournamentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTournament(id);
    }
  }

  loadTournament(id: string): void {
    this.loading = true;
    this.tournamentService.getTournament(id).subscribe({
      next: (t) => {
        this.tournament = t;
        this.loading = false;
        if (t.pairings?.length) {
          const rounds = [...new Set(t.pairings.map(p => p.round))];
          this.selectedRound = rounds[rounds.length - 1] || 1;
        }
      },
      error: () => {
        this.error = 'Failed to load tournament';
        this.loading = false;
      }
    });
  }

  get currentRoundPairings(): TournamentPairing[] {
    if (!this.tournament) return [];
    return this.tournament.pairings.filter(p => p.round === this.selectedRound);
  }

  get availableRounds(): number[] {
    if (!this.tournament) return [];
    return [...new Set(this.tournament.pairings.map(p => p.round))].sort();
  }

  joinTournament(): void {
    if (!this.tournament) return;
    this.tournamentService.joinTournament(this.tournament.id).subscribe({
      next: () => {
        this.snackBar.open('Joined tournament!', 'Close', { duration: 3000 });
        this.loadTournament(this.tournament!.id);
      },
      error: () => {
        this.snackBar.open('Failed to join', 'Close', { duration: 3000 });
      }
    });
  }

  leaveTournament(): void {
    if (!this.tournament) return;
    this.tournamentService.leaveTournament(this.tournament.id).subscribe({
      next: () => {
        this.snackBar.open('Left tournament', 'Close', { duration: 3000 });
        this.loadTournament(this.tournament!.id);
      },
      error: () => {
        this.snackBar.open('Failed to leave', 'Close', { duration: 3000 });
      }
    });
  }
}
