import type { Model } from "../../../src/schema.js";

/**
 * Reka AI model data structure
 */
interface RekaModelData {
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
 * Transforms Reka AI model data into the normalized structure.
 * @param models Array of Reka AI model data
 * @returns Array of normalized model objects
 */
export const transformRekaModels = (models: RekaModelData[]): Model[] => {
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
        provider: "Reka AI",
        providerDoc: "https://docs.reka.ai/",
        providerEnv: ["REKA_API_KEY"],
        providerId: "reka",
        providerModelsDevId: "reka",
        providerNpm: "@ai-sdk/reka",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches Reka AI models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchRekaModels = async (): Promise<Model[]> => {
    console.log("[Reka AI] Using hardcoded model data");

    const rekaModels: RekaModelData[] = [
        {
            id: "reka-core",
            name: "Reka Core",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.2,
                output: 0.2,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2024-01-01",
        },
        {
            id: "reka-flash",
            name: "Reka Flash",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.1,
                output: 0.1,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2024-01-01",
        },
    ];

    return transformRekaModels(rekaModels);
}; 