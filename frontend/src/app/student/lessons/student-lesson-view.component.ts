import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { ChessBoardComponent } from '../../shared/chess-board/chess-board.component';
import { LessonService, Lesson } from '../../services/lesson.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-lesson-view',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatListModule, ChessBoardComponent
  ],
  templateUrl: './student-lesson-view.component.html',
  styleUrl: './student-lesson-view.component.css'
})
export class StudentLessonViewComponent implements OnInit, OnDestroy {
  lesson: Lesson | null = null;
  loading = true;
  error = '';
  currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  chatMessages: { sender: string; text: string; time: Date }[] = [];
  newMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private lessonService: LessonService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLesson(id);
    }
  }

  loadLesson(id: string): void {
    this.loading = true;
    this.lessonService.getLesson(id).subscribe({
      next: (lesson) => {
        this.lesson = lesson;
        this.loading = false;
        if (lesson.gameRoomId) {
          this.connectToRoom(lesson.gameRoomId);
        }
      },
      error: () => {
        this.error = 'Failed to load lesson';
        this.loading = false;
      }
    });
  }

  connectToRoom(gameRoomId: string): void {
    this.socketService.connect(gameRoomId);
    this.socketService.joinRoomAsStudent(gameRoomId);

    const moveSub = this.socketService.move$.subscribe((move) => {
      // Update board when instructor makes a move
    });
    this.subscriptions.push(moveSub);
  }

  sendChatMessage(): void {
    if (!this.newMessage.trim()) return;
    this.chatMessages.push({
      sender: 'You',
      text: this.newMessage,
      time: new Date()
    });
    this.newMessage = '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.lesson?.gameRoomId) {
      this.socketService.leaveRoom(this.lesson.gameRoomId);
    }
  }
}
