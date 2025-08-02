import axios from "axios";

import type { Model } from "../../../src/schema.js";

/**
 * Chutes model data interface
 */
interface ChutesModelData {
    capabilities?: {
        reasoning?: boolean;
        streaming?: boolean;
        temperature?: boolean;
        tool_calling?: boolean;
        vision?: boolean;
    };
    context_length?: number;
    id: string;
    name: string;
    pricing?: {
        input?: number;
        output?: number;
    };
}

/**
 * Transforms Chutes model data into the normalized structure.
 * @param modelsData Array of Chutes model data
 * @returns Array of normalized model objects
 */
export const transformChutesModels = (modelsData: ChutesModelData[]): Model[] => {
    const models: Model[] = [];

    for (const modelData of modelsData) {
        // Extract model name from ID (remove organization prefix)
        const modelName = modelData.id.includes("/") ? modelData.id.split("/")[1] : modelData.id;

        // Convert context length from tokens to characters (rough estimate)
        const contextLength = modelData.max_model_len ? modelData.max_model_len * 4 : null;

        // Convert price from USD per token to USD per 1K tokens
        const inputPrice = modelData.price.usd > 0 ? modelData.price.usd * 1000 : null;
        const outputPrice = modelData.price.usd > 0 ? modelData.price.usd * 1000 : null;

        const model: Model = {
            attachment: false,
            cost: {
                input: inputPrice,
                inputCacheHit: null,
                output: outputPrice,
            },
            extendedThinking: false, // Default to false, can be updated based on model name
            id: modelData.id,
            knowledge: null,
            lastUpdated: null,
            limit: {
                context: contextLength,
                output: null,
            },
            modalities: {
                input: ["text"], // Default to text, can be updated based on model capabilities
                output: ["text"],
            },
            name: modelName,
            openWeights: false,
            provider: "Chutes",
            providerDoc: "https://llm.chutes.ai/v1/models",
            providerEnv: ["CHUTES_API_KEY"],
            providerId: "chutes",
            providerNpm: "@ai-sdk/openai-compatible",
            reasoning: false, // Default to false, can be updated based on model name
            releaseDate: null,
            streamingSupported: true, // Most models support streaming
            temperature: true, // Most models support temperature
            toolCall: false, // Default to false, can be updated based on model capabilities
            vision: false, // Default to false, can be updated based on model name
        };

        models.push(model);
    }

    return models;
};

/**
 * Fetches Chutes models from their API.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchChutesModels = async (): Promise<Model[]> => {
    console.log("[Chutes] Fetching models from: https://llm.chutes.ai/v1/models");

    try {
        const response = await axios.get("https://llm.chutes.ai/v1/models");

        if (!response.data || response.data.object !== "list" || !Array.isArray(response.data.data)) {
            console.warn("[Chutes] Invalid response format, expected object with 'list' and 'data' array");

            return [];
        }

        const apiResponse: ChutesApiResponse = response.data;
        const modelsData: ChutesModelData[] = apiResponse.data;

        console.log(`[Chutes] Found ${modelsData.length} models`);

        const transformedModels = transformChutesModels(modelsData);

        console.log(`[Chutes] Successfully transformed ${transformedModels.length} models`);

        return transformedModels;
    } catch (error) {
        console.error("[Chutes] Error fetching models:", error instanceof Error ? error.message : String(error));

        // Return empty array as fallback
        return [];
    }
};
