import type { Model } from "../../../src/schema.js";

/**
 * Simplismart model data structure
 */
interface SimplismartModelData {
    id: string;
    name: string;
    context_length: number;
    max_tokens?: number;
    pricing?: {
        input?: number;
        output?: number;
    };
    input_modalities?: string[];
    output_modalities?: string[];
    knowledge?: string;
    release_date?: string;
}

/**
 * Transforms Simplismart model data into the normalized structure.
 * @param models Array of Simplismart model data
 * @returns Array of normalized model objects
 */
export const transformSimplismartModels = (models: SimplismartModelData[]): Model[] => {
    return models.map((model) => ({
        attachment: false,
        cost: {
            input: model.pricing?.input || null,
            inputCacheHit: null,
            output: model.pricing?.output || null,
        },
        extendedThinking: false,
        id: model.id,
        knowledge: model.knowledge || null,
        lastUpdated: null,
        limit: {
            context: model.context_length,
            output: model.max_tokens || null,
        },
        modalities: {
            input: model.input_modalities || ["text"],
            output: model.output_modalities || ["text"],
        },
        name: model.name,
        openWeights: false,
        provider: "Simplismart",
        providerDoc: "https://simplismart.ai/docs",
        providerEnv: ["SIMPLISMART_API_KEY"],
        providerId: "simplismart",
        providerModelsDevId: "simplismart",
        providerNpm: "@ai-sdk/openai-compatible",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches Simplismart models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchSimplismartModels = async (): Promise<Model[]> => {
    console.log("[Simplismart] Using hardcoded model data");

    const simplismartModels: SimplismartModelData[] = [
        {
            id: "simplismart-1",
            name: "Simplismart 1",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.1,
                output: 0.1,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2024-01",
            release_date: "2024-01-01",
        },
    ];

    return transformSimplismartModels(simplismartModels);
}; 