import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StudentService, ActiveSession } from '../services/student.service';

@Component({
  selector: 'app-join-lesson',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './join-lesson.component.html',
  styleUrls: ['./join-lesson.component.css']
})
export class JoinLessonComponent implements OnInit {
  activeSessions: ActiveSession[] = [];
  isLoading = false;
  errorMessage = '';
  selectedSession: ActiveSession | null = null;

  private studentService = inject(StudentService);
  private router = inject(Router);

  ngOnInit() {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Fetch active sessions
    this.loadActiveSessions();
  }

  loadActiveSessions() {
    this.isLoading = true;
    this.errorMessage = '';

    this.studentService.getActiveSessions().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.activeSessions = response.sessions;
        
        if (this.activeSessions.length === 0) {
          this.errorMessage = 'No active sessions available. Please ask your instructor to create a session.';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load active sessions. Please try again.';
        console.error('Error loading active sessions:', error);
      }
    });
  }

  selectSession(session: ActiveSession) {
    this.selectedSession = session;
  }

  joinSession(session: ActiveSession) {
    this.isLoading = true;
    this.errorMessage = '';

    // Store lesson details
    localStorage.setItem('currentLesson', JSON.stringify({
      sessionId: session.id,
      gameRoomId: session.gameRoomId,
      meetingId: session.meetingId,
      instructor: session.instructor
    }));

    // Navigate to the chess game
    this.router.navigate(['/student-game'], {
      queryParams: { 
        gameRoomId: session.gameRoomId, 
        meetingId: session.meetingId,
        sessionId: session.id,
        role: 'student'
      }
    });
  }

  goBack() {
    this.router.navigate(['/student-dashboard']);
  }

  getInstructorName(session: ActiveSession): string {
    if (session.instructor.firstName && session.instructor.lastName) {
      return `${session.instructor.firstName} ${session.instructor.lastName}`;
    }
    return session.instructor.username;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
}
