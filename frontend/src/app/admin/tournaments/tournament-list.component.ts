import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, Tournament } from '../../services/admin.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-tournament-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './tournament-list.component.html',
  styleUrls: ['./tournament-list.component.css']
})
export class TournamentListComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['name', 'format', 'timeControl', 'players', 'status', 'startDate', 'actions'];
  dataSource = new MatTableDataSource<Tournament>();
  loading = true;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  ngOnInit(): void {
    this.loadTournaments();
  }

  loadTournaments(): void {
    this.loading = true;
    this.adminService.getTournaments(this.currentPage + 1, this.pageSize).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalItems = response.total;
        this.loading = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTournaments();
  }

  createTournament(): void {
    this.router.navigate(['/admin/tournaments/new']);
  }

  editTournament(tournament: Tournament): void {
    this.router.navigate(['/admin/tournaments/edit', tournament.id]);
  }

  deleteTournament(tournament: Tournament): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Tournament',
        message: `Are you sure you want to delete "${tournament.name}"?`,
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.deleteTournament(tournament.id).subscribe({
          next: () => this.loadTournaments(),
          error: (err) => console.error('Failed to delete tournament', err)
        });
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'upcoming': '#1976d2',
      'active': '#388e3c',
      'in_progress': '#388e3c',
      'completed': '#757575',
      'cancelled': '#c62828'
    };
    return colors[status.toLowerCase()] || '#757575';
  }

  getStatusBgColor(status: string): string {
    const colors: Record<string, string> = {
      'upcoming': '#e3f2fd',
      'active': '#e8f5e9',
      'in_progress': '#e8f5e9',
      'completed': '#f5f5f5',
      'cancelled': '#fbe9e7'
    };
    return colors[status.toLowerCase()] || '#f5f5f5';
  }
}
