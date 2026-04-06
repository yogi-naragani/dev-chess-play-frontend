import { Server, Socket } from 'socket.io';
import { onlineUsers } from './index.js';

export function presenceHandler(io: Server, socket: Socket): void {
  // Get all online users
  socket.on('getOnlineUsers', () => {
    const users = Array.from(onlineUsers.entries()).map(([userId, data]) => ({
      userId,
      username: data.username
    }));
    socket.emit('onlineUsers', users);
  });

  // Ping to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });
}
