import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LessonService } from '../../services/lesson.service';

@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './lesson-form.component.html',
  styleUrl: './lesson-form.component.css'
})
export class LessonFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  lessonId: string | null = null;
  loading = false;
  saving = false;

  courses = [
    { id: 'course-1', name: 'Beginner Chess' },
    { id: 'course-2', name: 'Intermediate Tactics' },
    { id: 'course-3', name: 'Advanced Strategy' },
    { id: 'course-4', name: 'Endgame Mastery' }
  ];

  availableStudents = [
    { id: 'student-1', name: 'Alex Johnson' },
    { id: 'student-2', name: 'Maria Garcia' },
    { id: 'student-3', name: 'James Wilson' },
    { id: 'student-4', name: 'Emma Brown' },
    { id: 'student-5', name: 'Daniel Lee' }
  ];

  durations = [30, 45, 60, 90, 120];

  constructor(
    private fb: FormBuilder,
    private lessonService: LessonService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      date: [null, Validators.required],
      time: ['', Validators.required],
      duration: [60, Validators.required],
      courseId: ['', Validators.required],
      studentIds: [[] as string[]]
    });

    this.lessonId = this.route.snapshot.paramMap.get('id');
    if (this.lessonId) {
      this.isEdit = true;
      this.loadLesson();
    }
  }

  loadLesson(): void {
    if (!this.lessonId) return;
    this.loading = true;
    this.lessonService.getLesson(this.lessonId).subscribe({
      next: (lesson) => {
        this.form.patchValue({
          title: lesson.title,
          description: lesson.description,
          date: new Date(lesson.date),
          time: lesson.time,
          duration: lesson.duration,
          courseId: lesson.courseId,
          studentIds: lesson.studentIds
        });
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load lesson', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const value = this.form.value;
    const payload = {
      ...value,
      date: value.date instanceof Date ? value.date.toISOString().split('T')[0] : value.date
    };

    const request = this.isEdit
      ? this.lessonService.updateLesson(this.lessonId!, payload)
      : this.lessonService.createLesson(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Lesson updated' : 'Lesson created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/instructor/lessons']);
      },
      error: () => {
        this.snackBar.open('Failed to save lesson', 'Close', { duration: 3000 });
        this.saving = false;
      }
    });
  }
}
