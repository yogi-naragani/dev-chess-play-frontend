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
import { HomeworkService } from '../../services/homework.service';

@Component({
  selector: 'app-homework-form',
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
  templateUrl: './homework-form.component.html',
  styleUrl: './homework-form.component.css'
})
export class HomeworkFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  homeworkId: string | null = null;
  loading = false;
  saving = false;

  types = [
    { value: 'solve_position', label: 'Solve Position' },
    { value: 'watch_video', label: 'Watch Video' },
    { value: 'review_game', label: 'Review Game' }
  ];

  availableStudents = [
    { id: 'student-1', name: 'Alex Johnson' },
    { id: 'student-2', name: 'Maria Garcia' },
    { id: 'student-3', name: 'James Wilson' },
    { id: 'student-4', name: 'Emma Brown' },
    { id: 'student-5', name: 'Daniel Lee' }
  ];

  constructor(
    private fb: FormBuilder,
    private homeworkService: HomeworkService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(2000)]],
      type: ['solve_position', Validators.required],
      fen: [''],
      videoId: [''],
      gameId: [''],
      dueDate: [null, Validators.required],
      assignedStudentIds: [[] as string[]]
    });

    // Conditional validation based on assignment type
    this.form.get('type')?.valueChanges.subscribe(type => {
      const fenCtrl = this.form.get('fen');
      const videoCtrl = this.form.get('videoId');
      const gameCtrl = this.form.get('gameId');

      fenCtrl?.clearValidators();
      videoCtrl?.clearValidators();
      gameCtrl?.clearValidators();

      if (type === 'solve_position') {
        fenCtrl?.setValidators([Validators.required]);
      } else if (type === 'watch_video') {
        videoCtrl?.setValidators([Validators.required]);
      } else if (type === 'review_game') {
        gameCtrl?.setValidators([Validators.required]);
      }

      fenCtrl?.updateValueAndValidity();
      videoCtrl?.updateValueAndValidity();
      gameCtrl?.updateValueAndValidity();
    });

    this.homeworkId = this.route.snapshot.paramMap.get('id');
    if (this.homeworkId) {
      this.isEdit = true;
      this.loadHomework();
    }
  }

  loadHomework(): void {
    if (!this.homeworkId) return;
    this.loading = true;
    this.homeworkService.getAssignment(this.homeworkId).subscribe({
      next: (hw) => {
        this.form.patchValue({
          title: hw.title,
          description: hw.description,
          type: hw.type,
          fen: hw.data?.fen || '',
          videoId: hw.data?.videoId || '',
          gameId: hw.data?.gameId || '',
          dueDate: new Date(hw.dueDate),
          assignedStudentIds: hw.assignedStudentIds
        });
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load assignment', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  get selectedType(): string {
    return this.form.get('type')?.value || '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const v = this.form.value;

    const data: Record<string, any> = {};
    if (v.type === 'solve_position' && v.fen) data['fen'] = v.fen;
    if (v.type === 'watch_video' && v.videoId) data['videoId'] = v.videoId;
    if (v.type === 'review_game' && v.gameId) data['gameId'] = v.gameId;

    const payload = {
      title: v.title,
      description: v.description,
      type: v.type,
      data,
      dueDate: v.dueDate instanceof Date ? v.dueDate.toISOString().split('T')[0] : v.dueDate,
      assignedStudentIds: v.assignedStudentIds
    };

    const request = this.isEdit
      ? this.homeworkService.updateAssignment(this.homeworkId!, payload)
      : this.homeworkService.createAssignment(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Assignment updated' : 'Assignment created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/instructor/homework']);
      },
      error: () => {
        this.snackBar.open('Failed to save assignment', 'Close', { duration: 3000 });
        this.saving = false;
      }
    });
  }
}
