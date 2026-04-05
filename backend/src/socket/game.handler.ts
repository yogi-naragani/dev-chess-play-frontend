import { Server, Socket } from 'socket.io';
import { GameMoveHistory } from '../utils/mongodb.js';

export function gameHandler(io: Server, socket: Socket): void {
  // Join a game room
  socket.on('joinGame', (gameId: string) => {
    socket.join(`game:${gameId}`);
    console.log(`${socket.data.username} joined game ${gameId}`);
  });

  // Leave game room
  socket.on('leaveGame', (gameId: string) => {
    socket.leave(`game:${gameId}`);
  });

  // Player makes a move
  socket.on('playerMove', async (data: {
    gameId: string;
    move: string;    // UCI format: e2e4
    san: string;     // Standard notation: e4
    fen: string;     // Position after move
    timeLeft: number;
  }) => {
    const { gameId, move, san, fen, timeLeft } = data;

    // Save move to MongoDB
    await GameMoveHistory.findOneAndUpdate(
      { gameId },
      { $push: { moves: { move, san, fen, timestamp: new Date(), timeLeft } } }
    );

    // Broadcast to opponent in the game room
    socket.to(`game:${gameId}`).emit('opponentMove', {
      move,
      san,
      fen,
      timeLeft,
      playerId: socket.data.userId
    });
  });

  // Game over
  socket.on('gameOver', (data: { gameId: string; result: string; reason: string }) => {
    io.to(`game:${data.gameId}`).emit('gameEnded', {
      result: data.result,
      reason: data.reason
    });
  });

  // Offer draw
  socket.on('offerDraw', (data: { gameId: string }) => {
    socket.to(`game:${data.gameId}`).emit('drawOffered', {
      from: socket.data.userId,
      username: socket.data.username
    });
  });

  // Accept draw
  socket.on('acceptDraw', (data: { gameId: string }) => {
    io.to(`game:${data.gameId}`).emit('drawAccepted', { gameId: data.gameId });
  });

  // Decline draw
  socket.on('declineDraw', (data: { gameId: string }) => {
    socket.to(`game:${data.gameId}`).emit('drawDeclined', { gameId: data.gameId });
  });

  // Resign
  socket.on('resign', (data: { gameId: string }) => {
    io.to(`game:${data.gameId}`).emit('playerResigned', {
      playerId: socket.data.userId,
      username: socket.data.username
    });
  });

  // Request takeback
  socket.on('requestTakeback', (data: { gameId: string }) => {
    socket.to(`game:${data.gameId}`).emit('takebackRequested', {
      from: socket.data.userId,
      username: socket.data.username
    });
  });

  // Accept takeback
  socket.on('acceptTakeback', (data: { gameId: string }) => {
    io.to(`game:${data.gameId}`).emit('takebackAccepted', { gameId: data.gameId });
  });

  // Decline takeback
  socket.on('declineTakeback', (data: { gameId: string }) => {
    socket.to(`game:${data.gameId}`).emit('takebackDeclined', { gameId: data.gameId });
  });
}
