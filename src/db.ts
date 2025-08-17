import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const logger = pino({
  name: 'database',
  level: process.env.LOG_LEVEL || 'info',
});

declare global {
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

// Type assertion to handle Prisma's event types
const prismaWithEvents = prisma as any;

prismaWithEvents.$on('error', (e: any) => {
  logger.error({ error: e }, 'Database error');
});

prismaWithEvents.$on('warn', (e: any) => {
  logger.warn({ warning: e }, 'Database warning');
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
export default prisma;
