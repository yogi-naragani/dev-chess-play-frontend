import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import { Router } from '@angular/router';
import { ChessGameComponent } from '../chess-game/chess-game.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChessGameComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  currentUser: User | null = null;
  isCreating = false;
  errorMessage = '';
  
  // Game state
  gameActive = false;
  gameId = '';
  gameStatus = 'Waiting for opponent';
  meetingRoom = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  getFullName(): string {
    if (this.currentUser?.first_name && this.currentUser?.last_name) {
      return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
    }
    // Fallback to username if first_name and last_name are not available
    return this.currentUser?.username || 'User';
  }

  createGame() {
    this.isCreating = true;
    this.errorMessage = '';
    
    // TODO: Implement game creation logic here
    // This will call your game creation API
    
    setTimeout(() => {
      this.isCreating = false;
      // Simulate game creation
      this.gameId = this.generateGameId();
      this.meetingRoom = `chess-game-${this.gameId}`;
      this.gameActive = true;
      this.gameStatus = 'Game created';
      
      console.log('Game created:', this.gameId);
    }, 1000);
  }

  endGame() {
    this.gameActive = false;
    this.gameId = '';
    this.meetingRoom = '';
    this.gameStatus = 'Waiting for opponent';
  }

  private generateGameId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // Logout successful, navigate to login
        this.router.navigate(['/login']);
      },
      error: (error) => {
        // Even if logout API fails, still navigate to login
        // (local storage is already cleared)
        console.error('Logout error:', error);
        this.router.navigate(['/login']);
      }
    });
  }
}
