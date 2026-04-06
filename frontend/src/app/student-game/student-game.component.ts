import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService, ChessMove } from '../services/socket.service';
import { StudentService } from '../services/student.service';
import { Subscription } from 'rxjs';

// Import chess.js
import { Chess } from 'chess.js';

// Also try importing as default
import * as ChessJS from 'chess.js';

@Component({
  selector: 'app-student-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-game.component.html',
  styleUrls: ['./student-game.component.css']
})
export class StudentGameComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chessBoard', { static: false }) chessBoardElement!: ElementRef;
  @ViewChild('jitsiContainer', { static: false }) jitsiContainerElement!: ElementRef;

  // Game properties
  gameRoomId: string = '';
  meetingId: string = '';
  role: string = 'student';
  
  // Jitsi properties
  jitsiApi: any = null;
  isJitsiLoaded = false;
  
  // Game state
  game: Chess | null = null;
  boardPosition: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  selectedSquare: string | null = null;
  possibleMoves: string[] = [];
  isWhiteTurn = true;
  isSocketConnected = false;
  gameStatus = 'Connecting to game...';
  
  // UI state
  isLoading = true;
  errorMessage = '';
  
  private socketSubscriptions: Subscription[] = [];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private studentService = inject(StudentService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadJitsiMeet();
    this.initializeGame();
    this.initializeChessGame();
  }

  ngAfterViewInit() {
    // Initialize Jitsi after view is ready (ViewChild is now available)
    setTimeout(() => {
      if (this.meetingId && this.isJitsiLoaded) {
        this.initializeJitsiMeetingWithRetry();
      }
    }, 500);
  }

  ngOnDestroy() {
    this.cleanupJitsi();
    this.cleanupSocket();
  }

  initializeGame() {
    this.route.queryParams.subscribe(params => {
      this.gameRoomId = params['gameRoomId'] || '';
      this.meetingId = params['meetingId'] || '';
      this.role = params['role'] || 'student';

      if (!this.gameRoomId || !this.meetingId) {
        this.errorMessage = 'Missing game room or meeting information.';
        this.isLoading = false;
        return;
      }

      this.connectToGame();
    });
  }

  connectToGame() {
    this.isLoading = true;
    this.errorMessage = '';

    // Connect to socket
    this.socketService.connect(this.gameRoomId);

    // Subscribe to socket connection status
    const connectedSub = this.socketService.connected$.subscribe(connected => {
      this.isSocketConnected = connected;
      if (connected) {
        console.log('Student connected to game room:', this.gameRoomId);
        this.socketService.joinRoomAsStudent(this.gameRoomId);
        this.gameStatus = 'Connected - Waiting for instructor';
        this.isLoading = false;
        
        // Initialize Jitsi after connection and view is ready
        // Use a delay to ensure ViewChild is available (ngAfterViewInit has been called)
        setTimeout(() => {
          if (this.meetingId && this.isJitsiLoaded) {
            this.initializeJitsiMeetingWithRetry();
          } else {
            console.log('Waiting for meetingId or Jitsi API to load...', {
              meetingId: this.meetingId,
              isJitsiLoaded: this.isJitsiLoaded
            });
          }
        }, 1000);
      } else {
        this.gameStatus = 'Disconnected';
        this.errorMessage = 'Failed to connect to the game. Please check your connection.';
        this.isLoading = false;
      }
    });
    this.socketSubscriptions.push(connectedSub);

    // Subscribe to incoming chess moves
    const moveSub = this.socketService.move$.subscribe((move: ChessMove) => {
      console.log('Student received move from socket:', move);
      console.log('Socket subscription working, calling handleIncomingMove');
      this.handleIncomingMove(move);
    });
    this.socketSubscriptions.push(moveSub);
    
    console.log('Student move subscription created');

    // Subscribe to socket errors
    const errorSub = this.socketService.error$.subscribe(error => {
      console.error('Socket error:', error);
      this.errorMessage = `Connection error: ${error}`;
      this.isLoading = false;
    });
    this.socketSubscriptions.push(errorSub);
  }

  initializeChessGame() {
    try {
      this.game = new Chess();
      console.log('Chess game initialized for student');
    } catch (error) {
      try {
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
    }
  }

  updateBoardPosition() {
    if (this.game) {
      this.boardPosition = this.game.fen();
      this.isWhiteTurn = this.game.turn() === 'w';
      this.cdr.detectChanges();
    }
  }

  onSquareClick(square: string) {
    console.log('Student clicked square:', square);
    
    if (!this.game || this.game.isGameOver()) {
      return;
    }

    // Students can only select pieces, not make moves
    // Moves are received from the instructor via socket
    if (!this.selectedSquare) {
      const piece = this.game.get(square as any);
      
      if (piece) {
        this.selectedSquare = square;
        // Don't calculate possible moves for students
        this.possibleMoves = [];
        console.log('Student selected piece at', square);
        this.cdr.detectChanges();
      }
    } else {
      // Clear selection when clicking another square
      this.clearSelection();
    }
  }

  clearSelection() {
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.cdr.detectChanges();
  }

  handleIncomingMove(move: ChessMove) {
    console.log('handleIncomingMove called with:', move);
    console.log('Current game state:', this.game ? this.game.fen() : 'No game');
    
    if (!this.game) {
      console.error('Cannot handle move: game not initialized');
      return;
    }

    try {
      console.log('Attempting to apply move:', move.from, '->', move.to);
      const result = this.game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion
      });

      if (result) {
        console.log('Move successfully applied:', result);
        this.updateBoardPosition();
        this.clearSelection();
        console.log('Board position updated to:', this.game.fen());
      } else {
        console.error('Move was not applied - invalid move');
      }
    } catch (error) {
      console.error('Error applying move from instructor:', error);
      console.error('Move details:', move);
    }
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

  testIncomingMove() {
    console.log('Testing incoming move manually');
    const testMove: ChessMove = {
      from: 'e2',
      to: 'e4',
      piece: 'p',
      timestamp: new Date()
    };
    this.handleIncomingMove(testMove);
  }

  // Jitsi Meeting functionality
  loadJitsiMeet() {
    if (!this.isJitsiLoaded) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.onload = () => {
        this.isJitsiLoaded = true;
        console.log('Jitsi API loaded successfully');
      };
      script.onerror = (error) => {
        console.error('Failed to load Jitsi API:', error);
      };
      document.head.appendChild(script);
    }
  }

  initializeJitsiMeetingWithRetry(retryCount = 0) {
    const maxRetries = 10;
    const retryDelay = 300;

    if (!this.meetingId || !this.isJitsiLoaded) {
      console.log('Cannot initialize Jitsi: missing meetingId or API not loaded', {
        meetingId: this.meetingId,
        isJitsiLoaded: this.isJitsiLoaded
      });
      if (retryCount < maxRetries) {
        setTimeout(() => {
          this.initializeJitsiMeetingWithRetry(retryCount + 1);
        }, retryDelay);
      }
      return;
    }

    // Try to find the container element
    let parentNode: HTMLElement | null = null;
    
    // First try ViewChild reference
    if (this.jitsiContainerElement?.nativeElement) {
      parentNode = this.jitsiContainerElement.nativeElement;
    } else {
      // Fallback to querySelector
      parentNode = document.querySelector('#jitsi-meeting') as HTMLElement;
    }

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

    // Ensure container has proper dimensions
    if (parentNode.offsetHeight === 0 || parentNode.offsetWidth === 0) {
      console.log('Jitsi container has zero dimensions, retrying...', {
        width: parentNode.offsetWidth,
        height: parentNode.offsetHeight
      });
      if (retryCount < maxRetries) {
        setTimeout(() => {
          this.initializeJitsiMeetingWithRetry(retryCount + 1);
        }, retryDelay);
        return;
      }
    }

    this.initializeJitsiMeeting(parentNode);
  }

  initializeJitsiMeeting(parentNode?: HTMLElement) {
    if (!this.meetingId || !this.isJitsiLoaded) {
      console.log('Cannot initialize Jitsi: missing meetingId or API not loaded');
      return;
    }

    // Get the container element
    let container: HTMLElement | null = null;
    
    if (parentNode) {
      container = parentNode;
    } else if (this.jitsiContainerElement?.nativeElement) {
      container = this.jitsiContainerElement.nativeElement;
    } else {
      container = document.querySelector('#jitsi-meeting') as HTMLElement;
    }

    if (!container) {
      console.error('Jitsi meeting container not found in DOM');
      return;
    }

    // Ensure container is visible and has dimensions
    if (container.offsetHeight === 0 || container.offsetWidth === 0) {
      console.error('Jitsi container has zero dimensions', {
        width: container.offsetWidth,
        height: container.offsetHeight,
        display: window.getComputedStyle(container).display
      });
      return;
    }

    console.log('Initializing Jitsi for student with container:', {
      width: container.offsetWidth,
      height: container.offsetHeight,
      meetingId: this.meetingId
    });

    if (this.jitsiApi) {
      this.cleanupJitsi();
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: this.meetingId,
      parentNode: container,
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
      this.jitsiApi = new (window as any).JitsiMeetExternalAPI(domain, options);
      
      this.jitsiApi.addEventListeners({
        readyToClose: () => {
          console.log('Jitsi ready to close');
          this.cleanupJitsi();
        },
        participantLeft: () => {
          console.log('Participant left');
        },
        participantJoined: () => {
          console.log('Participant joined');
        },
        videoConferenceJoined: () => {
          console.log('Student video conference joined successfully');
        },
        videoConferenceLeft: () => {
          console.log('Student video conference left');
        },
      });
      
      console.log('Jitsi meeting initialized successfully for student');
    } catch (error) {
      console.error('Error initializing Jitsi for student:', error);
      this.errorMessage = 'Failed to initialize video call. Please refresh the page.';
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

  cleanupSocket() {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    this.socketSubscriptions = [];

    if (this.isSocketConnected && this.gameRoomId) {
      this.socketService.leaveRoom(this.gameRoomId);
      this.socketService.disconnect();
    }
  }

  leaveGame() {
    this.cleanupSocket();
    this.cleanupJitsi();
    this.router.navigate(['/student-dashboard']);
  }
}
