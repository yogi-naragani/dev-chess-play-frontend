import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { HomeworkService, Homework } from '../../services/homework.service';

@Component({
  selector: 'app-homework-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './homework-list.component.html',
  styleUrl: './homework-list.component.css'
})
export class HomeworkListComponent implements OnInit {
  displayedColumns = ['title', 'type', 'dueDate', 'submissions', 'actions'];
  assignments: Homework[] = [];
  loading = true;

  constructor(private homeworkService: HomeworkService) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.loading = true;
    this.homeworkService.getAssignments().subscribe({
      next: (res) => {
        this.assignments = res.assignments;
        this.loading = false;
      },
      error: () => {
        this.assignments = [];
        this.loading = false;
      }
    });
  }

  deleteAssignment(hw: Homework): void {
    if (confirm(`Delete assignment "${hw.title}"?`)) {
      this.homeworkService.deleteAssignment(hw.id).subscribe({
        next: () => this.loadAssignments(),
        error: () => {}
      });
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'solve_position': return 'Solve Position';
      case 'watch_video': return 'Watch Video';
      case 'review_game': return 'Review Game';
      default: return type;
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'solve_position': return 'extension';
      case 'watch_video': return 'videocam';
      case 'review_game': return 'sports_esports';
      default: return 'assignment';
    }
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }
}
