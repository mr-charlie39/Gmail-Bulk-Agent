import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisConnection: IORedis | null = null;
let emailQueue: Queue | null = null;

try {
  redisConnection = new IORedis({
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis unavailable, background queue operating in direct execution fallback mode.');
        return null; // Stop retrying
      }
      return Math.min(times * 500, 2000);
    },
  });

  redisConnection.on('error', (err) => {
    logger.warn(`Redis connection notice: ${err.message}. Using fallback queue execution.`);
  });

  redisConnection.on('connect', () => {
    logger.info('Connected to Redis for background job queueing.');
  });

  emailQueue = new Queue('email-sending', {
    connection: redisConnection,
  });
} catch (err: any) {
  logger.warn('Failed to initialize Redis queue. Direct fallback will be used:', err.message);
}

export { emailQueue, redisConnection };
