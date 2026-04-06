import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.js';

const prisma = new PrismaClient();

interface CreateUserBody {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'INSTRUCTOR' | 'STUDENT';
}

interface UpdateUserBody {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

interface IdParams {
  id: string;
}

interface ListQuery {
  page?: string;
  limit?: string;
  search?: string;
  userType?: string;
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // All admin routes require auth + admin role
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', app.requireRole('ADMIN'));

  // ==================== DASHBOARD ====================

  app.get('/dashboard', async (_request: FastifyRequest, reply: FastifyReply) => {
    const [totalStudents, totalInstructors, activeGames, activeLessons, recentGames] = await Promise.all([
      prisma.user.count({ where: { userType: 'STUDENT' } }),
      prisma.user.count({ where: { userType: 'INSTRUCTOR' } }),
      prisma.game.count({ where: { result: null } }),
      prisma.lesson.count({ where: { status: 'LIVE' } }),
      prisma.game.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          white: { select: { id: true, username: true, firstName: true, lastName: true } },
          black: { select: { id: true, username: true, firstName: true, lastName: true } }
        }
      })
    ]);

    return reply.send({
      totalStudents,
      totalInstructors,
      activeGames,
      activeLessons,
      recentGames
    });
  });

  // ==================== INSTRUCTORS ====================

  app.get('/instructors', async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
    const page = Math.max(1, parseInt(request.query.page || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '20') || 20));
    const search = request.query.search?.slice(0, 200);

    const where: any = { userType: 'INSTRUCTOR' as const };
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [instructors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, username: true, email: true, firstName: true, lastName: true,
          profileImage: true, status: true, createdAt: true,
          _count: { select: { instructorLessons: true, instructorOf: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return reply.send({ data: instructors, total, page, limit, totalPages: Math.ceil(total / limit) });
  });

  app.post('/instructors', async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
    const { username, email, password, firstName, lastName } = request.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existing) {
      return reply.status(400).send({ message: 'Username or email already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, firstName, lastName, userType: 'INSTRUCTOR' },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, userType: true, createdAt: true }
    });

    return reply.status(201).send(user);
  });

  app.get('/instructors/:id', async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    const instructor = await prisma.user.findFirst({
      where: { id: request.params.id, userType: 'INSTRUCTOR' },
      select: {
        id: true, username: true, email: true, firstName: true, lastName: true,
        profileImage: true, status: true, createdAt: true,
        instructorLessons: { take: 10, orderBy: { scheduledAt: 'desc' } },
        instructorOf: { include: { student: { select: { id: true, username: true, firstName: true, lastName: true, rating: true } } } }
      }
    });

    if (!instructor) return reply.status(404).send({ message: 'Instructor not found' });
    return reply.send(instructor);
  });

  app.put('/instructors/:id', async (request: FastifyRequest<{ Params: IdParams; Body: UpdateUserBody }>, reply: FastifyReply) => {
    const user = await prisma.user.update({
      where: { id: request.params.id },
      data: request.body,
      select: { id: true, username: true, email: true, firstName: true, lastName: true, profileImage: true }
    });
    return reply.send(user);
  });

  app.delete('/instructors/:id', async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    await prisma.user.delete({ where: { id: request.params.id } });
    return reply.send({ message: 'Instructor deleted successfully' });
  });

  // ==================== STUDENTS ====================

  app.get('/students', async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
    const page = Math.max(1, parseInt(request.query.page || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '20') || 20));
    const search = request.query.search?.slice(0, 200);

    const where: any = { userType: 'STUDENT' as const };
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, username: true, email: true, firstName: true, lastName: true,
          profileImage: true, rating: true, puzzleRating: true, status: true, createdAt: true,
          _count: { select: { gamesAsWhite: true, gamesAsBlack: true, enrolledLessons: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return reply.send({ data: students, total, page, limit, totalPages: Math.ceil(total / limit) });
  });

  app.post('/students', async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
    const { username, email, password, firstName, lastName } = request.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existing) {
      return reply.status(400).send({ message: 'Username or email already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, firstName, lastName, userType: 'STUDENT' },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, userType: true, rating: true, createdAt: true }
    });

    return reply.status(201).send(user);
  });

  app.get('/students/:id', async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    const student = await prisma.user.findFirst({
      where: { id: request.params.id, userType: 'STUDENT' },
      select: {
        id: true, username: true, email: true, firstName: true, lastName: true,
        profileImage: true, rating: true, puzzleRating: true, status: true, createdAt: true,
        gamesAsWhite: { take: 10, orderBy: { createdAt: 'desc' }, include: { black: { select: { username: true } } } },
        gamesAsBlack: { take: 10, orderBy: { createdAt: 'desc' }, include: { white: { select: { username: true } } } },
        enrolledLessons: { take: 10, include: { lesson: true } }
      }
    });

    if (!student) return reply.status(404).send({ message: 'Student not found' });
    return reply.send(student);
  });

  app.put('/students/:id', async (request: FastifyRequest<{ Params: IdParams; Body: UpdateUserBody }>, reply: FastifyReply) => {
    const user = await prisma.user.update({
      where: { id: request.params.id },
      data: request.body,
      select: { id: true, username: true, email: true, firstName: true, lastName: true, profileImage: true }
    });
    return reply.send(user);
  });

  app.delete('/students/:id', async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    await prisma.user.delete({ where: { id: request.params.id } });
    return reply.send({ message: 'Student deleted successfully' });
  });

  // ==================== ASSIGN INSTRUCTOR-STUDENT ====================

  app.post('/assign', async (request: FastifyRequest<{ Body: { instructorId: string; studentId: string } }>, reply: FastifyReply) => {
    const { instructorId, studentId } = request.body;
    const assignment = await prisma.instructorStudent.create({
      data: { instructorId, studentId }
    });
    return reply.status(201).send(assignment);
  });

  app.delete('/assign/:id', async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    await prisma.instructorStudent.delete({ where: { id: request.params.id } });
    return reply.send({ message: 'Assignment removed' });
  });

  // ==================== COURSES ====================

  app.get('/courses', async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
    const courses = await prisma.course.findMany({
      include: { _count: { select: { lessons: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return reply.send(courses);
  });

  app.post('/courses', async (request: FastifyRequest<{ Body: { name: string; description?: string; level: string } }>, reply: FastifyReply) => {
    const course = await prisma.course.create({ data: request.body });
    return reply.status(201).send(course);
  });

  app.put('/courses/:id', async (request: FastifyRequest<{ Params: IdParams; Body: any }>, reply: FastifyReply) => {
    const course = await prisma.course.update({ where: { id: request.params.id }, data: request.body });
    return reply.send(course);
  });

  app.delete('/courses/:id', async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
    await prisma.course.delete({ where: { id: request.params.id } });
    return reply.send({ message: 'Course deleted' });
  });
}
