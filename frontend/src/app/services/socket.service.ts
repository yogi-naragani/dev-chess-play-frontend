import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

export interface ChessMove {
  from: string;
  to: string;
  piece: string;
  promotion?: string;
  timestamp: Date;
}

export interface GameState {
  fen: string;
  moves: ChessMove[];
  turn: 'w' | 'b';
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = 'http://localhost:3000';
  
  private moveSubject = new Subject<ChessMove>();
  private gameStateSubject = new Subject<GameState>();
  private connectedSubject = new Subject<boolean>();
  private errorSubject = new Subject<string>();

  public move$ = this.moveSubject.asObservable();
  public gameState$ = this.gameStateSubject.asObservable();
  public connected$ = this.connectedSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor() {}

  connect(gameRoomId: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const token = localStorage.getItem('accessToken');
    
    this.socket = io(this.SOCKET_URL, {
      auth: {
        token: token,
        gameRoomId: gameRoomId
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connectedSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.errorSubject.next(error.message || 'Connection failed');
    });

    // Listen for instructor moves (backend sends 'instructorMoveMade')
    this.socket.on('instructorMoveMade', (data: { gameRoomId: string; move: any; fen: string; turn: string; isGameOver: boolean; isCheck: boolean; isCheckmate: boolean; isDraw: boolean }) => {
      console.log('Socket received instructorMoveMade event:', data);
      
      // Convert backend move format to our ChessMove format
      const chessMove: ChessMove = {
        from: data.move.from,
        to: data.move.to,
        piece: data.move.piece,
        promotion: data.move.promotion,
        timestamp: new Date()
      };
      
      console.log('Emitting to moveSubject:', chessMove);
      this.moveSubject.next(chessMove);
    });

    // Listen for game state updates
    this.socket.on('gameReset', (data: { gameRoomId: string; fen: string }) => {
      console.log('Received game reset:', data);
      // You might want to handle game reset here
    });

    // Listen for instructor connection
    this.socket.on('instructorConnected', (data: { gameRoomId: string }) => {
      console.log('Instructor connected to room:', data.gameRoomId);
    });

    // Listen for student connection
    this.socket.on('studentConnected', (data: { gameRoomId: string; studentId: string }) => {
      console.log('Student connected to room:', data.gameRoomId, 'Student ID:', data.studentId);
    });
  }

  // Send a chess move made by the instructor
  sendMove(move: ChessMove, gameRoomId?: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      this.errorSubject.next('Socket not connected');
      return;
    }

    // Get gameRoomId from parameter or socket auth
    const roomId = gameRoomId || (this.socket.auth as any)?.gameRoomId;
    if (!roomId) {
      console.error('No gameRoomId available');
      this.errorSubject.next('No game room ID available');
      return;
    }

    // Convert to backend expected format (SAN notation)
    const moveString = `${move.from}${move.to}${move.promotion || ''}`;
    
    console.log('SocketService: Sending instructor move via socket:', { gameRoomId: roomId, move: moveString });
    this.socket.emit('instructorMove', { gameRoomId: roomId, move: moveString });
    console.log('SocketService: Move emitted successfully');
  }

  // Join a specific game room as instructor
  joinRoomAsInstructor(gameRoomId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Instructor joining room:', gameRoomId);
    this.socket.emit('instructorJoin', { gameRoomId });
  }

  // Join a specific game room as student
  joinRoomAsStudent(gameRoomId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Student joining room:', gameRoomId);
    this.socket.emit('studentJoin', { gameRoomId }, (response: any) => {
      if (response?.error) {
        console.error('Student join error:', response.error);
        this.errorSubject.next(response.error);
      } else {
        console.log('Student join successful:', response);
      }
    });
  }

  // Legacy method for backward compatibility
  joinRoom(gameRoomId: string): void {
    // Default to instructor join for now
    this.joinRoomAsInstructor(gameRoomId);
  }

  // Leave the current game room
  leaveRoom(gameRoomId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log('Leaving room:', gameRoomId);
    this.socket.emit('leaveGameRoom', gameRoomId);
  }

  // Request current game state
  requestGameState(gameRoomId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Requesting game state for room:', gameRoomId);
    this.socket.emit('getGameState', gameRoomId, (response: any) => {
      if (response?.error) {
        console.error('Game state error:', response.error);
        this.errorSubject.next(response.error);
      } else {
        console.log('Game state received:', response);
        // You might want to emit this to a game state subject
      }
    });
  }

  // Send game reset (only instructor can reset)
  resetGame(gameRoomId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Resetting game for room:', gameRoomId);
    this.socket.emit('resetGame', gameRoomId);
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }
}
