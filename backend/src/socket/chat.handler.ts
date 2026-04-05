import { Server, Socket } from 'socket.io';
import { ChatMessage } from '../utils/mongodb.js';

export function chatHandler(io: Server, socket: Socket): void {
  // Join a chat room
  socket.on('joinChatRoom', (roomId: string) => {
    socket.join(`chat:${roomId}`);
  });

  // Leave chat room
  socket.on('leaveChatRoom', (roomId: string) => {
    socket.leave(`chat:${roomId}`);
  });

  // Send message
  socket.on('sendMessage', async (data: { roomId: string; content: string; type?: string }) => {
    const message = await ChatMessage.create({
      roomId: data.roomId,
      senderId: socket.data.userId,
      senderName: socket.data.username,
      content: data.content,
      type: data.type || 'text'
    });

    io.to(`chat:${data.roomId}`).emit('newMessage', {
      id: message._id,
      roomId: data.roomId,
      senderId: socket.data.userId,
      senderName: socket.data.username,
      content: data.content,
      type: data.type || 'text',
      createdAt: message.createdAt
    });
  });

  // Typing indicator
  socket.on('typing', (data: { roomId: string }) => {
    socket.to(`chat:${data.roomId}`).emit('userTyping', {
      userId: socket.data.userId,
      username: socket.data.username,
      roomId: data.roomId
    });
  });

  socket.on('stopTyping', (data: { roomId: string }) => {
    socket.to(`chat:${data.roomId}`).emit('userStoppedTyping', {
      userId: socket.data.userId,
      roomId: data.roomId
    });
  });
}
