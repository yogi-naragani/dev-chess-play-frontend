import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateAssignmentBody {
  title: string;
  description: string;
  type: string;
  data: any;
  dueDate: string;
}

export async function homeworkRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  // List assignments (filtered by role)
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; userType: string };

    if (user.userType === 'INSTRUCTOR' || user.userType === 'ADMIN') {
      const assignments = await prisma.assignment.findMany({
        where: user.userType === 'INSTRUCTOR' ? { assignedById: user.id } : {},
        include: { _count: { select: { submissions: true } } },
        orderBy: { createdAt: 'desc' }
      });
      return reply.send(assignments);
    }

    // Student: get assignments where they have a submission or are enrolled in instructor's classes
    const assignments = await prisma.assignment.findMany({
      include: {
        assignedBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        submissions: { where: { studentId: user.id } }
      },
      orderBy: { dueDate: 'asc' }
    });

    return reply.send(assignments);
  });

  // Create assignment (instructor/admin)
  app.post('/', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest<{ Body: CreateAssignmentBody }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { title, description, type, data, dueDate } = request.body;

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        type,
        data,
        dueDate: new Date(dueDate),
        assignedById: user.id
      }
    });

    return reply.status(201).send(assignment);
  });

  // Get assignment by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const assignment = await prisma.assignment.findUnique({
      where: { id: request.params.id },
      include: {
        assignedBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        submissions: {
          include: { student: { select: { id: true, username: true, firstName: true, lastName: true } } }
        }
      }
    });

    if (!assignment) return reply.status(404).send({ message: 'Assignment not found' });
    return reply.send(assignment);
  });

  // Submit homework (student)
  app.post('/:id/submit', {
    preHandler: [app.requireRole('STUDENT')]
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { answer: any } }>, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { answer } = request.body;

    const submission = await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId: request.params.id, studentId: user.id } },
      create: { assignmentId: request.params.id, studentId: user.id, answer },
      update: { answer, submittedAt: new Date() }
    });

    return reply.send(submission);
  });

  // Grade submission (instructor)
  app.post('/:id/grade/:submissionId', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string; submissionId: string }; Body: { grade: number; feedback?: string } }>, reply: FastifyReply) => {
    const { grade, feedback } = request.body;

    const submission = await prisma.submission.update({
      where: { id: request.params.submissionId },
      data: { grade, feedback, gradedAt: new Date() }
    });

    return reply.send(submission);
  });

  // Delete assignment
  app.delete('/:id', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await prisma.assignment.delete({ where: { id: request.params.id } });
    return reply.send({ message: 'Assignment deleted' });
  });
}
