import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService, Session, SessionResponse } from '../services/session.service';
import { SocketService, ChessMove } from '../services/socket.service';
import { Subscription } from 'rxjs';

// Import chess.js
import { Chess } from 'chess.js';

// Also try importing as default
import * as ChessJS from 'chess.js';

@Component({
  selector: 'app-chess-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chess-game.component.html',
  styleUrls: ['./chess-game.component.css']
})
export class ChessGameComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() gameId: string = '';
  @Input() meetingRoom: string = '';
  @Input() gameStatus: string = 'Waiting for opponent';
  @Output() endGame = new EventEmitter<void>();

  @ViewChild('chessBoard', { static: false }) chessBoardElement!: ElementRef;

  jitsiApi: any = null;
  isJitsiLoaded = false;
  session: Session | null = null;
  isLoading = false;
  errorMessage = '';
  isSocketConnected = false;

  // Chess game state
  game: Chess | null = null;
  boardPosition: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  selectedSquare: string | null = null;
  possibleMoves: string[] = [];
  isWhiteTurn = true;

  private socketSubscriptions: Subscription[] = [];

  constructor(
    private sessionService: SessionService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadJitsiMeet();
    this.createSession();
  }

  ngAfterViewInit() {
    this.initializeChessGame();
  }

  ngOnDestroy() {
    this.cleanupJitsi();
    this.cleanupSocket();
  }

  initializeChessGame() {
    try {
      // Try the named import first
      this.game = new Chess();
      console.log('Chess game initialized successfully');
      console.log('Initial FEN:', this.game.fen());
      console.log('Turn:', this.game.turn());
    } catch (error) {
      console.error('Failed to initialize with named import:', error);
      try {
        // Try the default import
        this.game = new (ChessJS as any).Chess();
        console.log('Chess game initialized with default import');
      } catch (error2) {
        console.error('Failed to initialize chess game:', error2);
        this.errorMessage = 'Failed to initialize chess game. Please refresh the page.';
        return;
      }
    }
    
    if (this.game) {
      this.updateBoardPosition();
      console.log('Board position updated');
    }
  }

  updateBoardPosition() {
    if (this.game) {
      this.boardPosition = this.game.fen();
      this.isWhiteTurn = this.game.turn() === 'w';
      // Force change detection
      this.cdr.detectChanges();
    }
  }

  cleanupSocket() {
    // Unsubscribe from all socket subscriptions
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    this.socketSubscriptions = [];

    // Disconnect socket if connected
    if (this.isSocketConnected && this.gameId) {
      this.socketService.leaveRoom(this.gameId);
      this.socketService.disconnect();
    }
  }

  createSession() {
    this.isLoading = true;
    this.errorMessage = '';

    this.sessionService.createSession().subscribe({
      next: (response) => {
        this.session = response.session;
        this.gameId = response.session.gameRoomId;
        this.meetingRoom = response.session.meetingId;
        this.gameStatus = 'Session created - Waiting for student';
        this.isLoading = false;
        console.log('Session created:', response.session);
        
        // Connect to socket after successful session creation
        this.connectSocket();
        
        // Initialize Jitsi meeting after session is created and DOM is ready
        setTimeout(() => {
          this.initializeJitsiMeetingWithRetry();
        }, 100);
      },
      error: (error) => {
        console.error('Error creating session:', error);
        this.errorMessage = error.message || 'Failed to create session';
        this.isLoading = false;
      }
    });
  }

  connectSocket() {
    if (!this.gameId) {
      console.error('Cannot connect socket: gameId is missing');
      return;
    }

    // Connect to socket with gameRoomId
    this.socketService.connect(this.gameId);

    // Subscribe to socket connection status
    const connectedSub = this.socketService.connected$.subscribe(connected => {
      this.isSocketConnected = connected;
      if (connected) {
        console.log('Socket connected to room:', this.gameId);
        // Join the game room as instructor
        this.socketService.joinRoomAsInstructor(this.gameId);
        this.gameStatus = 'Connected - Ready to play';
      } else {
        this.gameStatus = 'Disconnected';
      }
    });
    this.socketSubscriptions.push(connectedSub);

    // Subscribe to incoming chess moves
    const moveSub = this.socketService.move$.subscribe((move: ChessMove) => {
      console.log('Received move from socket:', move);
      this.handleIncomingMove(move);
    });
    this.socketSubscriptions.push(moveSub);

    // Subscribe to socket errors
    const errorSub = this.socketService.error$.subscribe(error => {
      console.error('Socket error:', error);
      this.errorMessage = `Socket error: ${error}`;
    });
    this.socketSubscriptions.push(errorSub);
  }

  handleIncomingMove(move: ChessMove) {
    // Handle incoming move from socket
    if (!this.game) return;

    try {
      const result = this.game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion
      });

      if (result) {
        this.updateBoardPosition();
        this.clearSelection();
        console.log('Move applied from socket:', result);
      }
    } catch (error) {
      console.error('Invalid move from socket:', error);
    }
  }

  onSquareClick(square: string) {
    console.log('Square clicked:', square);
    console.log('Game initialized:', !!this.game);
    console.log('Game over:', this.game?.isGameOver());
    console.log('Current turn:', this.game?.turn());
    console.log('Selected square:', this.selectedSquare);
    
    if (!this.game) {
      console.error('Cannot make move: game not initialized');
      return;
    }
    
    if (this.game.isGameOver()) {
      console.log('Game is over, cannot make moves');
      return;
    }

    // If no square is selected, select this square
    if (!this.selectedSquare) {
      const piece = this.game.get(square as any);
      console.log('Piece at', square, ':', piece);
      
      if (piece && piece.color === this.game.turn()) {
        this.selectedSquare = square;
        this.possibleMoves = this.game.moves({ square: square as any, verbose: true })
          .map(move => move.to);
        console.log('Selected piece at', square, 'with', this.possibleMoves.length, 'possible moves:', this.possibleMoves);
        // Force change detection to update UI
        this.cdr.detectChanges();
      } else {
        console.log('Cannot select square:', piece ? 'wrong color' : 'no piece');
      }
    } else {
      // Try to make a move
      console.log('Attempting move from', this.selectedSquare, 'to', square);
      this.tryMove(this.selectedSquare, square);
    }
  }

  tryMove(from: string, to: string) {
    console.log('tryMove called:', from, '->', to);
    
    if (!this.game) {
      console.error('Cannot make move: game not initialized');
      return;
    }

    // If clicking the same square, deselect
    if (from === to) {
      console.log('Same square clicked, clearing selection');
      this.clearSelection();
      return;
    }

    try {
      const move = this.game.move({
        from: from,
        to: to,
        promotion: 'q' // Default to queen promotion
      });

      console.log('Move attempt result:', move);

      if (move) {
        // Valid move made
        console.log('Move successful:', move.san, 'from', move.from, 'to', move.to);
        this.updateBoardPosition();
        this.clearSelection();

        // Send move via socket if connected
        if (this.isSocketConnected) {
          const chessMove: ChessMove = {
            from: move.from,
            to: move.to,
            piece: move.piece,
            promotion: move.promotion,
            timestamp: new Date()
          };
          console.log('Instructor sending move via socket:', chessMove);
          this.socketService.sendMove(chessMove, this.gameId);
          console.log('Move sent via socket successfully');
        } else {
          console.warn('Socket not connected, move not sent');
        }

        // Check for game over
        if (this.game.isGameOver()) {
          if (this.game.isCheckmate()) {
            this.gameStatus = `Checkmate! ${this.game.turn() === 'w' ? 'Black' : 'White'} wins!`;
          } else if (this.game.isDraw()) {
            this.gameStatus = 'Game ended in a draw!';
          }
        }
      } else {
        // Invalid move, clear selection
        console.log('Invalid move, clearing selection');
        this.clearSelection();
      }
    } catch (error) {
      console.error('Invalid move error:', error);
      this.clearSelection();
    }
  }

  clearSelection() {
    this.selectedSquare = null;
    this.possibleMoves = [];
    // Force change detection to update UI
    this.cdr.detectChanges();
  }

  testMove() {
    if (!this.game) {
      console.error('Cannot test move: game not initialized');
      return;
    }
    
    console.log('Testing move e2-e4...');
    console.log('Current FEN:', this.game.fen());
    console.log('Turn:', this.game.turn());
    this.tryMove('e2', 'e4');
  }

  getPieceAt(square: string): string | null {
    if (!this.game) {
      return null;
    }
    const piece = this.game.get(square as any);
    return piece ? piece.type + piece.color : null;
  }

  isSquareSelected(square: string): boolean {
    return this.selectedSquare === square;
  }

  isPossibleMove(square: string): boolean {
    return this.possibleMoves.includes(square);
  }

  isSquareHighlighted(square: string): boolean {
    return this.isSquareSelected(square) || this.isPossibleMove(square);
  }

  getSquareName(row: number, col: number): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[col] + ranks[row];
  }

  getPieceSymbol(piece: string | null): string {
    if (!piece) return '';
    
    const symbols: { [key: string]: string } = {
      'pw': '♙', 'pb': '♟',
      'rw': '♖', 'rb': '♜',
      'nw': '♘', 'nb': '♞',
      'bw': '♗', 'bb': '♝',
      'qw': '♕', 'qb': '♛',
      'kw': '♔', 'kb': '♚'
    };
    
    return symbols[piece] || '';
  }

  loadJitsiMeet() {
    // Load Jitsi Meet API script
    if (!this.isJitsiLoaded) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.onload = () => {
        this.isJitsiLoaded = true;
        console.log('Jitsi API loaded successfully');
        // Don't initialize here - wait for session creation
      };
      script.onerror = (error) => {
        console.error('Failed to load Jitsi API:', error);
      };
      document.head.appendChild(script);
    }
  }

  initializeJitsiMeetingWithRetry(retryCount = 0) {
    const maxRetries = 5;
    const retryDelay = 200;

    if (!this.meetingRoom || !this.isJitsiLoaded) {
      console.log('Cannot initialize Jitsi: missing meetingRoom or API not loaded');
      return;
    }

    // Check if the DOM element exists
    const parentNode = document.querySelector('#jitsi-meeting');
    if (!parentNode) {
      if (retryCount < maxRetries) {
        console.log(`Jitsi meeting container not found, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          this.initializeJitsiMeetingWithRetry(retryCount + 1);
        }, retryDelay);
        return;
      } else {
        console.error('Jitsi meeting container not found after maximum retries');
        return;
      }
    }

    this.initializeJitsiMeeting();
  }

  initializeJitsiMeeting() {
    if (!this.meetingRoom || !this.isJitsiLoaded) {
      console.log('Cannot initialize Jitsi: missing meetingRoom or API not loaded');
      return;
    }

    // Check if the DOM element exists
    const parentNode = document.querySelector('#jitsi-meeting');
    if (!parentNode) {
      console.error('Jitsi meeting container not found in DOM');
      return;
    }

    // Clean up any existing Jitsi instance
    if (this.jitsiApi) {
      this.cleanupJitsi();
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: this.meetingRoom,
      parentNode: parentNode,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop',
          'fullscreen', 'fodeviceselection', 'hangup', 'profile',
          'chat', 'recording', 'livestreaming', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts'
        ],
      },
    };

    try {
      // @ts-ignore - JitsiMeetExternalAPI is loaded dynamically
      this.jitsiApi = new JitsiMeetExternalAPI(domain, options);
      
      this.jitsiApi.addEventListeners({
        readyToClose: () => {
          this.cleanupJitsi();
        },
        participantLeft: () => {
          console.log('Participant left');
        },
        participantJoined: () => {
          console.log('Participant joined');
        },
      });
      
      console.log('Jitsi meeting initialized successfully');
    } catch (error) {
      console.error('Error initializing Jitsi:', error);
    }
  }

  cleanupJitsi() {
    if (this.jitsiApi) {
      try {
        this.jitsiApi.dispose();
      } catch (error) {
        console.error('Error disposing Jitsi:', error);
      }
      this.jitsiApi = null;
    }
  }

  onUndoMove() {
    if (!this.game || !this.isSocketConnected) {
      console.warn('Cannot undo move: game not initialized or socket not connected');
      return;
    }
    
    try {
      const move = this.game.undo();
      if (move) {
        this.updateBoardPosition();
        this.clearSelection();
        // Note: Backend doesn't have undo functionality, so we just update locally
        console.log('Move undone locally:', move);
      }
    } catch (error) {
      console.error('Cannot undo move:', error);
    }
  }

  onResetGame() {
    if (!this.game || !this.isSocketConnected) {
      console.warn('Cannot reset game: game not initialized or socket not connected');
      return;
    }
    
    this.game.reset();
    this.updateBoardPosition();
    this.clearSelection();
    this.gameStatus = 'Game reset - Ready to play';
    this.socketService.resetGame(this.gameId);
    console.log('Game reset');
  }

  onMoveChange(move?: { from: string; to: string; piece: string; promotion?: string }) {
    // This method is called when instructor makes a move
    if (!this.isSocketConnected) {
      console.warn('Cannot send move: socket not connected');
      return;
    }

    if (move) {
      const chessMove: ChessMove = {
        from: move.from,
        to: move.to,
        piece: move.piece,
        promotion: move.promotion,
        timestamp: new Date()
      };
      
      // Send move to socket
      this.socketService.sendMove(chessMove, this.gameId);
      console.log('Move sent via socket:', chessMove);
    }
  }

  onEndGame() {
    // Cleanup socket first
    this.cleanupSocket();
    
    if (this.session) {
      this.sessionService.endSession(this.session.id).subscribe({
        next: () => {
          console.log('Session ended successfully');
          this.cleanupJitsi();
          this.endGame.emit();
        },
        error: (error) => {
          console.error('Error ending session:', error);
          // Still cleanup and emit even if API call fails
          this.cleanupJitsi();
          this.endGame.emit();
        }
      });
    } else {
      this.cleanupJitsi();
      this.endGame.emit();
    }
  }
}
