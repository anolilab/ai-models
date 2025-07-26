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
    input_cache_hit: z.number().nullable(),
    // Image generation pricing
    image_generation: z.number().nullable().optional(),
    image_generation_ultra: z.number().nullable().optional(),
    // Video generation pricing
    video_generation: z.number().nullable().optional(),
    video_generation_with_audio: z.number().nullable().optional(),
    video_generation_without_audio: z.number().nullable().optional(),
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
  // DeepSeek-specific fields
  cache_read: z.boolean().optional(),
  // Google-specific fields
  code_execution: z.boolean().optional(),
  search_grounding: z.boolean().optional(),
  structured_outputs: z.boolean().optional(),
  batch_mode: z.boolean().optional(),
  audio_generation: z.boolean().optional(),
  image_generation: z.boolean().optional(),
  versions: z.object({
    stable: z.string().nullable().optional(),
    preview: z.string().nullable().optional(),
  }).optional(),
}); 