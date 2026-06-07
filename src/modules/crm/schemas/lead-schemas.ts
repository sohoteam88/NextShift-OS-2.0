import { z } from 'zod';
import { PaginationSchema } from '@/lib/query-helpers';

const PhoneSchema = z
  .string()
  .max(20)
  .regex(/^\+?[0-9()\-\s]{7,20}$/, 'Invalid phone number')
  .optional()
  .or(z.literal(''));

export const CreateLeadSchema = z.object({
  name: z.string().min(1).max(200).refine((value) => !/[<>]/.test(value), 'Invalid characters in name'),
  email: z.string().email().optional().or(z.literal('')),
  phone: PhoneSchema,
  source: z.string().max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateLeadSchema = z.object({
  name: z.string().min(1).max(200).refine((value) => !/[<>]/.test(value), 'Invalid characters in name').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: PhoneSchema,
  source: z.string().max(50).optional(),
  pipelineStage: z.string().max(50).optional(),
  nextFollowup: z.string().datetime().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const LeadQuerySchema = PaginationSchema.extend({
  stage: z.string().optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
  min_score: z.coerce.number().int().optional(),
  max_score: z.coerce.number().int().optional(),
  owner_id: z.string().optional(),
  sort_by: z.enum(['createdAt', 'updatedAt', 'score', 'name']).default('createdAt'),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type LeadQuery = z.infer<typeof LeadQuerySchema>;
