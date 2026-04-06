import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-instructor-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './instructor-form.component.html',
  styleUrls: ['./instructor-form.component.css']
})
export class InstructorFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  isEditMode = false;
  instructorId: string | null = null;
  loading = false;
  saving = false;

  ngOnInit(): void {
    this.instructorId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.instructorId;

    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    });

    if (this.isEditMode && this.instructorId) {
      this.loadInstructor(this.instructorId);
    }
  }

  loadInstructor(id: string): void {
    this.loading = true;
    this.adminService.getInstructor(id).subscribe({
      next: (instructor) => {
        this.form.patchValue({
          username: instructor.username,
          email: instructor.email,
          firstName: instructor.firstName,
          lastName: instructor.lastName
        });
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load instructor', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const data = this.form.value;

    if (this.isEditMode && this.instructorId) {
      if (!data.password) delete data.password;
      this.adminService.updateInstructor(this.instructorId, data).subscribe({
        next: () => {
          this.snackBar.open('Instructor updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/instructors']);
        },
        error: () => {
          this.snackBar.open('Failed to update instructor', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    } else {
      this.adminService.createInstructor(data).subscribe({
        next: () => {
          this.snackBar.open('Instructor created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/instructors']);
        },
        error: () => {
          this.snackBar.open('Failed to create instructor', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/instructors']);
  }
}
