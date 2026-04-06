import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface StockfishEvaluation {
  bestMove: string;
  score: number;
  depth: number;
  pv: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockfishService implements OnDestroy {
  private worker: Worker | null = null;
  private evalSubject = new Subject<StockfishEvaluation>();
  private bestMoveSubject = new Subject<string>();
  private isReady = false;

  public evaluation$ = this.evalSubject.asObservable();
  public bestMove$ = this.bestMoveSubject.asObservable();

  constructor() {}

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker('assets/stockfish/stockfish.js');
        this.worker.onmessage = (event: MessageEvent) => {
          this.handleMessage(event.data);
        };
        this.worker.onerror = (error) => {
          console.error('Stockfish worker error:', error);
          reject(error);
        };
        this.sendCommand('uci');
        this.sendCommand('isready');

        const readyCheck = setInterval(() => {
          if (this.isReady) {
            clearInterval(readyCheck);
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(readyCheck);
          if (!this.isReady) {
            reject(new Error('Stockfish initialization timeout'));
          }
        }, 5000);
      } catch (e) {
        reject(e);
      }
    });
  }

  private handleMessage(message: string): void {
    if (message === 'readyok') {
      this.isReady = true;
    }

    if (message.startsWith('bestmove')) {
      const parts = message.split(' ');
      if (parts[1]) {
        this.bestMoveSubject.next(parts[1]);
      }
    }

    if (message.startsWith('info') && message.includes('score')) {
      const depthMatch = message.match(/depth (\d+)/);
      const scoreMatch = message.match(/score cp (-?\d+)/);
      const mateMatch = message.match(/score mate (-?\d+)/);
      const pvMatch = message.match(/pv (.+)/);
      const bestMoveMatch = message.match(/pv (\S+)/);

      if (depthMatch) {
        const evaluation: StockfishEvaluation = {
          depth: parseInt(depthMatch[1], 10),
          score: scoreMatch ? parseInt(scoreMatch[1], 10) / 100 : (mateMatch ? (parseInt(mateMatch[1], 10) > 0 ? 999 : -999) : 0),
          bestMove: bestMoveMatch ? bestMoveMatch[1] : '',
          pv: pvMatch ? pvMatch[1] : ''
        };
        this.evalSubject.next(evaluation);
      }
    }
  }

  setPosition(fen: string): void {
    this.sendCommand(`position fen ${fen}`);
  }

  search(depth: number = 15): void {
    this.sendCommand(`go depth ${depth}`);
  }

  searchByTime(moveTime: number = 1000): void {
    this.sendCommand(`go movetime ${moveTime}`);
  }

  stop(): void {
    this.sendCommand('stop');
  }

  setDifficulty(level: number): void {
    // level 0-20, maps to Stockfish skill level
    this.sendCommand(`setoption name Skill Level value ${level}`);
  }

  setDepthForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'beginner': this.setDifficulty(1); return 3;
      case 'intermediate': this.setDifficulty(8); return 8;
      case 'advanced': this.setDifficulty(15); return 13;
      case 'master': this.setDifficulty(20); return 20;
      default: this.setDifficulty(8); return 8;
    }
  }

  getBestMove(fen: string, difficulty: string = 'intermediate'): void {
    const depth = this.setDepthForDifficulty(difficulty);
    this.setPosition(fen);
    this.search(depth);
  }

  getHint(fen: string): void {
    this.setPosition(fen);
    this.search(15);
  }

  private sendCommand(command: string): void {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  destroy(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
  }
}
