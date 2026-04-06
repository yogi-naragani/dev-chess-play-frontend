import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatMessage, ChatRoom } from '../utils/mongodb.js';

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  // Get user's chat rooms
  app.get('/rooms', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const rooms = await ChatRoom.find({ participants: user.id }).sort({ createdAt: -1 });
    return reply.send(rooms);
  });

  // Create chat room
  app.post('/rooms', async (request: FastifyRequest<{ Body: { type: string; name?: string; participants: string[] } }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { type, name, participants } = request.body;

    // Ensure creator is a participant
    const allParticipants = [...new Set([user.id, ...participants])];

    // For direct messages, check if room already exists
    if (type === 'direct' && allParticipants.length === 2) {
      const existing = await ChatRoom.findOne({
        type: 'direct',
        participants: { $all: allParticipants, $size: 2 }
      });
      if (existing) return reply.send(existing);
    }

    const room = await ChatRoom.create({ type, name, participants: allParticipants });
    return reply.status(201).send(room);
  });

  // Get messages for a room
  app.get('/rooms/:roomId/messages', async (request: FastifyRequest<{ Params: { roomId: string }; Querystring: { limit?: string; before?: string } }>, reply: FastifyReply) => {
    const { roomId } = request.params;
    const limit = parseInt(request.query.limit || '50');
    const filter: any = { roomId };
    if (request.query.before) {
      filter.createdAt = { $lt: new Date(request.query.before) };
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    return reply.send(messages.reverse());
  });

  // Send message (REST fallback - primary is via Socket.io)
  app.post('/rooms/:roomId/messages', async (request: FastifyRequest<{ Params: { roomId: string }; Body: { content: string; type?: string } }>, reply: FastifyReply) => {
    const user = request.user as { id: string; username: string };
    const { roomId } = request.params;
    const { content, type = 'text' } = request.body;

    const message = await ChatMessage.create({
      roomId,
      senderId: user.id,
      senderName: user.username,
      content,
      type
    });

    return reply.status(201).send(message);
  });
}
