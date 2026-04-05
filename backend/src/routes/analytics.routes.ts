import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { StudentAnalytics, Puzzle, MoveSequence } from '../utils/mongodb.js';

const prisma = new PrismaClient();

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  // Academy-wide analytics (admin only)
  app.get('/academy', {
    preHandler: [app.requireRole('ADMIN')]
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const [
      totalUsers,
      totalGames,
      totalLessons,
      totalVideos,
      totalPuzzles,
      totalMoveSequences,
      activeStudents,
      usersByType,
      recentGames
    ] = await Promise.all([
      prisma.user.count(),
      prisma.game.count(),
      prisma.lesson.count(),
      prisma.video.count(),
      Puzzle.countDocuments(),
      MoveSequence.countDocuments(),
      prisma.user.count({ where: { userType: 'STUDENT', status: 'ONLINE' } }),
      prisma.user.groupBy({ by: ['userType'], _count: true }),
      prisma.game.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          white: { select: { username: true } },
          black: { select: { username: true } }
        }
      })
    ]);

    return reply.send({
      totalUsers,
      totalGames,
      totalLessons,
      totalVideos,
      totalPuzzles,
      totalMoveSequences,
      activeStudents,
      usersByType: Object.fromEntries(usersByType.map(u => [u.userType, u._count])),
      recentGames
    });
  });

  // Student analytics (for instructor/admin viewing a student, or student viewing self)
  app.get('/student/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = request.user as { id: string; userType: string };
    const studentId = request.params.id;

    // Students can only view their own analytics
    if (user.userType === 'STUDENT' && user.id !== studentId) {
      return reply.status(403).send({ message: 'Cannot view other student analytics' });
    }

    const [profile, analytics, gamesAsWhite, gamesAsBlack, submissions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, username: true, firstName: true, lastName: true, rating: true, puzzleRating: true, createdAt: true }
      }),
      StudentAnalytics.findOne({ studentId }),
      prisma.game.count({ where: { whiteId: studentId, result: { not: null } } }),
      prisma.game.count({ where: { blackId: studentId, result: { not: null } } }),
      prisma.submission.findMany({
        where: { studentId },
        include: { assignment: { select: { title: true, type: true } } },
        orderBy: { submittedAt: 'desc' },
        take: 10
      })
    ]);

    return reply.send({
      profile,
      analytics,
      totalGames: gamesAsWhite + gamesAsBlack,
      recentSubmissions: submissions
    });
  });
}
