import { z } from 'zod';

export const createRecipientSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  category: z.string().optional(),
  customData: z.record(z.any()).optional(),
});

export const batchRecipientSchema = z.object({
  recipients: z.array(createRecipientSchema),
});
