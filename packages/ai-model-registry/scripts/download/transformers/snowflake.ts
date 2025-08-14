import type { Model } from "../../../src/schema.js";

/**
 * Snowflake model data structure
 */
interface SnowflakeModelData {
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
 * Transforms Snowflake model data into the normalized structure.
 * @param models Array of Snowflake model data
 * @returns Array of normalized model objects
 */
export const transformSnowflakeModels = (models: SnowflakeModelData[]): Model[] => {
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
        provider: "Snowflake",
        providerDoc: "https://docs.snowflake.com/",
        providerEnv: ["SNOWFLAKE_ACCOUNT", "SNOWFLAKE_USERNAME", "SNOWFLAKE_PASSWORD"],
        providerId: "snowflake",
        providerModelsDevId: "snowflake",
        providerNpm: "@ai-sdk/snowflake",
        reasoning: false,
        releaseDate: model.release_date || null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: model.input_modalities?.includes("image") || false,
    }));
};

/**
 * Fetches Snowflake models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchSnowflakeModels = async (): Promise<Model[]> => {
    console.log("[Snowflake] Using hardcoded model data");

    const snowflakeModels: SnowflakeModelData[] = [
        {
            id: "snowflake-1",
            name: "Snowflake 1",
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

    return transformSnowflakeModels(snowflakeModels);
}; 