import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MovesService, MoveSequence } from '../../services/moves.service';

@Component({
  selector: 'app-moves-library',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    MatInputModule, MatFormFieldModule
  ],
  templateUrl: './moves-library.component.html',
  styleUrl: './moves-library.component.css'
})
export class MovesLibraryComponent implements OnInit {
  sequences: MoveSequence[] = [];
  loading = true;
  error = '';
  searchQuery = '';
  selectedCategory = '';
  selectedDifficulty = '';
  categories: string[] = [];
  difficulties = ['beginner', 'intermediate', 'advanced', 'master'];

  constructor(private movesService: MovesService) {}

  ngOnInit(): void {
    this.loadSequences();
    this.loadCategories();
  }

  loadSequences(): void {
    this.loading = true;
    this.movesService.getMoveSequences({
      search: this.searchQuery || undefined,
      category: this.selectedCategory || undefined,
      difficulty: this.selectedDifficulty || undefined
    }).subscribe({
      next: (res) => {
        this.sequences = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load move sequences';
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.movesService.getCategories().subscribe({
      next: (cats) => this.categories = cats,
      error: () => {}
    });
  }

  applyFilters(): void {
    this.loadSequences();
  }

  toggleCategory(category: string): void {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.applyFilters();
  }

  toggleDifficulty(difficulty: string): void {
    this.selectedDifficulty = this.selectedDifficulty === difficulty ? '' : difficulty;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedDifficulty = '';
    this.loadSequences();
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return '#4caf50';
      case 'intermediate': return '#ff9800';
      case 'advanced': return '#f44336';
      case 'master': return '#9c27b0';
      default: return '#757575';
    }
  }
}
