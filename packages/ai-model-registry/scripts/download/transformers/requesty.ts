import { kebabCase } from "@visulima/string";
import axios from "axios";

import type { Model } from "../../../src/schema.js";

const REQUESTY_API_URL = "https://router.requesty.ai/v1/models";
const REQUESTY_DOCS_URL = "https://docs.requesty.ai/";

/**
 * Interface for the Requesty API response model structure
 */
interface RequestyModel {
    api?: string;
    cached_price: number;
    caching_price: number;
    context_window: number;
    created: number;
    description: string;
    id: string;
    input_price: number;
    max_output_tokens: number;
    object: string;
    output_price: number;
    owned_by: string;
    supports_caching: boolean;
    supports_computer_use: boolean;
    supports_reasoning: boolean;
    supports_vision: boolean;
}

/**
 * Interface for the Requesty API response
 */
interface RequestyApiResponse {
    data: RequestyModel[];
    object: "list";
}

/**
 * Converts a Unix timestamp to an ISO date string
 */
const timestampToDateString = (timestamp: number): string | null => {
    if (!timestamp || timestamp <= 0) {
        return null;
    }

    try {
        return new Date(timestamp * 1000).toISOString();
    } catch {
        return null;
    }
};

/**
 * Transforms Requesty model data into the normalized structure.
 * @param rawData Raw data from Requesty API
 * @returns Array of normalized model objects
 */
export const transformRequestyModels = (rawData: RequestyApiResponse | RequestyModel[]): Model[] => {
    const models: Model[] = [];

    // Handle both the full API response and just the data array
    const modelDataArray: RequestyModel[] = "data" in rawData && Array.isArray(rawData.data) ? rawData.data : Array.isArray(rawData) ? rawData : [];

    for (const modelData of modelDataArray) {
        // Determine input modalities based on vision support
        const inputModalities = modelData.supports_vision ? ["text", "image"] : ["text"];

        // Convert pricing from per-token to per-1M tokens (if needed)
        // The API returns prices that might already be in the right format, but we'll use them as-is
        const inputPrice = modelData.input_price != null && modelData.input_price > 0 ? modelData.input_price : null;
        const cachedPrice = modelData.cached_price != null && modelData.cached_price > 0 ? modelData.cached_price : null;
        const outputPrice = modelData.output_price != null && modelData.output_price > 0 ? modelData.output_price : null;

        const model: Model = {
            attachment: false,
            cost: {
                input: inputPrice,
                inputCacheHit: cachedPrice,
                output: outputPrice,
            },
            description: modelData.description || undefined,
            extendedThinking: modelData.supports_reasoning || false,
            id: kebabCase(modelData.id),
            knowledge: null,
            lastUpdated: null,
            limit: {
                context: modelData.context_window > 0 ? modelData.context_window : null,
                output: modelData.max_output_tokens > 0 ? modelData.max_output_tokens : null,
            },
            modalities: {
                input: inputModalities,
                output: ["text"],
            },
            name: modelData.id,
            openWeights: false,
            ownedBy: modelData.owned_by || undefined,
            provider: "Requesty",
            providerDoc: REQUESTY_DOCS_URL,
            // Provider metadata
            providerEnv: ["REQUESTY_API_KEY"],
            providerModelsDevId: "requesty",
            providerNpm: "@ai-sdk/requesty",
            reasoning: modelData.supports_reasoning || false,
            releaseDate: timestampToDateString(modelData.created),
            streamingSupported: true,
            temperature: true,
            toolCall: modelData.supports_computer_use || false,
            vision: modelData.supports_vision || false,
        };

        models.push(model);
    }

    return models;
};

/**
 * Fetches Requesty models from their API.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchRequestyModels = async (): Promise<Model[]> => {
    console.log("[Requesty] Fetching models from API...");

    try {
        console.log("[Requesty] Fetching from API:", REQUESTY_API_URL);
        const apiResponse = await axios.get<RequestyApiResponse>(REQUESTY_API_URL);

        if (!apiResponse.data) {
            console.warn("[Requesty] API returned no data");

            return [];
        }

        const models = transformRequestyModels(apiResponse.data);

        console.log(`[Requesty] Successfully fetched and transformed ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Requesty] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
