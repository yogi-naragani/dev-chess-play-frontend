import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.css']
})
export class CourseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  isEditMode = false;
  courseId: string | null = null;
  loading = false;
  saving = false;

  levels = ['Beginner', 'Intermediate', 'Advanced', 'Master'];

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.courseId;

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      level: ['', Validators.required]
    });

    if (this.isEditMode && this.courseId) {
      this.loadCourse(this.courseId);
    }
  }

  loadCourse(id: string): void {
    this.loading = true;
    this.adminService.getCourse(id).subscribe({
      next: (course) => {
        this.form.patchValue({
          name: course.name,
          description: course.description,
          level: course.level
        });
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load course', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const data = this.form.value;

    if (this.isEditMode && this.courseId) {
      this.adminService.updateCourse(this.courseId, data).subscribe({
        next: () => {
          this.snackBar.open('Course updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/courses']);
        },
        error: () => {
          this.snackBar.open('Failed to update course', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    } else {
      this.adminService.createCourse(data).subscribe({
        next: () => {
          this.snackBar.open('Course created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/courses']);
        },
        error: () => {
          this.snackBar.open('Failed to create course', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/courses']);
  }
}
