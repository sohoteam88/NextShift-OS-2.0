import { z } from 'zod';

export const businessPackTrackSchema = z.enum(['retail', 'recruitment', 'both']);
export const businessPackVisibilitySchema = z.enum(['public', 'private']);

const scopedEntrySchema = z.object({
  id: z.string().min(1),
  track: businessPackTrackSchema,
  visibility: businessPackVisibilitySchema,
});

const productSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  flavours: z.array(z.string().min(1)).optional(),
});

const scriptSchema = scopedEntrySchema.extend({
  title: z.string().min(1),
  originalQuote: z.string().min(1).optional(),
  structure: z.array(z.string().min(1)),
  complianceNote: z.string().min(1).optional(),
  promptGuidance: z.string().min(1).optional(),
});

export const businessPackSchema = z.object({
  version: z.number().int().positive(),
  priceListEffectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO date'),
  productLines: z.array(scopedEntrySchema.extend({
    title: z.string().min(1),
    products: z.array(productSchema).min(1),
    complianceNote: z.string().min(1).optional(),
  })).min(1),
  tracks: z.object({
    retail: z.array(scriptSchema),
    recruitment: z.array(scriptSchema),
  }),
  objections: z.array(scriptSchema).min(1),
  complianceRedLines: z.array(scopedEntrySchema.extend({
    destination: z.string().min(1),
    rule: z.string().min(1),
  })).min(1),
  substitutionTable: z.array(scopedEntrySchema.extend({
    internalTerm: z.string().min(1),
    publicTerm: z.string().min(1),
  })).min(1),
  questionTemplates: z.array(scopedEntrySchema.extend({
    title: z.string().min(1),
    questions: z.array(z.string().min(1)).min(1),
    structure: z.array(z.string().min(1)).min(1),
    promptGuidance: z.string().min(1).optional(),
  })),
  bPathDefaults: scopedEntrySchema.extend({
    title: z.string().min(1),
    principle: z.string().min(1),
    starterBundle: z.string().min(1),
    phases: z.array(scopedEntrySchema.extend({ task: z.string().min(1) })).min(1),
  }),
  priceList: z.array(scopedEntrySchema.extend({
    name: z.string().min(1),
    price: z.string().regex(/^RM[\d,.]+$/, 'Expected an RM price'),
  })).min(1),
});

export type BusinessPack = z.infer<typeof businessPackSchema>;
export type BusinessPackTrack = z.infer<typeof businessPackTrackSchema>;
export type BusinessPackVisibility = z.infer<typeof businessPackVisibilitySchema>;
