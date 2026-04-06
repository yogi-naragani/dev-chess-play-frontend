import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HomeworkService, Homework, Submission } from '../../services/homework.service';

@Component({
  selector: 'app-homework-submissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './homework-submissions.component.html',
  styleUrl: './homework-submissions.component.css'
})
export class HomeworkSubmissionsComponent implements OnInit {
  homeworkId: string = '';
  homework: Homework | null = null;
  submissions: Submission[] = [];
  loading = true;
  gradingSubmissionId: string | null = null;
  gradeValue: number | null = null;
  feedbackValue = '';

  constructor(
    private route: ActivatedRoute,
    private homeworkService: HomeworkService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.homeworkId = this.route.snapshot.paramMap.get('id') || '';
    if (this.homeworkId) {
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;

    this.homeworkService.getAssignment(this.homeworkId).subscribe({
      next: (hw) => { this.homework = hw; },
      error: () => {}
    });

    this.homeworkService.getSubmissions(this.homeworkId).subscribe({
      next: (res) => {
        this.submissions = res.submissions;
        this.loading = false;
      },
      error: () => {
        this.submissions = [];
        this.loading = false;
      }
    });
  }

  startGrading(submission: Submission): void {
    this.gradingSubmissionId = submission.id;
    this.gradeValue = submission.grade ?? null;
    this.feedbackValue = submission.feedback || '';
  }

  cancelGrading(): void {
    this.gradingSubmissionId = null;
    this.gradeValue = null;
    this.feedbackValue = '';
  }

  submitGrade(submission: Submission): void {
    if (this.gradeValue === null) return;

    this.homeworkService.gradeSubmission(
      this.homeworkId,
      submission.id,
      this.gradeValue,
      this.feedbackValue
    ).subscribe({
      next: (updated) => {
        const idx = this.submissions.findIndex(s => s.id === submission.id);
        if (idx >= 0) {
          this.submissions[idx] = updated;
        }
        this.gradingSubmissionId = null;
        this.snackBar.open('Grade submitted', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to submit grade', 'Close', { duration: 3000 });
      }
    });
  }

  formatAnswer(answer: any): string {
    if (typeof answer === 'string') return answer;
    return JSON.stringify(answer, null, 2);
  }
}
