import app from './app';
import { env } from './config/env';
import { prisma } from './config/db';
import { logger } from './utils/logger';

const PORT = parseInt(env.PORT, 10) || 5000;

// Prevent process from tripping or exiting on unexpected errors
process.on('uncaughtException', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use by another process. Please stop the existing process before starting.`);
  } else {
    logger.error('CRITICAL: Uncaught Exception caught by safety guardian:', err);
  }
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('CRITICAL: Unhandled Promise Rejection caught by safety guardian:', reason);
});

async function connectWithRetry(maxRetries = 5, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully (PostgreSQL / Supabase).');
      return;
    } catch (err: any) {
      logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function bootstrap() {
  try {
    // Verify database connection with automatic transient retry
    await connectWithRetry();

    const server = app.listen(PORT, () => {
      logger.info(`Enterprise Email Outreach Agent backend running on http://localhost:${PORT}`);
      logger.info(`Google OAuth Redirect URI: ${env.GOOGLE_REDIRECT_URI}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    const shutdown = async () => {
      logger.info('Gracefully shutting down server...');
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
