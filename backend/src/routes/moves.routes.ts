import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MoveSequence } from '../utils/mongodb.js';

interface CreateMoveSequenceBody {
  title: string;
  category: string;
  opening?: string;
  pgn?: string;
  moves: Array<{ move: string; annotation?: string; fen: string; moveNumber: number }>;
  difficulty: string;
  tags?: string[];
}

export async function movesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  // List move sequences
  app.get('/', async (request: FastifyRequest<{ Querystring: { category?: string; difficulty?: string; search?: string } }>, reply: FastifyReply) => {
    const { category, difficulty, search } = request.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { opening: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sequences = await MoveSequence.find(filter).sort({ createdAt: -1 });
    return reply.send(sequences);
  });

  // Create move sequence (admin/instructor only)
  app.post('/', {
    preHandler: [app.requireRole('ADMIN', 'INSTRUCTOR')]
  }, async (request: FastifyRequest<{ Body: CreateMoveSequenceBody }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const sequence = await MoveSequence.create({
      ...request.body,
      createdBy: user.id
    });
    return reply.status(201).send(sequence);
  });

  // Get move sequence by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const sequence = await MoveSequence.findById(request.params.id);
    if (!sequence) return reply.status(404).send({ message: 'Move sequence not found' });
    return reply.send(sequence);
  });

  // Update move sequence
  app.put('/:id', {
    preHandler: [app.requireRole('ADMIN', 'INSTRUCTOR')]
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateMoveSequenceBody> }>, reply: FastifyReply) => {
    const sequence = await MoveSequence.findByIdAndUpdate(
      request.params.id,
      { ...request.body, updatedAt: new Date() },
      { new: true }
    );
    if (!sequence) return reply.status(404).send({ message: 'Move sequence not found' });
    return reply.send(sequence);
  });

  // Delete move sequence
  app.delete('/:id', {
    preHandler: [app.requireRole('ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await MoveSequence.findByIdAndDelete(request.params.id);
    return reply.send({ message: 'Move sequence deleted' });
  });
}
