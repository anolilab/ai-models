import type { Model } from "../../../src/schema.js";

/**
 * Perplexity model data structure
 */
interface PerplexityModelData {
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
 * Transforms Perplexity model data into the normalized structure.
 * @param models Array of Perplexity model data
 * @returns Array of normalized model objects
 */
export const transformPerplexityModels = (models: PerplexityModelData[]): Model[] => {
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
        provider: "Perplexity",
        providerDoc: "https://docs.perplexity.ai/",
        providerEnv: ["PERPLEXITY_API_KEY"],
        providerId: "perplexity",
        providerModelsDevId: "perplexity",
        providerNpm: "@ai-sdk/perplexity",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches Perplexity models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchPerplexityModels = async (): Promise<Model[]> => {
    console.log("[Perplexity] Using hardcoded model data");

    const perplexityModels: PerplexityModelData[] = [
        {
            id: "llama-3.1-8b-instant",
            name: "Llama 3.1 8B Instant",
            context_length: 8192,
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
            id: "llama-3.1-70b-versatile",
            name: "Llama 3.1 70B Versatile",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.7,
                output: 0.8,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2024-01-01",
        },
        {
            id: "llama-3.1-405b-reasoning",
            name: "Llama 3.1 405B Reasoning",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 2.8,
                output: 3.2,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2024-01-01",
        },
        {
            id: "codellama-70b-instruct",
            name: "Code Llama 70B Instruct",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.7,
                output: 0.8,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2024-01-01",
        },
    ];

    return transformPerplexityModels(perplexityModels);
}; 