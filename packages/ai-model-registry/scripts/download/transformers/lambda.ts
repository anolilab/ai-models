import type { Model } from "../../../src/schema.js";

/**
 * Lambda model data structure
 */
interface LambdaModelData {
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
 * Transforms Lambda model data into the normalized structure.
 * @param models Array of Lambda model data
 * @returns Array of normalized model objects
 */
export const transformLambdaModels = (models: LambdaModelData[]): Model[] => {
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
        provider: "Lambda",
        providerDoc: "https://docs.lambda.com/",
        providerEnv: ["LAMBDA_API_KEY"],
        providerId: "lambda",
        providerModelsDevId: "lambda",
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
 * Fetches Lambda models using hardcoded data.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchLambdaModels = async (): Promise<Model[]> => {
    console.log("[Lambda] Using hardcoded model data");

    const lambdaModels: LambdaModelData[] = [
        {
            id: "lambda-1",
            name: "Lambda 1",
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

    return transformLambdaModels(lambdaModels);
}; 