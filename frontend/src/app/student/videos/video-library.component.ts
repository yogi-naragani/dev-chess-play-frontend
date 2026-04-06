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
import { VideoService, Video } from '../../services/video.service';

@Component({
  selector: 'app-video-library',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    MatInputModule, MatFormFieldModule
  ],
  templateUrl: './video-library.component.html',
  styleUrl: './video-library.component.css'
})
export class VideoLibraryComponent implements OnInit {
  videos: Video[] = [];
  filteredVideos: Video[] = [];
  loading = true;
  error = '';
  searchQuery = '';
  selectedCategory = '';
  selectedLevel = '';
  categories: string[] = [];
  levels = ['beginner', 'intermediate', 'advanced'];

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.loadVideos();
  }

  loadVideos(): void {
    this.loading = true;
    this.videoService.getVideos().subscribe({
      next: (res) => {
        this.videos = res.videos || [];
        this.filteredVideos = [...this.videos];
        this.categories = [...new Set(this.videos.map(v => v.category).filter(Boolean))];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load videos';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredVideos = this.videos.filter(v => {
      const matchesSearch = !this.searchQuery ||
        v.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = !this.selectedCategory || v.category === this.selectedCategory;
      const matchesLevel = !this.selectedLevel || v.level === this.selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }

  toggleCategory(category: string): void {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.applyFilters();
  }

  toggleLevel(level: string): void {
    this.selectedLevel = this.selectedLevel === level ? '' : level;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedLevel = '';
    this.filteredVideos = [...this.videos];
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
