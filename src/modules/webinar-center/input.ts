import { z } from 'zod';

export const webinarPatchSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(200).optional(),
  promise: z.string().trim().min(1).max(1000).optional(),
  subtitle: z.string().trim().max(500).optional(),
  loomScript: z.string().trim().min(1).max(20000).optional(),
  registrationHeadline: z.string().trim().min(1).max(300).optional(),
  registrationCta: z.string().trim().min(1).max(200).optional(),
}).strict().refine((value) => Object.keys(value).some((key) => key !== 'id'), 'No mutable fields supplied');

export const webinarDeleteSchema = z.object({ id: z.string().min(1).max(100) }).strict();
