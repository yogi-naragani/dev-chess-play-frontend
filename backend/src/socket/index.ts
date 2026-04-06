import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
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
  const jwtSecret = process.env.JWT_SECRET;

  // Authenticate socket connections via JWT middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication required: no token provided'));
    }
    if (!jwtSecret) {
      return next(new Error('Server configuration error'));
    }
    try {
      const decoded = jwt.verify(token, jwtSecret) as { id: string; username: string; userType: string };
      socket.data.userId = decoded.id;
      socket.data.username = decoded.username;
      socket.data.userType = decoded.userType;
      next();
    } catch {
      return next(new Error('Authentication failed: invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id} (user: ${socket.data.username})`);

    // Register user as online (already authenticated via middleware)
    onlineUsers.set(socket.data.userId, { socketId: socket.id, username: socket.data.username });
    io.emit('userOnline', { userId: socket.data.userId, username: socket.data.username });

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
