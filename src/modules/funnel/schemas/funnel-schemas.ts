import { z } from 'zod';
import { PaginationSchema } from '@/lib/query-helpers';

export const CreateFunnelSchema = z.object({
  title: z.string().min(1).max(200),
  template_id: z.string().uuid().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateFunnelSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const FunnelQuerySchema = PaginationSchema.extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['landing', 'quiz', 'lead_magnet']),
  config: z.record(z.string(), z.unknown()),
  thumbnail: z.string().optional(),
});

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  thumbnail: z.string().optional(),
});

export type CreateFunnelInput = z.infer<typeof CreateFunnelSchema>;
export type UpdateFunnelInput = z.infer<typeof UpdateFunnelSchema>;
export type FunnelQuery = z.infer<typeof FunnelQuerySchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
