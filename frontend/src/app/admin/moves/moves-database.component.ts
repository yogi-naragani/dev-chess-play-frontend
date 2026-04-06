import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, MoveSequence } from '../../services/admin.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-moves-database',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './moves-database.component.html',
  styleUrls: ['./moves-database.component.css']
})
export class MovesDatabaseComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['title', 'category', 'openingName', 'difficulty', 'moves', 'tags', 'actions'];
  dataSource = new MatTableDataSource<MoveSequence>();
  loading = true;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  categoryFilter = '';
  difficultyFilter = '';

  categories = ['Opening', 'Middlegame', 'Endgame', 'Tactics', 'Strategy'];
  difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Master'];

  ngOnInit(): void {
    this.loadMoveSequences();
  }

  loadMoveSequences(): void {
    this.loading = true;
    this.adminService.getMoveSequences(this.currentPage + 1, this.pageSize, this.categoryFilter, this.difficultyFilter).subscribe({
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
    this.loadMoveSequences();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadMoveSequences();
  }

  addNew(): void {
    this.router.navigate(['/admin/moves/new']);
  }

  editSequence(seq: MoveSequence): void {
    this.router.navigate(['/admin/moves/edit', seq.id]);
  }

  deleteSequence(seq: MoveSequence): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Move Sequence',
        message: `Are you sure you want to delete "${seq.title}"?`,
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.deleteMoveSequence(seq.id).subscribe({
          next: () => this.loadMoveSequences(),
          error: (err) => console.error('Failed to delete move sequence', err)
        });
      }
    });
  }

  getDifficultyColor(difficulty: string): string {
    const colors: Record<string, string> = {
      'Beginner': '#4caf50',
      'Intermediate': '#ff9800',
      'Advanced': '#f44336',
      'Master': '#9c27b0'
    };
    return colors[difficulty] || '#757575';
  }
}
