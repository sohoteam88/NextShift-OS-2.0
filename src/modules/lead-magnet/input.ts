import { z } from 'zod';

export const leadMagnetPatchSchema = z.object({
  id: z.string().min(1).max(100),
  track: z.enum(['retail', 'recruitment']),
  title: z.string().trim().min(1).max(200).optional(),
  promise: z.string().trim().min(1).max(1000).optional(),
  description: z.string().trim().min(1).max(4000).optional(),
  whatsappCta: z.string().trim().min(1).max(1000).optional(),
}).strict().refine(
  (value) => value.title !== undefined || value.promise !== undefined || value.description !== undefined || value.whatsappCta !== undefined,
  'No mutable fields supplied',
);

export const leadMagnetDeleteSchema = z.object({
  id: z.string().min(1).max(100),
  track: z.enum(['retail', 'recruitment']),
}).strict();
