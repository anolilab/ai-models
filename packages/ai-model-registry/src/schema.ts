// eslint-disable-next-line import/no-namespace
import * as z from "zod";

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
        deploymentType: z.string().trim().optional(),
        // Additional metadata
        description: z.string().trim().optional(),

        extendedThinking: z.boolean().optional(),
        icon: z.string().trim().optional(), // Provider icon identifier (e.g., LobeHub icon name)
        // Core identification fields
        id: z.string().trim(),
        imageGeneration: z.boolean().optional(),

        // Knowledge and context
        knowledge: z.string().trim().nullable(),
        lastUpdated: z.string().trim().nullable(),
        launchDate: z.string().trim().optional(),
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
                input: z.array(z.string().trim()),
                output: z.array(z.string().trim()),
            })
            .strict(),
        name: z.string().trim().nullable(),
        openWeights: z.boolean(),
        originalModelId: z.string().trim().optional(),

        // HuggingFace-specific fields
        ownedBy: z.string().trim().optional(),

        preview: z.boolean().optional(),

        provider: z.string().trim().optional(),

        providerDoc: z.string().trim().optional(), // Documentation URL

        // Provider metadata (from models.dev API)
        providerEnv: z.array(z.string().trim()).optional(), // Environment variables required
        providerId: z.string().trim().optional(),
        providerModelsDevId: z.string().trim().optional(), // ID from models.dev API
        providerNpm: z.string().trim().optional(), // NPM package name

        providerStatus: z.string().trim().optional(),
        reasoning: z.boolean(),
        // Infrastructure and deployment
        regions: z.array(z.string().trim()).optional(),
        // Date fields
        releaseDate: z.string().trim().nullable(),
        searchGrounding: z.boolean().optional(),
        streamingSupported: z.boolean().nullable().optional(),
        structuredOutputs: z.boolean().optional(),
        supportsStructuredOutput: z.boolean().optional(),

        supportsTools: z.boolean().optional(),

        temperature: z.boolean(),

        thumbnail: z.string().trim().nullable().optional(), // Thumbnail image/video URL or local path

        toolCall: z.boolean(),
        trainingCutoff: z.string().trim().nullable().optional(),
        version: z.string().trim().nullable().optional(),
        // Version management
        versions: z
            .object({
                preview: z.string().trim().nullable().optional(),
                stable: z.string().trim().nullable().optional(),
            })
            .strict()
            .optional(),
        vision: z.boolean().optional(),
    })
    .strict();

export type Model = z.infer<typeof ModelSchema>;

export const ProviderSchema = z
    .object({
        capabilities: z.array(z.string().trim()).optional(),
        // Additional metadata
        description: z.string().trim().optional(),
        displayName: z.string().trim().optional(),

        doc: z.string().trim().optional(), // Documentation URL

        // Provider metadata
        env: z.array(z.string().trim()).optional(), // Environment variables required
        // Icon information
        icon: z.string().trim().optional(), // LobeHub icon name or custom icon identifier
        // Core identification
        id: z.string().trim(),
        // Model count and capabilities
        modelCount: z.number().optional(),

        modelsDevId: z.string().trim().optional(), // ID from models.dev API
        name: z.string().trim(),
        npm: z.string().trim().optional(), // NPM package name

        status: z.enum(["active", "inactive", "deprecated"]).optional(),
        website: z.string().trim().optional(),
    })
    .strict();

export type Provider = z.infer<typeof ProviderSchema>;
