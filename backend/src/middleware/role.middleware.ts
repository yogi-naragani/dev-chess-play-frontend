import { FastifyRequest, FastifyReply } from 'fastify';

export function requireAdmin(request: FastifyRequest, reply: FastifyReply, done: () => void): void {
  const user = request.user as { userType: string };
  if (user?.userType !== 'ADMIN') {
    reply.status(403).send({ error: 'Admin access required' });
    return;
  }
  done();
}

export function requireInstructor(request: FastifyRequest, reply: FastifyReply, done: () => void): void {
  const user = request.user as { userType: string };
  if (user?.userType !== 'INSTRUCTOR' && user?.userType !== 'ADMIN') {
    reply.status(403).send({ error: 'Instructor access required' });
    return;
  }
  done();
}

export function requireStudent(request: FastifyRequest, reply: FastifyReply, done: () => void): void {
  const user = request.user as { userType: string };
  if (user?.userType !== 'STUDENT') {
    reply.status(403).send({ error: 'Student access required' });
    return;
  }
  done();
}
