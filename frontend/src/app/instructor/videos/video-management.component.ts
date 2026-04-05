import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { VideoService, Video } from '../../services/video.service';

@Component({
  selector: 'app-video-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    RouterModule
  ],
  templateUrl: './video-management.component.html',
  styleUrl: './video-management.component.css'
})
export class VideoManagementComponent implements OnInit {
  videos: Video[] = [];
  loading = true;
  viewMode: 'table' | 'grid' = 'grid';
  displayedColumns = ['title', 'category', 'level', 'duration', 'actions'];

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.loadVideos();
  }

  loadVideos(): void {
    this.loading = true;
    this.videoService.getVideos().subscribe({
      next: (res) => {
        this.videos = res.videos;
        this.loading = false;
      },
      error: () => {
        this.videos = [];
        this.loading = false;
      }
    });
  }

  deleteVideo(video: Video): void {
    if (confirm(`Delete video "${video.title}"?`)) {
      this.videoService.deleteVideo(video.id).subscribe({
        next: () => this.loadVideos(),
        error: () => {}
      });
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'beginner': return 'primary';
      case 'intermediate': return 'accent';
      case 'advanced': return 'warn';
      default: return '';
    }
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'table' ? 'grid' : 'table';
  }
}
