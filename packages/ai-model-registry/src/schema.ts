// eslint-disable-next-line import/no-namespace
import * as z from "zod";

const modelSchema = z
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

const providerSchema = z
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

// Compile-time guards: `tsc` errors (via the `AssertTrue` constraint) if either
// hand-written interface (`Model`/`Provider`) ever drifts from what its un-annotated
// builder schema (`modelSchema`/`providerSchema`) infers. The builders stay the source
// of truth for the check; the exported `ModelSchema`/`ProviderSchema` carry explicit
// `z.ZodType<...>` annotations so the oxc isolated-declarations emitter can describe
// them without TS9010. The guard aliases are intentionally unused (type-level only).
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type AssertTrue<T extends true> = T;
// eslint-disable-next-line @typescript-eslint/naming-convention
type _ModelMatchesSchema = AssertTrue<Equals<Model, z.infer<typeof modelSchema>>>;
// eslint-disable-next-line @typescript-eslint/naming-convention
type _ProviderMatchesSchema = AssertTrue<Equals<Provider, z.infer<typeof providerSchema>>>;

// NOTE: `Model` is hand-written (not `z.infer<typeof modelSchema>`) on purpose.
// isolatedDeclarations (oxc dts emit) cannot infer an exported type through z.infer,
// and the inferred Zod type is also structurally deep. A flat interface keeps the
// emitted declarations compact and isolatedDeclarations-friendly. The compile-time
// guards above fail `tsc` if this interface drifts from the schema.
export interface Model {
    // Capability flags
    attachment: boolean;
    audioGeneration?: boolean;
    batchMode?: boolean;
    // Provider-specific capabilities
    cacheRead?: boolean;
    codeExecution?: boolean;
    compoundSystem?: boolean;
    // Cost structure
    cost: {
        // Image generation pricing
        imageGeneration?: number | null;
        imageGenerationUltra?: number | null;
        input: number | null;
        inputCacheHit: number | null;
        output: number | null;
        // Video generation pricing
        videoGeneration?: number | null;
        videoGenerationWithAudio?: number | null;
        videoGenerationWithoutAudio?: number | null;
    };
    deploymentType?: string;
    // Additional metadata
    description?: string;
    extendedThinking?: boolean;
    icon?: string;
    // Core identification fields
    id: string;
    imageGeneration?: boolean;
    // Knowledge and context
    knowledge: string | null;
    lastUpdated: string | null;
    launchDate?: string;
    // Limits
    limit: {
        context: number | null;
        output: number | null;
    };
    // Modalities
    modalities: {
        input: string[];
        output: string[];
    };
    name: string | null;
    openWeights: boolean;
    originalModelId?: string;
    // HuggingFace-specific fields
    ownedBy?: string;
    preview?: boolean;
    provider?: string;
    providerDoc?: string;
    // Provider metadata (from models.dev API)
    providerEnv?: string[];
    providerId?: string;
    providerModelsDevId?: string;
    providerNpm?: string;
    providerStatus?: string;
    reasoning: boolean;
    // Infrastructure and deployment
    regions?: string[];
    // Date fields
    releaseDate: string | null;
    searchGrounding?: boolean;
    streamingSupported?: boolean | null;
    structuredOutputs?: boolean;
    supportsStructuredOutput?: boolean;
    supportsTools?: boolean;
    temperature: boolean;
    thumbnail?: string | null;
    toolCall: boolean;
    trainingCutoff?: string | null;
    version?: string | null;
    // Version management
    versions?: {
        preview?: string | null;
        stable?: string | null;
    };
    vision?: boolean;
}

// Hand-written (see `Model` above) so it is flat and isolatedDeclarations-friendly.
// The compile-time guard near the top of this file fails `tsc` if it drifts from `providerSchema`.
export interface Provider {
    capabilities?: string[];
    // Additional metadata
    description?: string;
    displayName?: string;
    doc?: string;
    // Provider metadata
    env?: string[];
    // Icon information
    icon?: string;
    // Core identification
    id: string;
    // Model count and capabilities
    modelCount?: number;
    modelsDevId?: string;
    name: string;
    npm?: string;
    status?: "active" | "deprecated" | "inactive";
    website?: string;
}

// Runtime validation schemas, explicitly typed for isolatedDeclarations.
export const ModelSchema: z.ZodType<Model> = modelSchema;
export const ProviderSchema: z.ZodType<Provider> = providerSchema;
