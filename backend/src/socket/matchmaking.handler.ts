import { Server, Socket } from 'socket.io';
import { onlineUsers, matchmakingQueue } from './index.js';

const RATING_RANGE = 200; // Match players within 200 rating points

export function matchmakingHandler(io: Server, socket: Socket): void {
  // Challenge a specific player
  socket.on('challengePlayer', (data: { targetId: string; timeControl: number }) => {
    const target = onlineUsers.get(data.targetId);
    if (!target) {
      socket.emit('challengeError', { message: 'Player is not online' });
      return;
    }

    io.to(target.socketId).emit('challengeReceived', {
      from: socket.data.userId,
      username: socket.data.username,
      timeControl: data.timeControl
    });
  });

  // Accept challenge
  socket.on('acceptChallenge', (data: { challengerId: string; timeControl: number }) => {
    const challenger = onlineUsers.get(data.challengerId);
    if (!challenger) {
      socket.emit('challengeError', { message: 'Challenger is no longer online' });
      return;
    }

    // Create a game room ID
    const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Notify both players
    const matchData = {
      gameId,
      timeControl: data.timeControl,
      white: { id: data.challengerId, username: challenger.username },
      black: { id: socket.data.userId, username: socket.data.username }
    };

    io.to(challenger.socketId).emit('matchFound', matchData);
    socket.emit('matchFound', matchData);
  });

  // Decline challenge
  socket.on('declineChallenge', (data: { challengerId: string }) => {
    const challenger = onlineUsers.get(data.challengerId);
    if (challenger) {
      io.to(challenger.socketId).emit('challengeDeclined', {
        by: socket.data.userId,
        username: socket.data.username
      });
    }
  });

  // Join matchmaking queue
  socket.on('joinQueue', (data: { rating: number; timeControl?: number }) => {
    // Check if already in queue
    const existing = matchmakingQueue.findIndex(q => q.userId === socket.data.userId);
    if (existing !== -1) {
      socket.emit('queueError', { message: 'Already in queue' });
      return;
    }

    const entry = {
      userId: socket.data.userId,
      username: socket.data.username,
      rating: data.rating,
      socketId: socket.id
    };

    // Try to find a match
    const matchIndex = matchmakingQueue.findIndex(
      q => Math.abs(q.rating - data.rating) <= RATING_RANGE
    );

    if (matchIndex !== -1) {
      const opponent = matchmakingQueue.splice(matchIndex, 1)[0];
      const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const matchData = {
        gameId,
        timeControl: data.timeControl || 600,
        white: { id: entry.userId, username: entry.username },
        black: { id: opponent.userId, username: opponent.username }
      };

      io.to(socket.id).emit('matchFound', matchData);
      io.to(opponent.socketId).emit('matchFound', matchData);
    } else {
      matchmakingQueue.push(entry);
      socket.emit('queueJoined', { position: matchmakingQueue.length });
    }
  });

  // Leave matchmaking queue
  socket.on('leaveQueue', () => {
    const index = matchmakingQueue.findIndex(q => q.userId === socket.data.userId);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      socket.emit('queueLeft');
    }
  });
}
