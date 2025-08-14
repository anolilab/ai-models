import type { Model } from "../../../src/schema.js";

/**
 * Cohere model data structure
 */
interface CohereModelData {
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
 * Transforms Cohere model data into the normalized structure.
 * @param models Array of Cohere model data
 * @returns Array of normalized model objects
 */
export const transformCohereModels = (models: CohereModelData[]): Model[] => {
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
        provider: "Cohere",
        providerDoc: "https://docs.cohere.com/",
        providerEnv: ["COHERE_API_KEY"],
        providerId: "cohere",
        providerModelsDevId: "cohere",
        providerNpm: "@ai-sdk/cohere",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches Cohere models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchCohereModels = async (): Promise<Model[]> => {
    console.log("[Cohere] Using hardcoded model data");

    const cohereModels: CohereModelData[] = [
        {
            id: "command",
            name: "Command",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.15,
                output: 0.6,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-10",
            release_date: "2023-10-01",
        },
        {
            id: "command-light",
            name: "Command Light",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.15,
                output: 0.6,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-10",
            release_date: "2023-10-01",
        },
        {
            id: "command-nightly",
            name: "Command Nightly",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.15,
                output: 0.6,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-10",
            release_date: "2023-10-01",
        },
        {
            id: "command-light-nightly",
            name: "Command Light Nightly",
            context_length: 32768,
            max_tokens: 4096,
            pricing: {
                input: 0.15,
                output: 0.6,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-10",
            release_date: "2023-10-01",
        },
    ];

    return transformCohereModels(cohereModels);
}; 