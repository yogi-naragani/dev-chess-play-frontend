import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateLessonBody {
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  courseId?: string;
  studentIds?: string[];
}

export async function lessonRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  // List lessons (filtered by role)
  app.get('/', async (request: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) => {
    const user = request.user as { id: string; userType: string };
    const { status } = request.query;

    const where: any = {};
    if (status) where.status = status;

    if (user.userType === 'INSTRUCTOR') {
      where.instructorId = user.id;
    } else if (user.userType === 'STUDENT') {
      where.students = { some: { studentId: user.id } };
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        instructor: { select: { id: true, username: true, firstName: true, lastName: true } },
        students: { include: { student: { select: { id: true, username: true, firstName: true, lastName: true } } } },
        course: { select: { id: true, name: true } }
      },
      orderBy: { scheduledAt: 'desc' }
    });

    return reply.send(lessons);
  });

  // Create lesson (instructor only)
  app.post('/', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest<{ Body: CreateLessonBody }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { title, description, scheduledAt, duration, courseId, studentIds } = request.body;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration,
        courseId,
        instructorId: user.id,
        students: studentIds ? {
          create: studentIds.map(studentId => ({ studentId }))
        } : undefined
      },
      include: {
        instructor: { select: { id: true, username: true, firstName: true, lastName: true } },
        students: { include: { student: { select: { id: true, username: true } } } }
      }
    });

    return reply.status(201).send(lesson);
  });

  // Get lesson by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: request.params.id },
      include: {
        instructor: { select: { id: true, username: true, firstName: true, lastName: true } },
        students: { include: { student: { select: { id: true, username: true, firstName: true, lastName: true } } } },
        course: true
      }
    });

    if (!lesson) return reply.status(404).send({ message: 'Lesson not found' });
    return reply.send(lesson);
  });

  // Update lesson
  app.put('/:id', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    const lesson = await prisma.lesson.update({
      where: { id: request.params.id },
      data: request.body
    });
    return reply.send(lesson);
  });

  // Start live lesson (sets status to LIVE)
  app.post('/:id/start', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const lesson = await prisma.lesson.update({
      where: { id: request.params.id },
      data: { status: 'LIVE' }
    });
    return reply.send(lesson);
  });

  // End lesson
  app.post('/:id/end', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const lesson = await prisma.lesson.update({
      where: { id: request.params.id },
      data: { status: 'COMPLETED' }
    });
    return reply.send(lesson);
  });

  // Mark student attendance
  app.post('/:id/attend', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const enrollment = await prisma.lessonStudent.updateMany({
      where: { lessonId: request.params.id, studentId: user.id },
      data: { attended: true }
    });
    return reply.send({ message: 'Attendance recorded', enrollment });
  });

  // Delete lesson
  app.delete('/:id', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await prisma.lesson.delete({ where: { id: request.params.id } });
    return reply.send({ message: 'Lesson deleted' });
  });
}
