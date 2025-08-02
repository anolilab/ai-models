import type { Model } from "../../../src/schema.js";

/**
 * Replicate model data structure
 */
interface ReplicateModelData {
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
 * Transforms Replicate model data into the normalized structure.
 * @param models Array of Replicate model data
 * @returns Array of normalized model objects
 */
export const transformReplicateModels = (models: ReplicateModelData[]): Model[] => {
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
        provider: "Replicate",
        providerDoc: "https://replicate.com/docs",
        providerEnv: ["REPLICATE_API_TOKEN"],
        providerId: "replicate",
        providerModelsDevId: "replicate",
        providerNpm: "@ai-sdk/replicate",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches Replicate models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchReplicateModels = async (): Promise<Model[]> => {
    console.log("[Replicate] Using hardcoded model data");

    const replicateModels: ReplicateModelData[] = [
        {
            id: "llama-2-70b-chat",
            name: "Llama 2 70B Chat",
            context_length: 4096,
            max_tokens: 4096,
            pricing: {
                input: 0.7,
                output: 0.8,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2022-09",
            release_date: "2023-07-18",
        },
        {
            id: "llama-2-13b-chat",
            name: "Llama 2 13B Chat",
            context_length: 4096,
            max_tokens: 4096,
            pricing: {
                input: 0.2,
                output: 0.2,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2022-09",
            release_date: "2023-07-18",
        },
    ];

    return transformReplicateModels(replicateModels);
}; 