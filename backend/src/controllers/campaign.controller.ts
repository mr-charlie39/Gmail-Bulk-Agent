import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { CampaignService } from '../services/campaign.service';
import { createCampaignSchema, updateCampaignSchema } from '../validators/campaign.validator';

export class CampaignController {
  public static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await CampaignService.list(req.user!.id);
      res.json(campaigns);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const campaign = await CampaignService.getById(id, req.user!.id);
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }
      res.json(campaign);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createCampaignSchema.parse(req.body);
      const campaign = await CampaignService.create(req.user!.id, validated);
      res.status(201).json(campaign);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validated = updateCampaignSchema.parse(req.body);
      await CampaignService.update(id, req.user!.id, validated);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await CampaignService.delete(id, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
