import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, Puzzle } from '../../services/admin.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-puzzle-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './puzzle-list.component.html',
  styleUrls: ['./puzzle-list.component.css']
})
export class PuzzleListComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['rating', 'category', 'themes', 'solutionMoves', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Puzzle>();
  loading = true;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  categoryFilter = '';
  themeFilter = '';

  categories = ['Tactics', 'Endgame', 'Opening', 'Middlegame'];
  themes = ['Fork', 'Pin', 'Skewer', 'Discovery', 'Mate in 1', 'Mate in 2', 'Mate in 3', 'Sacrifice', 'Deflection', 'Zugzwang'];

  ngOnInit(): void {
    this.loadPuzzles();
  }

  loadPuzzles(): void {
    this.loading = true;
    this.adminService.getPuzzles(this.currentPage + 1, this.pageSize, this.categoryFilter, this.themeFilter).subscribe({
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

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadPuzzles();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPuzzles();
  }

  addPuzzle(): void {
    this.router.navigate(['/admin/puzzles/new']);
  }

  editPuzzle(puzzle: Puzzle): void {
    this.router.navigate(['/admin/puzzles/edit', puzzle.id]);
  }

  deletePuzzle(puzzle: Puzzle): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Puzzle',
        message: 'Are you sure you want to delete this puzzle?',
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.deletePuzzle(puzzle.id).subscribe({
          next: () => this.loadPuzzles(),
          error: (err) => console.error('Failed to delete puzzle', err)
        });
      }
    });
  }

  getRatingColor(rating: number): string {
    if (rating < 1200) return '#4caf50';
    if (rating < 1600) return '#ff9800';
    if (rating < 2000) return '#f44336';
    return '#9c27b0';
  }
}
