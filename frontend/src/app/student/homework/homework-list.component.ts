import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { HomeworkService, Homework } from '../../services/homework.service';

@Component({
  selector: 'app-homework-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    MatListModule, MatDividerModule
  ],
  templateUrl: './homework-list.component.html',
  styleUrl: './homework-list.component.css'
})
export class HomeworkListComponent implements OnInit {
  assignments: Homework[] = [];
  loading = true;
  error = '';

  constructor(private homeworkService: HomeworkService) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.loading = true;
    this.homeworkService.getAssignments().subscribe({
      next: (res) => {
        this.assignments = res.assignments || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load homework';
        this.loading = false;
      }
    });
  }

  get pendingAssignments(): Homework[] {
    return this.assignments.filter(a => new Date(a.dueDate) >= new Date());
  }

  get completedAssignments(): Homework[] {
    return this.assignments.filter(a => new Date(a.dueDate) < new Date());
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'solve_position': return 'grid_on';
      case 'watch_video': return 'play_circle';
      case 'review_game': return 'sports_esports';
      default: return 'assignment';
    }
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }
}
