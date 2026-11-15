import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  public static async getOverview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await AnalyticsService.getOverview(req.user!.id);
      res.json(overview);
    } catch (error) {
      next(error);
    }
  }
}
