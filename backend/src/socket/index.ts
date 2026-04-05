import { Server, Socket } from 'socket.io';
import { gameHandler } from './game.handler.js';
import { matchmakingHandler } from './matchmaking.handler.js';
import { chatHandler } from './chat.handler.js';
import { lessonHandler } from './lesson.handler.js';
import { presenceHandler } from './presence.handler.js';

// Track online users
export const onlineUsers = new Map<string, { socketId: string; username: string }>();

// Track matchmaking queue
export const matchmakingQueue: Array<{ userId: string; username: string; rating: number; socketId: string }> = [];

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Auth data should be sent on connection
    socket.on('authenticate', (data: { userId: string; username: string }) => {
      onlineUsers.set(data.userId, { socketId: socket.id, username: data.username });
      socket.data.userId = data.userId;
      socket.data.username = data.username;

      // Broadcast online status
      io.emit('userOnline', { userId: data.userId, username: data.username });
      console.log(`User authenticated: ${data.username} (${data.userId})`);
    });

    // Register handlers
    gameHandler(io, socket);
    matchmakingHandler(io, socket);
    chatHandler(io, socket);
    lessonHandler(io, socket);
    presenceHandler(io, socket);

    // Disconnect
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        onlineUsers.delete(userId);

        // Remove from matchmaking queue
        const queueIndex = matchmakingQueue.findIndex(q => q.userId === userId);
        if (queueIndex !== -1) matchmakingQueue.splice(queueIndex, 1);

        io.emit('userOffline', { userId });
      }
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
