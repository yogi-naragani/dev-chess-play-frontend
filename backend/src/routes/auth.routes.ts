import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.js';

const prisma = new PrismaClient();

interface LoginBody {
  usernameOrEmail: string;
  password: string;
}

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Login
  app.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { usernameOrEmail, password } = request.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      return reply.status(401).send({ message: 'Invalid username/email or password' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return reply.status(401).send({ message: 'Invalid username/email or password' });
    }

    // Update status to online
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE' }
    });

    const payload = { id: user.id, username: user.username, userType: user.userType };
    const accessToken = app.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    const refreshToken = app.jwt.sign(payload, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

    const { password: _, ...userWithoutPassword } = user;

    return reply.send({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  });

  // Register (admin creates users, or self-registration)
  app.post('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { username, email, password, firstName, lastName, userType } = request.body;

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existing) {
      return reply.status(400).send({ message: 'Username or email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        userType
      }
    });

    const { password: _, ...userWithoutPassword } = user;

    return reply.status(201).send({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  });

  // Logout
  app.post('/logout', {
    preHandler: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'OFFLINE' }
    });

    return reply.send({ message: 'Logged out successfully' });
  });

  // Refresh token
  app.post('/refresh', async (request: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) => {
    const { refreshToken } = request.body;

    try {
      const decoded = app.jwt.verify(refreshToken) as { id: string; username: string; userType: string };
      const payload = { id: decoded.id, username: decoded.username, userType: decoded.userType };
      const newAccessToken = app.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

      return reply.send({ accessToken: newAccessToken });
    } catch {
      return reply.status(401).send({ message: 'Invalid refresh token' });
    }
  });

  // Get current user profile
  app.get('/me', {
    preHandler: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.user as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true, firstName: true, lastName: true,
        userType: true, profileImage: true, rating: true, puzzleRating: true,
        status: true, createdAt: true
      }
    });

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    return reply.send(user);
  });
}
