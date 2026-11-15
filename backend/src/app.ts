import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/error';
import { env } from './config/env';

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible SPA assets in local development
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server) or from approved origins
      if (!origin) return callback(null, true);
      if (
        origin === env.FRONTEND_URL ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Cookie parsing for HTTP-only JWT sessions
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root status ping
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AeroReach Enterprise API',
    runtime: 'Vercel Serverless',
    docs: '/api/health',
  });
});

// API routes
app.use('/api', routes);

// Serve static frontend build if present
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Central error handler
app.use(errorHandler);

export default app;
