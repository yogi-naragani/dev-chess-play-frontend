import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  user: User | null = null;
  navItems: NavItem[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.navItems = this.getNavItems();
  }

  private getNavItems(): NavItem[] {
    switch (this.user?.userType) {
      case 'admin':
        return [
          { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
          { label: 'Instructors', icon: 'school', route: '/admin/instructors' },
          { label: 'Students', icon: 'people', route: '/admin/students' },
          { label: 'Courses', icon: 'menu_book', route: '/admin/courses' },
          { label: 'Chess Moves', icon: 'extension', route: '/admin/moves' },
          { label: 'Puzzles', icon: 'psychology', route: '/admin/puzzles' },
          { label: 'Tournaments', icon: 'emoji_events', route: '/admin/tournaments' },
          { label: 'Analytics', icon: 'analytics', route: '/admin/analytics' }
        ];
      case 'instructor':
        return [
          { label: 'Dashboard', icon: 'dashboard', route: '/instructor/dashboard' },
          { label: 'Lessons', icon: 'class', route: '/instructor/lessons' },
          { label: 'Videos', icon: 'video_library', route: '/instructor/videos' },
          { label: 'Students', icon: 'people', route: '/instructor/students' },
          { label: 'Homework', icon: 'assignment', route: '/instructor/homework' },
          { label: 'Chat', icon: 'chat', route: '/instructor/chat' }
        ];
      case 'student':
        return [
          { label: 'Dashboard', icon: 'dashboard', route: '/student/dashboard' },
          { label: 'Play', icon: 'sports_esports', route: '/student/play' },
          { label: 'Lessons', icon: 'class', route: '/student/lessons' },
          { label: 'Videos', icon: 'video_library', route: '/student/videos' },
          { label: 'Moves Library', icon: 'extension', route: '/student/moves' },
          { label: 'Puzzles', icon: 'psychology', route: '/student/puzzles' },
          { label: 'Tournaments', icon: 'emoji_events', route: '/student/tournaments' },
          { label: 'Homework', icon: 'assignment', route: '/student/homework' },
          { label: 'Chat', icon: 'chat', route: '/student/chat' },
          { label: 'My Progress', icon: 'trending_up', route: '/student/progress' }
        ];
      default:
        return [];
    }
  }
}
