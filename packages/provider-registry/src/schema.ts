import { z } from 'zod';

export const ModelSchema = z.object({
  // Core identification fields
  id: z.string(),
  name: z.string().nullable(),
  provider: z.string().optional(),
  
  // Date fields
  release_date: z.string().nullable(),
  last_updated: z.string().nullable(),
  launch_date: z.string().optional(),
  training_cutoff: z.string().nullable().optional(),
  
  // Capability flags
  attachment: z.boolean(),
  reasoning: z.boolean(),
  temperature: z.boolean(),
  tool_call: z.boolean(),
  open_weights: z.boolean(),
  vision: z.boolean().optional(),
  extended_thinking: z.boolean().optional(),
  preview: z.boolean().optional(),
  
  // Knowledge and context
  knowledge: z.string().nullable(),
  
  // Cost structure
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
  
  // Limits
  limit: z.object({
    context: z.number().nullable(),
    output: z.number().nullable(),
  }),
  
  // Modalities
  modalities: z.object({
    input: z.array(z.string()),
    output: z.array(z.string()),
  }),
  
  // Infrastructure and deployment
  regions: z.array(z.string()).optional(),
  streaming_supported: z.boolean().nullable().optional(),
  deployment_type: z.string().optional(),
  version: z.string().nullable().optional(),
  
  // Provider-specific capabilities
  cache_read: z.boolean().optional(),
  code_execution: z.boolean().optional(),
  search_grounding: z.boolean().optional(),
  structured_outputs: z.boolean().optional(),
  batch_mode: z.boolean().optional(),
  audio_generation: z.boolean().optional(),
  image_generation: z.boolean().optional(),
  compound_system: z.boolean().optional(),
  
  // Version management
  versions: z.object({
    stable: z.string().nullable().optional(),
    preview: z.string().nullable().optional(),
  }).optional(),
  
  // Additional metadata
  description: z.string().optional(),
  
  // HuggingFace-specific fields
  owned_by: z.string().optional(),
  original_model_id: z.string().optional(),
  provider_status: z.string().optional(),
  supports_tools: z.boolean().optional(),
  supports_structured_output: z.boolean().optional(),
});

export type Model = z.infer<typeof ModelSchema>; 