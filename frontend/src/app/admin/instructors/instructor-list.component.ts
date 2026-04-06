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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, Instructor } from '../../services/admin.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-instructor-list',
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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './instructor-list.component.html',
  styleUrls: ['./instructor-list.component.css']
})
export class InstructorListComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['name', 'email', 'studentsCount', 'status', 'actions'];
  dataSource = new MatTableDataSource<Instructor>();
  loading = true;
  searchQuery = '';
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.loading = true;
    this.adminService.getInstructors(this.currentPage + 1, this.pageSize, this.searchQuery).subscribe({
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

  onSearch(): void {
    this.currentPage = 0;
    this.loadInstructors();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInstructors();
  }

  addInstructor(): void {
    this.router.navigate(['/admin/instructors/new']);
  }

  editInstructor(instructor: Instructor): void {
    this.router.navigate(['/admin/instructors/edit', instructor.id]);
  }

  deleteInstructor(instructor: Instructor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Instructor',
        message: `Are you sure you want to delete ${instructor.firstName} ${instructor.lastName}?`,
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.deleteInstructor(instructor.id).subscribe({
          next: () => this.loadInstructors(),
          error: (err) => console.error('Failed to delete instructor', err)
        });
      }
    });
  }

  getFullName(instructor: Instructor): string {
    return `${instructor.firstName} ${instructor.lastName}`;
  }
}
