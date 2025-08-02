import type { Model } from "../../../src/schema.js";

/**
 * MiniMax model data structure
 */
interface MiniMaxModelData {
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
 * Transforms MiniMax model data into the normalized structure.
 * @param models Array of MiniMax model data
 * @returns Array of normalized model objects
 */
export const transformMiniMaxModels = (models: MiniMaxModelData[]): Model[] => {
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
        provider: "MiniMax",
        providerDoc: "https://platform.minimax.chat/docs",
        providerEnv: ["MINIMAX_API_KEY"],
        providerId: "minimax",
        providerModelsDevId: "minimax",
        providerNpm: "@ai-sdk/minimax",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches MiniMax models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchMiniMaxModels = async (): Promise<Model[]> => {
    console.log("[MiniMax] Using hardcoded model data");

    const minimaxModels: MiniMaxModelData[] = [
        {
            id: "abab5.5-chat",
            name: "ABAB5.5 Chat",
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
        {
            id: "abab5.5s-chat",
            name: "ABAB5.5s Chat",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.05,
                output: 0.05,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2024-01-01",
        },
        {
            id: "abab6-chat",
            name: "ABAB6 Chat",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.2,
                output: 0.2,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2024-06",
            release_date: "2024-06-01",
        },
    ];

    return transformMiniMaxModels(minimaxModels);
}; 