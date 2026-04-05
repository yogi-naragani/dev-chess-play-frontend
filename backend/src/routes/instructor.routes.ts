import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { StudentAnalytics } from '../utils/mongodb.js';

const prisma = new PrismaClient();

export async function instructorRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', app.requireRole('INSTRUCTOR', 'ADMIN'));

  // Get instructor's students
  app.get('/students', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const assignments = await prisma.instructorStudent.findMany({
      where: { instructorId: user.id },
      include: {
        student: {
          select: {
            id: true, username: true, email: true, firstName: true, lastName: true,
            rating: true, puzzleRating: true, status: true, profileImage: true
          }
        }
      }
    });

    return reply.send(assignments.map(a => a.student));
  });

  // Get specific student's progress
  app.get('/students/:id/progress', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const studentId = request.params.id;

    const [student, analytics, recentGames, lessonAttendance] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, username: true, firstName: true, lastName: true, rating: true, puzzleRating: true }
      }),
      StudentAnalytics.findOne({ studentId }),
      prisma.game.findMany({
        where: { OR: [{ whiteId: studentId }, { blackId: studentId }] },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          white: { select: { id: true, username: true } },
          black: { select: { id: true, username: true } }
        }
      }),
      prisma.lessonStudent.findMany({
        where: { studentId },
        include: { lesson: { select: { id: true, title: true, scheduledAt: true } } },
        orderBy: { lesson: { scheduledAt: 'desc' } },
        take: 20
      })
    ]);

    return reply.send({ student, analytics, recentGames, lessonAttendance });
  });

  // Get instructor dashboard data
  app.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const [studentCount, upcomingLessons, recentLessons, pendingHomework] = await Promise.all([
      prisma.instructorStudent.count({ where: { instructorId: user.id } }),
      prisma.lesson.findMany({
        where: { instructorId: user.id, status: 'SCHEDULED', scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: 'asc' },
        take: 5
      }),
      prisma.lesson.findMany({
        where: { instructorId: user.id, status: 'COMPLETED' },
        orderBy: { scheduledAt: 'desc' },
        take: 5
      }),
      prisma.assignment.findMany({
        where: { assignedById: user.id },
        include: { _count: { select: { submissions: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5
      })
    ]);

    return reply.send({ studentCount, upcomingLessons, recentLessons, pendingHomework });
  });
}
