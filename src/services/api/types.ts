import { z } from 'zod';

export const QuoteResponseSchema = z.object({
  id: z.string(),
  text: z.string().max(180),
  author: z.string().optional(),
  createdAt: z.number(),
  imageUrl: z.string().url().optional(),
});

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;

export const PersonaSchema = z.object({
  id: z.string(),
  traits: z.array(z.string()),
  preferences: z.record(z.unknown()),
});

export type Persona = z.infer<typeof PersonaSchema>;
