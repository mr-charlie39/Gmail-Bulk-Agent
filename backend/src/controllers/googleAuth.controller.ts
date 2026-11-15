import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { GoogleOAuthService } from '../services/googleOAuth.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class GoogleAuthController {
  /**
   * Initiates Google OAuth 2.0 flow bound to authenticated user ID
   * GET /api/auth/google
   */
  public static async initiateAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required to connect Gmail.' });
        return;
      }

      // Bind the OAuth flow strictly to the initiating user's ID
      const userId = req.user.id;
      const authUrl = GoogleOAuthService.getAuthUrl(userId);

      if (req.accepts('html')) {
        res.redirect(authUrl);
        return;
      }

      res.json({ authUrl });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles Google OAuth 2.0 callback
   * GET /api/auth/google/callback
   */
  public static async handleCallback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const { code, state, error } = req.query;

    if (error) {
      logger.warn('Google OAuth denied or returned error:', error);
      res.redirect(`${env.FRONTEND_URL}/user/gmail?oauth_error=${encodeURIComponent(String(error))}`);
      return;
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Missing authorization code from Google.' });
      return;
    }

    try {
      const stateUserId = typeof state === 'string' ? state : undefined;
      const result = await GoogleOAuthService.handleCallback(code, stateUserId);

      // Redirect to employee's workspace dashboard
      res.redirect(
        `${env.FRONTEND_URL}/user/gmail?oauth_success=true&email=${encodeURIComponent(result.googleEmail)}`
      );
    } catch (err: any) {
      logger.error('Google OAuth callback failed:', err);
      res.redirect(`${env.FRONTEND_URL}/user/gmail?oauth_error=${encodeURIComponent(err.message)}`);
    }
  }

  /**
   * Retrieves Google OAuth connection status for authenticated user
   * GET /api/auth/google/status
   */
  public static async getStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const status = await GoogleOAuthService.getConnectionStatus(userId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnects authenticated user's Google account
   * POST /api/auth/google/disconnect
   */
  public static async disconnect(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await GoogleOAuthService.disconnect(userId);
      res.json({ success: true, message: 'Google account disconnected successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
