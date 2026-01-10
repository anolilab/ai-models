import { z } from "zod";

export const ModelSchema = z
    .object({
        // Capability flags
        attachment: z.boolean(),
        audioGeneration: z.boolean().optional(),
        batchMode: z.boolean().optional(),
        // Provider-specific capabilities
        cacheRead: z.boolean().optional(),

        codeExecution: z.boolean().optional(),
        compoundSystem: z.boolean().optional(),
        // Cost structure
        cost: z
            .object({
                // Image generation pricing
                imageGeneration: z.number().nullable().optional(),
                imageGenerationUltra: z.number().nullable().optional(),
                input: z.number().nullable(),
                inputCacheHit: z.number().nullable(),
                output: z.number().nullable(),
                // Video generation pricing
                videoGeneration: z.number().nullable().optional(),
                videoGenerationWithAudio: z.number().nullable().optional(),
                videoGenerationWithoutAudio: z.number().nullable().optional(),
            })
            .strict(),
        deploymentType: z.string().optional(),
        // Additional metadata
        description: z.string().optional(),

        extendedThinking: z.boolean().optional(),
        icon: z.string().optional(), // Provider icon identifier (e.g., LobeHub icon name)
        // Core identification fields
        id: z.string(),
        imageGeneration: z.boolean().optional(),

        // Knowledge and context
        knowledge: z.string().nullable(),
        lastUpdated: z.string().nullable(),
        launchDate: z.string().optional(),
        // Limits
        limit: z
            .object({
                context: z.number().nullable(),
                output: z.number().nullable(),
            })
            .strict(),
        // Modalities
        modalities: z
            .object({
                input: z.array(z.string()),
                output: z.array(z.string()),
            })
            .strict(),
        name: z.string().nullable(),
        openWeights: z.boolean(),
        originalModelId: z.string().optional(),

        // HuggingFace-specific fields
        ownedBy: z.string().optional(),

        preview: z.boolean().optional(),

        provider: z.string().optional(),

        providerDoc: z.string().optional(), // Documentation URL

        // Provider metadata (from models.dev API)
        providerEnv: z.array(z.string()).optional(), // Environment variables required
        providerId: z.string().optional(),
        providerModelsDevId: z.string().optional(), // ID from models.dev API
        providerNpm: z.string().optional(), // NPM package name

        providerStatus: z.string().optional(),
        reasoning: z.boolean(),
        // Infrastructure and deployment
        regions: z.array(z.string()).optional(),
        // Date fields
        releaseDate: z.string().nullable(),
        searchGrounding: z.boolean().optional(),
        streamingSupported: z.boolean().nullable().optional(),
        structuredOutputs: z.boolean().optional(),
        supportsStructuredOutput: z.boolean().optional(),

        supportsTools: z.boolean().optional(),

        temperature: z.boolean(),

        toolCall: z.boolean(),
        trainingCutoff: z.string().nullable().optional(),
        version: z.string().nullable().optional(),
        // Version management
        versions: z
            .object({
                preview: z.string().nullable().optional(),
                stable: z.string().nullable().optional(),
            })
            .strict()
            .optional(),
        vision: z.boolean().optional(),
    })
    .strict();

export type Model = z.infer<typeof ModelSchema>;

export const ProviderSchema = z
    .object({
        capabilities: z.array(z.string()).optional(),
        // Additional metadata
        description: z.string().optional(),
        displayName: z.string().optional(),

        doc: z.string().optional(), // Documentation URL

        // Provider metadata
        env: z.array(z.string()).optional(), // Environment variables required
        // Icon information
        icon: z.string().optional(), // LobeHub icon name or custom icon identifier
        // Core identification
        id: z.string(),
        // Model count and capabilities
        modelCount: z.number().optional(),

        modelsDevId: z.string().optional(), // ID from models.dev API
        name: z.string(),
        npm: z.string().optional(), // NPM package name

        status: z.enum(["active", "inactive", "deprecated"]).optional(),
        website: z.string().optional(),
    })
    .strict();

export type Provider = z.infer<typeof ProviderSchema>;
