import { Server, Socket } from 'socket.io';
import { ChatMessage, ChatRoom } from '../utils/mongodb.js';

async function isRoomMember(roomId: string, userId: string): Promise<boolean> {
  const room = await ChatRoom.findOne({ _id: roomId, participants: userId });
  return !!room;
}

export function chatHandler(io: Server, socket: Socket): void {
  // Join a chat room
  socket.on('joinChatRoom', async (roomId: string) => {
    if (!socket.data.userId) return;
    const allowed = await isRoomMember(roomId, socket.data.userId);
    if (!allowed) {
      socket.emit('chatError', { message: 'You are not a member of this chat room' });
      return;
    }
    socket.join(`chat:${roomId}`);
  });

  // Leave chat room
  socket.on('leaveChatRoom', (roomId: string) => {
    socket.leave(`chat:${roomId}`);
  });

  // Send message
  socket.on('sendMessage', async (data: { roomId: string; content: string; type?: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isRoomMember(data.roomId, socket.data.userId);
    if (!allowed) {
      socket.emit('chatError', { message: 'You are not a member of this chat room' });
      return;
    }

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
  socket.on('typing', async (data: { roomId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isRoomMember(data.roomId, socket.data.userId);
    if (!allowed) return;

    socket.to(`chat:${data.roomId}`).emit('userTyping', {
      userId: socket.data.userId,
      username: socket.data.username,
      roomId: data.roomId
    });
  });

  socket.on('stopTyping', async (data: { roomId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isRoomMember(data.roomId, socket.data.userId);
    if (!allowed) return;

    socket.to(`chat:${data.roomId}`).emit('userStoppedTyping', {
      userId: socket.data.userId,
      roomId: data.roomId
    });
  });
}
