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
  selector: 'app-student-form',
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
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.css']
})
export class StudentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  isEditMode = false;
  studentId: string | null = null;
  loading = false;
  saving = false;

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.studentId;

    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    });

    if (this.isEditMode && this.studentId) {
      this.loadStudent(this.studentId);
    }
  }

  loadStudent(id: string): void {
    this.loading = true;
    this.adminService.getStudent(id).subscribe({
      next: (student) => {
        this.form.patchValue({
          username: student.username,
          email: student.email,
          firstName: student.firstName,
          lastName: student.lastName
        });
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load student', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const data = this.form.value;

    if (this.isEditMode && this.studentId) {
      if (!data.password) delete data.password;
      this.adminService.updateStudent(this.studentId, data).subscribe({
        next: () => {
          this.snackBar.open('Student updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/students']);
        },
        error: () => {
          this.snackBar.open('Failed to update student', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    } else {
      this.adminService.createStudent(data).subscribe({
        next: () => {
          this.snackBar.open('Student created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/students']);
        },
        error: () => {
          this.snackBar.open('Failed to create student', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/students']);
  }
}
