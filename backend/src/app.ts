import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fjwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fstatic from '@fastify/static';
import formbody from '@fastify/formbody';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { instructorRoutes } from './routes/instructor.routes.js';
import { studentRoutes } from './routes/student.routes.js';
import { gameRoutes } from './routes/game.routes.js';
import { videoRoutes } from './routes/video.routes.js';
import { puzzleRoutes } from './routes/puzzle.routes.js';
import { tournamentRoutes } from './routes/tournament.routes.js';
import { homeworkRoutes } from './routes/homework.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { lessonRoutes } from './routes/lesson.routes.js';
import { movesRoutes } from './routes/moves.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { setupSocketHandlers } from './socket/index.js';
import { authenticate, requireRole } from './middleware/auth.middleware.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp(): Promise<{ app: FastifyInstance; io: Server }> {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    }
  });

  // Register plugins
  await app.register(cors, {
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false // Disable CSP for development
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // JWT - require secret in production
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  await app.register(fjwt, {
    secret: jwtSecret || 'chess-academy-dev-secret-change-in-production'
  });

  await app.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB
    }
  });

  await app.register(formbody);

  await app.register(fstatic, {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/uploads/',
    decorateReply: false
  });

  // Decorate with auth helpers
  app.decorate('authenticate', authenticate);
  app.decorate('requireRole', requireRole);

  // Health check
  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'chess-academy-api'
  }));

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(instructorRoutes, { prefix: '/api/instructor' });
  await app.register(studentRoutes, { prefix: '/api/student' });
  await app.register(gameRoutes, { prefix: '/api/games' });
  await app.register(videoRoutes, { prefix: '/api/videos' });
  await app.register(puzzleRoutes, { prefix: '/api/puzzles' });
  await app.register(tournamentRoutes, { prefix: '/api/tournaments' });
  await app.register(homeworkRoutes, { prefix: '/api/homework' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(lessonRoutes, { prefix: '/api/lessons' });
  await app.register(movesRoutes, { prefix: '/api/moves' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });

  // Setup Socket.io
  const io = new Server(app.server, {
    cors: {
      origin: ['http://localhost:4200'],
      credentials: true
    }
  });

  setupSocketHandlers(io);

  return { app, io };
}
