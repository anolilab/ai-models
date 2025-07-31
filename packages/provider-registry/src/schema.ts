import { z } from 'zod';

export const ModelSchema = z.object({
  // Core identification fields
  id: z.string(),
  name: z.string().nullable(),
  provider: z.string().optional(),
  providerId: z.string().optional(),
  
  // Provider metadata (from models.dev API)
  providerEnv: z.array(z.string()).optional(), // Environment variables required
  providerNpm: z.string().optional(), // NPM package name
  providerDoc: z.string().optional(), // Documentation URL
  providerModelsDevId: z.string().optional(), // ID from models.dev API
  
  // Date fields
  releaseDate: z.string().nullable(),
  lastUpdated: z.string().nullable(),
  launchDate: z.string().optional(),
  trainingCutoff: z.string().nullable().optional(),
  
  // Capability flags
  attachment: z.boolean(),
  reasoning: z.boolean(),
  temperature: z.boolean(),
  toolCall: z.boolean(),
  openWeights: z.boolean(),
  vision: z.boolean().optional(),
  extendedThinking: z.boolean().optional(),
  preview: z.boolean().optional(),


  
  // Knowledge and context
  knowledge: z.string().nullable(),
  
  // Cost structure
  cost: z.object({
    input: z.number().nullable(),
    output: z.number().nullable(),
    inputCacheHit: z.number().nullable(),
    // Image generation pricing
    imageGeneration: z.number().nullable().optional(),
    imageGenerationUltra: z.number().nullable().optional(),
    // Video generation pricing
    videoGeneration: z.number().nullable().optional(),
    videoGenerationWithAudio: z.number().nullable().optional(),
    videoGenerationWithoutAudio: z.number().nullable().optional(),
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
  streamingSupported: z.boolean().nullable().optional(),
  deploymentType: z.string().optional(),
  version: z.string().nullable().optional(),
  
  // Provider-specific capabilities
  cacheRead: z.boolean().optional(),
  codeExecution: z.boolean().optional(),
  searchGrounding: z.boolean().optional(),
  structuredOutputs: z.boolean().optional(),
  batchMode: z.boolean().optional(),
  audioGeneration: z.boolean().optional(),
  imageGeneration: z.boolean().optional(),
  compoundSystem: z.boolean().optional(),
  
  // Version management
  versions: z.object({
    stable: z.string().nullable().optional(),
    preview: z.string().nullable().optional(),
  }).optional(),
  
  // Additional metadata
  description: z.string().optional(),
  
  // HuggingFace-specific fields
  ownedBy: z.string().optional(),
  originalModelId: z.string().optional(),
  providerStatus: z.string().optional(),
  supportsTools: z.boolean().optional(),
  supportsStructuredOutput: z.boolean().optional(),
});

export type Model = z.infer<typeof ModelSchema>;
