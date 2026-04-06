import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { StudentAnalytics } from '../utils/mongodb.js';

const prisma = new PrismaClient();

export async function studentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', app.requireRole('STUDENT'));

  // Student dashboard data
  app.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const [profile, upcomingLessons, recentGames, pendingHomework, analytics] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, username: true, firstName: true, lastName: true, rating: true, puzzleRating: true }
      }),
      prisma.lessonStudent.findMany({
        where: { studentId: user.id, lesson: { status: 'SCHEDULED', scheduledAt: { gte: new Date() } } },
        include: { lesson: { include: { instructor: { select: { firstName: true, lastName: true } } } } },
        take: 5
      }),
      prisma.game.findMany({
        where: { OR: [{ whiteId: user.id }, { blackId: user.id }] },
        include: {
          white: { select: { id: true, username: true } },
          black: { select: { id: true, username: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.assignment.findMany({
        where: { dueDate: { gte: new Date() }, submissions: { none: { studentId: user.id } } },
        include: { assignedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5
      }),
      StudentAnalytics.findOne({ studentId: user.id })
    ]);

    return reply.send({ profile, upcomingLessons, recentGames, pendingHomework, analytics });
  });

  // Student progress
  app.get('/progress', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const [profile, analytics, gameStats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { rating: true, puzzleRating: true }
      }),
      StudentAnalytics.findOne({ studentId: user.id }),
      prisma.game.groupBy({
        by: ['result'],
        where: { OR: [{ whiteId: user.id }, { blackId: user.id }], result: { not: null } },
        _count: true
      })
    ]);

    return reply.send({ profile, analytics, gameStats });
  });

  // Get online students (for matchmaking)
  app.get('/online', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const students = await prisma.user.findMany({
      where: {
        userType: 'STUDENT',
        status: 'ONLINE',
        id: { not: user.id }
      },
      select: { id: true, username: true, firstName: true, lastName: true, rating: true }
    });

    return reply.send(students);
  });
}
