import type { Model } from "../../../src/schema.js";

/**
 * Moonshot AI model data structure
 */
interface MoonshotModelData {
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
 * Transforms Moonshot AI model data into the normalized structure.
 * @param models Array of Moonshot AI model data
 * @returns Array of normalized model objects
 */
export const transformMoonshotModels = (models: MoonshotModelData[]): Model[] => {
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
        provider: "Moonshot AI",
        providerDoc: "https://platform.moonshot.cn/docs",
        providerEnv: ["MOONSHOT_API_KEY"],
        providerId: "moonshot",
        providerModelsDevId: "moonshot",
        providerNpm: "@ai-sdk/moonshot",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches Moonshot AI models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchMoonshotModels = async (): Promise<Model[]> => {
    console.log("[Moonshot AI] Using hardcoded model data");

    const moonshotModels: MoonshotModelData[] = [
        {
            id: "moonshot-v1-8k",
            name: "Moonshot v1 8K",
            context_length: 8192,
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
            id: "moonshot-v1-32k",
            name: "Moonshot v1 32K",
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
            id: "moonshot-v1-128k",
            name: "Moonshot v1 128K",
            context_length: 131072,
            max_tokens: 4096,
            pricing: {
                input: 0.3,
                output: 0.3,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2024-01-01",
        },
    ];

    return transformMoonshotModels(moonshotModels);
}; 