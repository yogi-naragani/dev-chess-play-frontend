import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, Course } from '../../services/admin.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  courses: Course[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading = true;
    this.adminService.getCourses(1, 100).subscribe({
      next: (response) => {
        this.courses = response.data;
        this.loading = false;
      },
      error: () => {
        this.courses = [];
        this.loading = false;
      }
    });
  }

  addCourse(): void {
    this.router.navigate(['/admin/courses/new']);
  }

  editCourse(course: Course): void {
    this.router.navigate(['/admin/courses/edit', course.id]);
  }

  deleteCourse(course: Course): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Course',
        message: `Are you sure you want to delete "${course.name}"?`,
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.deleteCourse(course.id).subscribe({
          next: () => this.loadCourses(),
          error: (err) => console.error('Failed to delete course', err)
        });
      }
    });
  }

  getLevelColor(level: string): string {
    const colors: Record<string, string> = {
      'beginner': '#4caf50',
      'intermediate': '#ff9800',
      'advanced': '#f44336',
      'master': '#9c27b0'
    };
    return colors[level.toLowerCase()] || '#757575';
  }
}
