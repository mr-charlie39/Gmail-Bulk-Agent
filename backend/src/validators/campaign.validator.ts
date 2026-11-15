import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  promptTemplate: z.string().optional(),
  subjectTemplate: z.string().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
});
