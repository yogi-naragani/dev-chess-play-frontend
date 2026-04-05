import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

export async function videoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  // List videos
  app.get('/', async (request: FastifyRequest<{ Querystring: { category?: string; level?: string; search?: string } }>, reply: FastifyReply) => {
    const { category, level, search } = request.query;
    const where: any = {};
    if (category) where.category = category;
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const videos = await prisma.video.findMany({
      where,
      include: { uploadedBy: { select: { id: true, username: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send(videos);
  });

  // Upload video (instructor/admin only)
  app.post('/upload', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded' });
    }

    const fileId = uuid();
    const ext = path.extname(data.filename);
    const fileName = `${fileId}${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'videos');

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await pipeline(data.file, fs.createWriteStream(filePath));

    // Get metadata from fields
    const fields = data.fields as any;
    const title = fields.title?.value || data.filename;
    const description = fields.description?.value || '';
    const category = fields.category?.value || 'general';
    const level = fields.level?.value || 'beginner';

    const video = await prisma.video.create({
      data: {
        title,
        description,
        filePath: `/uploads/videos/${fileName}`,
        category,
        level,
        mimeType: data.mimetype,
        uploadedById: user.id
      }
    });

    return reply.status(201).send(video);
  });

  // Get video by ID
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const video = await prisma.video.findUnique({
      where: { id: request.params.id },
      include: { uploadedBy: { select: { id: true, username: true, firstName: true, lastName: true } } }
    });

    if (!video) return reply.status(404).send({ message: 'Video not found' });
    return reply.send(video);
  });

  // Delete video (instructor/admin)
  app.delete('/:id', {
    preHandler: [app.requireRole('INSTRUCTOR', 'ADMIN')]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const video = await prisma.video.findUnique({ where: { id: request.params.id } });
    if (!video) return reply.status(404).send({ message: 'Video not found' });

    // Delete file from disk
    const fullPath = path.join(process.cwd(), video.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await prisma.video.delete({ where: { id: request.params.id } });
    return reply.send({ message: 'Video deleted' });
  });
}
