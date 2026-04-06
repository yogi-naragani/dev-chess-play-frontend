import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { GameMoveHistory } from '../utils/mongodb.js';

const prisma = new PrismaClient();

async function isGameParticipant(gameId: string, userId: string): Promise<boolean> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { whiteId: true, blackId: true }
  });
  if (!game) return false;
  return game.whiteId === userId || game.blackId === userId;
}

export function gameHandler(io: Server, socket: Socket): void {
  // Join a game room
  socket.on('joinGame', async (gameId: string) => {
    if (!socket.data.userId) return;
    const allowed = await isGameParticipant(gameId, socket.data.userId);
    if (!allowed) {
      socket.emit('gameError', { message: 'You are not a participant of this game' });
      return;
    }
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
    move: string;
    san: string;
    fen: string;
    timeLeft: number;
  }) => {
    if (!socket.data.userId) return;
    const { gameId, move, san, fen, timeLeft } = data;

    const allowed = await isGameParticipant(gameId, socket.data.userId);
    if (!allowed) {
      socket.emit('gameError', { message: 'You are not a participant of this game' });
      return;
    }

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
  socket.on('gameOver', async (data: { gameId: string; result: string; reason: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isGameParticipant(data.gameId, socket.data.userId);
    if (!allowed) return;

    io.to(`game:${data.gameId}`).emit('gameEnded', {
      result: data.result,
      reason: data.reason
    });
  });

  // Offer draw
  socket.on('offerDraw', async (data: { gameId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isGameParticipant(data.gameId, socket.data.userId);
    if (!allowed) return;

    socket.to(`game:${data.gameId}`).emit('drawOffered', {
      from: socket.data.userId,
      username: socket.data.username
    });
  });

  // Accept draw
  socket.on('acceptDraw', async (data: { gameId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isGameParticipant(data.gameId, socket.data.userId);
    if (!allowed) return;

    io.to(`game:${data.gameId}`).emit('drawAccepted', { gameId: data.gameId });
  });

  // Decline draw
  socket.on('declineDraw', async (data: { gameId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isGameParticipant(data.gameId, socket.data.userId);
    if (!allowed) return;

    socket.to(`game:${data.gameId}`).emit('drawDeclined', { gameId: data.gameId });
  });

  // Resign
  socket.on('resign', async (data: { gameId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isGameParticipant(data.gameId, socket.data.userId);
    if (!allowed) return;

    io.to(`game:${data.gameId}`).emit('playerResigned', {
      playerId: socket.data.userId,
      username: socket.data.username
    });
  });

  // Request takeback
  socket.on('requestTakeback', async (data: { gameId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isGameParticipant(data.gameId, socket.data.userId);
    if (!allowed) return;

    socket.to(`game:${data.gameId}`).emit('takebackRequested', {
      from: socket.data.userId,
      username: socket.data.username
    });
  });

  // Accept takeback
  socket.on('acceptTakeback', async (data: { gameId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isGameParticipant(data.gameId, socket.data.userId);
    if (!allowed) return;

    io.to(`game:${data.gameId}`).emit('takebackAccepted', { gameId: data.gameId });
  });

  // Decline takeback
  socket.on('declineTakeback', async (data: { gameId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isGameParticipant(data.gameId, socket.data.userId);
    if (!allowed) return;

    socket.to(`game:${data.gameId}`).emit('takebackDeclined', { gameId: data.gameId });
  });
}
