import { buildApp } from './app.js';
import { PrismaClient } from '@prisma/client';
import { connectMongoDB } from './utils/mongodb.js';

const prisma = new PrismaClient();

async function start() {
  try {
    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    console.log('Connected to PostgreSQL');

    // Connect to MongoDB
    await connectMongoDB();
    console.log('Connected to MongoDB');

    // Build and start Fastify
    const { app } = await buildApp();

    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    console.log(`Server running at http://${host}:${port}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();

export { prisma };
