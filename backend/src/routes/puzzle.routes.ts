import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Puzzle, StudentAnalytics } from '../utils/mongodb.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreatePuzzleBody {
  fen: string;
  solution: string[];
  category: string;
  themes?: string[];
  rating?: number;
  description?: string;
}

export async function puzzleRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  // List puzzles
  app.get('/', async (request: FastifyRequest<{ Querystring: { category?: string; minRating?: string; maxRating?: string } }>, reply: FastifyReply) => {
    const { category, minRating, maxRating } = request.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = parseInt(minRating);
      if (maxRating) filter.rating.$lte = parseInt(maxRating);
    }

    const puzzles = await Puzzle.find(filter).sort({ createdAt: -1 });
    return reply.send(puzzles);
  });

  // Get daily puzzle (random puzzle near user's puzzle rating)
  app.get('/daily', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { puzzleRating: true } });
    const rating = dbUser?.puzzleRating || 1200;

    const puzzle = await Puzzle.aggregate([
      { $match: { rating: { $gte: rating - 200, $lte: rating + 200 } } },
      { $sample: { size: 1 } }
    ]);

    if (!puzzle.length) {
      const fallback = await Puzzle.aggregate([{ $sample: { size: 1 } }]);
      return reply.send(fallback[0] || null);
    }

    return reply.send(puzzle[0]);
  });

  // Create puzzle (admin only)
  app.post('/', {
    preHandler: [app.requireRole('ADMIN', 'INSTRUCTOR')]
  }, async (request: FastifyRequest<{ Body: CreatePuzzleBody }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const puzzle = await Puzzle.create({ ...request.body, createdBy: user.id });
    return reply.status(201).send(puzzle);
  });

  // Solve puzzle (student submits answer)
  app.post('/:id/solve', async (request: FastifyRequest<{ Params: { id: string }; Body: { moves: string[] } }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const puzzle = await Puzzle.findById(request.params.id);
    if (!puzzle) return reply.status(404).send({ message: 'Puzzle not found' });

    const { moves } = request.body;
    const correct = JSON.stringify(moves) === JSON.stringify(puzzle.solution);

    // Update puzzle rating and student analytics
    if (correct) {
      await StudentAnalytics.findOneAndUpdate(
        { studentId: user.id },
        { $inc: { puzzlesSolved: 1 }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
      // Simple rating adjustment
      await prisma.user.update({
        where: { id: user.id },
        data: { puzzleRating: { increment: 10 } }
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { puzzleRating: { decrement: 5 } }
      });
    }

    return reply.send({ correct, solution: puzzle.solution });
  });

  // Get puzzle by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const puzzle = await Puzzle.findById(request.params.id);
    if (!puzzle) return reply.status(404).send({ message: 'Puzzle not found' });
    return reply.send(puzzle);
  });

  // Delete puzzle
  app.delete('/:id', {
    preHandler: [app.requireRole('ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await Puzzle.findByIdAndDelete(request.params.id);
    return reply.send({ message: 'Puzzle deleted' });
  });
}
