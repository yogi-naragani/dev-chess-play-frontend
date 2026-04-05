import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateTournamentBody {
  name: string;
  description?: string;
  format: 'SWISS' | 'ROUND_ROBIN';
  timeControl: number;
  maxPlayers: number;
  startDate: string;
}

export async function tournamentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  // List tournaments
  app.get('/', async (request: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) => {
    const { status } = request.query;
    const where: any = {};
    if (status) where.status = status;

    const tournaments = await prisma.tournament.findMany({
      where,
      include: { _count: { select: { entries: true, games: true } } },
      orderBy: { startDate: 'desc' }
    });

    return reply.send(tournaments);
  });

  // Create tournament (admin only)
  app.post('/', {
    preHandler: [app.requireRole('ADMIN')]
  }, async (request: FastifyRequest<{ Body: CreateTournamentBody }>, reply: FastifyReply) => {
    const { name, description, format, timeControl, maxPlayers, startDate } = request.body;
    const tournament = await prisma.tournament.create({
      data: { name, description, format, timeControl, maxPlayers, startDate: new Date(startDate) }
    });
    return reply.status(201).send(tournament);
  });

  // Get tournament by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: request.params.id },
      include: {
        entries: {
          include: { user: { select: { id: true, username: true, firstName: true, lastName: true, rating: true } } },
          orderBy: { score: 'desc' }
        },
        games: {
          include: {
            white: { select: { id: true, username: true } },
            black: { select: { id: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!tournament) return reply.status(404).send({ message: 'Tournament not found' });
    return reply.send(tournament);
  });

  // Join tournament
  app.post('/:id/join', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const tournament = await prisma.tournament.findUnique({
      where: { id: request.params.id },
      include: { _count: { select: { entries: true } } }
    });

    if (!tournament) return reply.status(404).send({ message: 'Tournament not found' });
    if (tournament.status !== 'UPCOMING') return reply.status(400).send({ message: 'Tournament registration is closed' });
    if (tournament._count.entries >= tournament.maxPlayers) return reply.status(400).send({ message: 'Tournament is full' });

    const entry = await prisma.tournamentEntry.create({
      data: { tournamentId: request.params.id, userId: user.id }
    });

    return reply.status(201).send(entry);
  });

  // Leave tournament
  app.delete('/:id/leave', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    await prisma.tournamentEntry.deleteMany({
      where: { tournamentId: request.params.id, userId: user.id }
    });
    return reply.send({ message: 'Left tournament' });
  });

  // Start tournament (admin)
  app.post('/:id/start', {
    preHandler: [app.requireRole('ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const tournament = await prisma.tournament.update({
      where: { id: request.params.id },
      data: { status: 'ACTIVE', currentRound: 1 }
    });
    return reply.send(tournament);
  });

  // Update tournament
  app.put('/:id', {
    preHandler: [app.requireRole('ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    const tournament = await prisma.tournament.update({
      where: { id: request.params.id },
      data: request.body
    });
    return reply.send(tournament);
  });

  // Delete tournament
  app.delete('/:id', {
    preHandler: [app.requireRole('ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await prisma.tournament.delete({ where: { id: request.params.id } });
    return reply.send({ message: 'Tournament deleted' });
  });
}
