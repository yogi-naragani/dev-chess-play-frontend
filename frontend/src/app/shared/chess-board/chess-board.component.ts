import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chess } from 'chess.js';

export type BoardMode = 'editor' | 'replay' | 'play' | 'view-only';

interface Square {
  row: number;
  col: number;
  piece: string;
  isLight: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isMoveHint: boolean;
  algebraic: string;
}

const PIECE_UNICODE: Record<string, string> = {
  'K': '\u2654', 'Q': '\u2655', 'R': '\u2656', 'B': '\u2657', 'N': '\u2658', 'P': '\u2659',
  'k': '\u265A', 'q': '\u265B', 'r': '\u265C', 'b': '\u265D', 'n': '\u265E', 'p': '\u265F'
};

@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.css'
})
export class ChessBoardComponent implements OnInit, OnChanges {
  @Input() mode: BoardMode = 'view-only';
  @Input() fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  @Input() flipped: boolean = false;
  @Input() playerColor: 'w' | 'b' | null = null; // null = both sides can move
  @Input() disabled: boolean = false;

  @Output() moveMade = new EventEmitter<{ from: string; to: string; san: string; fen: string }>();
  @Output() squareClicked = new EventEmitter<string>();

  chess!: Chess;
  squares: Square[][] = [];
  selectedSquare: string | null = null;
  possibleMoves: string[] = [];
  lastMove: { from: string; to: string } | null = null;
  gameStatus: string = '';

  ngOnInit(): void {
    this.chess = new Chess(this.fen);
    this.updateBoard();
    this.updateStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fen'] && !changes['fen'].firstChange) {
      this.chess = new Chess(this.fen);
      this.selectedSquare = null;
      this.possibleMoves = [];
      this.updateBoard();
      this.updateStatus();
    }
  }

  onSquareClick(row: number, col: number): void {
    if (this.disabled) return;

    const actualRow = this.flipped ? row : 7 - row;
    const actualCol = this.flipped ? 7 - col : col;
    const file = String.fromCharCode(97 + actualCol);
    const rank = (actualRow + 1).toString();
    const square = file + rank;

    if (this.mode === 'view-only') return;

    if (this.mode === 'editor') {
      this.squareClicked.emit(square);
      return;
    }

    // Play mode
    if (this.mode === 'play') {
      // Check if it's the player's turn
      if (this.playerColor && this.chess.turn() !== this.playerColor) return;

      if (this.selectedSquare) {
        // Try to make a move
        if (this.possibleMoves.includes(square)) {
          this.makeMove(this.selectedSquare, square);
        } else {
          // Select different piece
          this.selectSquare(square);
        }
      } else {
        this.selectSquare(square);
      }
    }
  }

  private selectSquare(square: string): void {
    const piece = this.chess.get(square as any);
    if (!piece) {
      this.selectedSquare = null;
      this.possibleMoves = [];
      this.updateBoard();
      return;
    }

    // Only select own pieces
    if (this.playerColor && piece.color !== this.playerColor) return;

    this.selectedSquare = square;
    const moves = this.chess.moves({ square: square as any, verbose: true });
    this.possibleMoves = moves.map(m => m.to);
    this.updateBoard();
  }

  private makeMove(from: string, to: string): void {
    try {
      const move = this.chess.move({ from: from as any, to: to as any, promotion: 'q' });
      if (move) {
        this.lastMove = { from, to };
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.updateBoard();
        this.updateStatus();

        this.moveMade.emit({
          from: move.from,
          to: move.to,
          san: move.san,
          fen: this.chess.fen()
        });
      }
    } catch {
      this.selectedSquare = null;
      this.possibleMoves = [];
      this.updateBoard();
    }
  }

  private updateBoard(): void {
    this.squares = [];
    for (let displayRow = 0; displayRow < 8; displayRow++) {
      const row: Square[] = [];
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        const actualRow = this.flipped ? displayRow : 7 - displayRow;
        const actualCol = this.flipped ? 7 - displayCol : displayCol;
        const file = String.fromCharCode(97 + actualCol);
        const rank = (actualRow + 1).toString();
        const algebraic = file + rank;
        const piece = this.chess.get(algebraic as any);

        row.push({
          row: displayRow,
          col: displayCol,
          piece: piece ? PIECE_UNICODE[piece.color === 'w' ? piece.type.toUpperCase() : piece.type] : '',
          isLight: (actualRow + actualCol) % 2 !== 0,
          isSelected: algebraic === this.selectedSquare,
          isHighlighted: !!(this.lastMove && (algebraic === this.lastMove.from || algebraic === this.lastMove.to)),
          isMoveHint: this.possibleMoves.includes(algebraic),
          algebraic
        });
      }
      this.squares.push(row);
    }
  }

  private updateStatus(): void {
    if (this.chess.isCheckmate()) {
      this.gameStatus = `Checkmate! ${this.chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
    } else if (this.chess.isDraw()) {
      this.gameStatus = 'Draw!';
    } else if (this.chess.isStalemate()) {
      this.gameStatus = 'Stalemate!';
    } else if (this.chess.isCheck()) {
      this.gameStatus = 'Check!';
    } else {
      this.gameStatus = `${this.chess.turn() === 'w' ? 'White' : 'Black'} to move`;
    }
  }

  // Public API for external control
  loadFen(fen: string): void {
    this.chess = new Chess(fen);
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.lastMove = null;
    this.updateBoard();
    this.updateStatus();
  }

  undoMove(): void {
    this.chess.undo();
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.updateBoard();
    this.updateStatus();
  }

  resetBoard(): void {
    this.chess.reset();
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.lastMove = null;
    this.updateBoard();
    this.updateStatus();
  }

  getCurrentFen(): string {
    return this.chess.fen();
  }
}
