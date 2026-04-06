import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { calculateElo } from '../utils/elo.js';
import { GameMoveHistory } from '../utils/mongodb.js';

const prisma = new PrismaClient();

interface CreateGameBody {
  opponentId: string;
  timeControl: number; // seconds
  isRated?: boolean;
  tournamentId?: string;
}

interface RecordResultBody {
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'ABANDONED';
  pgn?: string;
  fen?: string;
}

export async function gameRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  // Create a new game
  app.post('/', async (request: FastifyRequest<{ Body: CreateGameBody }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { opponentId, timeControl, isRated = true, tournamentId } = request.body;

    // Randomly assign colors
    const isWhite = Math.random() < 0.5;
    const whiteId = isWhite ? user.id : opponentId;
    const blackId = isWhite ? opponentId : user.id;

    const game = await prisma.game.create({
      data: { whiteId, blackId, timeControl, isRated, tournamentId },
      include: {
        white: { select: { id: true, username: true, firstName: true, lastName: true, rating: true } },
        black: { select: { id: true, username: true, firstName: true, lastName: true, rating: true } }
      }
    });

    // Create move history document in MongoDB
    await GameMoveHistory.create({ gameId: game.id, moves: [] });

    return reply.status(201).send(game);
  });

  // Get game by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const game = await prisma.game.findUnique({
      where: { id: request.params.id },
      include: {
        white: { select: { id: true, username: true, firstName: true, lastName: true, rating: true } },
        black: { select: { id: true, username: true, firstName: true, lastName: true, rating: true } },
        tournament: { select: { id: true, name: true } }
      }
    });

    if (!game) return reply.status(404).send({ message: 'Game not found' });

    // Get move history from MongoDB
    const moveHistory = await GameMoveHistory.findOne({ gameId: game.id });

    return reply.send({ ...game, moves: moveHistory?.moves || [] });
  });

  // Record game result
  app.post('/:id/result', async (request: FastifyRequest<{ Params: { id: string }; Body: RecordResultBody }>, reply: FastifyReply) => {
    const { result, pgn, fen } = request.body;

    const game = await prisma.game.findUnique({
      where: { id: request.params.id },
      include: {
        white: { select: { id: true, rating: true } },
        black: { select: { id: true, rating: true } }
      }
    });

    if (!game) return reply.status(404).send({ message: 'Game not found' });
    if (game.result) return reply.status(400).send({ message: 'Game result already recorded' });

    let ratingChange = 0;

    if (game.isRated) {
      const eloResult = result === 'WHITE_WIN' ? 1 : result === 'BLACK_WIN' ? 0 : 0.5;
      const elo = calculateElo(game.white.rating, game.black.rating, eloResult);
      ratingChange = elo.changeWhite;

      // Update ratings
      await Promise.all([
        prisma.user.update({ where: { id: game.whiteId }, data: { rating: elo.newRatingWhite } }),
        prisma.user.update({ where: { id: game.blackId }, data: { rating: elo.newRatingBlack } })
      ]);
    }

    const updatedGame = await prisma.game.update({
      where: { id: request.params.id },
      data: { result, pgn, fen, ratingChange },
      include: {
        white: { select: { id: true, username: true, rating: true } },
        black: { select: { id: true, username: true, rating: true } }
      }
    });

    return reply.send(updatedGame);
  });

  // Get game history for current user
  app.get('/history/me', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const page = Math.max(1, parseInt(request.query.page || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '20') || 20));

    const where = {
      OR: [{ whiteId: user.id }, { blackId: user.id }]
    };

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        include: {
          white: { select: { id: true, username: true, firstName: true, lastName: true } },
          black: { select: { id: true, username: true, firstName: true, lastName: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.game.count({ where })
    ]);

    return reply.send({ data: games, total, page, limit });
  });
}
