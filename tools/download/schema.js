import { z } from 'zod';

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  release_date: z.string().nullable(),
  last_updated: z.string().nullable(),
  attachment: z.boolean(),
  reasoning: z.boolean(),
  temperature: z.boolean(),
  knowledge: z.string().nullable(),
  tool_call: z.boolean(),
  open_weights: z.boolean(),
  cost: z.object({
    input: z.number().nullable(),
    output: z.number().nullable(),
  }),
  limit: z.object({
    context: z.number().nullable(),
    output: z.number().nullable(),
  }),
  modalities: z.object({
    input: z.array(z.string()),
    output: z.array(z.string()),
  }),
  // Optional additional metadata fields
  provider: z.string().optional(),
  regions: z.array(z.string()).optional(),
  streaming_supported: z.boolean().nullable().optional(),
  // Anthropic-specific fields
  vision: z.boolean().optional(),
  extended_thinking: z.boolean().optional(),
  training_cutoff: z.string().nullable().optional(),
  // Amazon Bedrock-specific fields
  launch_date: z.string().optional(),
}); 