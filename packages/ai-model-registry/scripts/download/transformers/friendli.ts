import type { Model } from "../../../src/schema.js";

/**
 * FriendliAI model data structure
 */
interface FriendliModelData {
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
 * Transforms FriendliAI model data into the normalized structure.
 * @param models Array of FriendliAI model data
 * @returns Array of normalized model objects
 */
export const transformFriendliModels = (models: FriendliModelData[]): Model[] => {
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
        provider: "FriendliAI",
        providerDoc: "https://docs.friendli.ai/",
        providerEnv: ["FRIENDLI_API_KEY"],
        providerId: "friendli",
        providerModelsDevId: "friendli",
        providerNpm: "@ai-sdk/friendli",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches FriendliAI models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchFriendliModels = async (): Promise<Model[]> => {
    console.log("[FriendliAI] Using hardcoded model data");

    const friendliModels: FriendliModelData[] = [
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
    ];

    return transformFriendliModels(friendliModels);
}; 