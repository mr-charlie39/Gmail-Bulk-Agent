import { z } from 'zod';

export const generateEmailSchema = z.object({
  recipientId: z.string().min(1, 'recipientId is required'),
  campaignId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? val.trim() : undefined)),
  customInstructions: z.string().optional(),
  category: z.string().optional(),
});

export const batchGenerateEmailSchema = z.object({
  recipientIds: z.array(z.string().min(1)).min(1, 'At least one recipientId is required'),
  campaignId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? val.trim() : undefined)),
  customInstructions: z.string().optional(),
});

export const updateEmailDraftSchema = z.object({
  subject: z.string().min(1).optional(),
  bodyText: z.string().min(1).optional(),
  bodyHtml: z.string().optional(),
});

export const emailApprovalSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});
