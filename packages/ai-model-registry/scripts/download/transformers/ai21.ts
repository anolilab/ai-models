import type { Model } from "../../../src/schema.js";

/**
 * AI21 Labs model data structure
 */
interface AI21ModelData {
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
 * Transforms AI21 Labs model data into the normalized structure.
 * @param models Array of AI21 Labs model data
 * @returns Array of normalized model objects
 */
export const transformAI21Models = (models: AI21ModelData[]): Model[] => {
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
        provider: "AI21 Labs",
        providerDoc: "https://docs.ai21.com/",
        providerEnv: ["AI21_API_KEY"],
        providerId: "ai21",
        providerModelsDevId: "ai21",
        providerNpm: "@ai-sdk/ai21",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches AI21 Labs models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchAI21Models = async (): Promise<Model[]> => {
    console.log("[AI21 Labs] Using hardcoded model data");

    const ai21Models: AI21ModelData[] = [
        {
            id: "j2-ultra",
            name: "Jurassic-2 Ultra",
            context_length: 8192,
            max_tokens: 4096,
            pricing: {
                input: 0.15,
                output: 0.15,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2023-12-01",
        },
        {
            id: "j2-mid",
            name: "Jurassic-2 Mid",
            context_length: 8192,
            max_tokens: 4096,
            pricing: {
                input: 0.08,
                output: 0.08,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2023-12-01",
        },
        {
            id: "j2-light",
            name: "Jurassic-2 Light",
            context_length: 8192,
            max_tokens: 4096,
            pricing: {
                input: 0.03,
                output: 0.03,
            },
            input_modalities: ["text"],
            output_modalities: ["text"],
            knowledge: "2023-12",
            release_date: "2023-12-01",
        },
    ];

    return transformAI21Models(ai21Models);
}; 