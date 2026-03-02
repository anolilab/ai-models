import axios from "axios";

import type { Model } from "../../../src/schema.js";

const VENICE_API_URL = "https://api.venice.ai/api/v1/models";
const VENICE_DOCS_URL = "https://docs.venice.ai/";

/**
 * Raw model data from Venice API (OpenAI-compatible format with Venice extensions)
 */
interface VeniceModelSpec {
    availableContextTokens?: number;
    capabilities?: {
        functionCalling?: boolean;
        reasoning?: boolean;
        vision?: boolean;
        webSearch?: boolean;
    };
    inputCostPerMillionTokens?: null | string;
    modelType?: string;
    outputCostPerMillionTokens?: null | string;
}

interface VeniceRawModel {
    created?: number;
    id: string;
    model_spec?: VeniceModelSpec;
    object?: string;
    owned_by?: string;
    type?: string;
}

interface VeniceApiResponse {
    data: VeniceRawModel[];
    object: string;
}

const parseTokenCost = (val: null | string | undefined): null | number => {
    if (!val || val === "0") {
        return null;
    }

    const n = Number.parseFloat(val);

    return Number.isNaN(n) ? null : n;
};

/**
 * Transforms a single Venice API model entry into the normalized Model structure.
 */
export const transformVeniceModel = (rawModel: VeniceRawModel): Model => {
    const spec = rawModel.model_spec;
    const capabilities = spec?.capabilities;
    const hasVision = capabilities?.vision ?? false;
    const hasReasoning = capabilities?.reasoning ?? false;
    const hasToolCall = capabilities?.functionCalling ?? false;

    return {
        attachment: false,
        cost: {
            input: parseTokenCost(spec?.inputCostPerMillionTokens),
            inputCacheHit: null,
            output: parseTokenCost(spec?.outputCostPerMillionTokens),
        },
        extendedThinking: hasReasoning,
        id: rawModel.id,
        knowledge: null,
        lastUpdated: null,
        limit: {
            context: spec?.availableContextTokens ?? null,
            output: null,
        },
        modalities: {
            input: hasVision ? ["text", "image"] : ["text"],
            output: ["text"],
        },
        name: rawModel.id,
        openWeights: false,
        provider: "Venice",
        providerDoc: VENICE_DOCS_URL,
        providerEnv: ["VENICE_API_KEY"],
        providerModelsDevId: "venice",
        providerNpm: "@ai-sdk/venice",
        reasoning: hasReasoning,
        releaseDate: null,
        streamingSupported: true,
        temperature: true,
        toolCall: hasToolCall,
        vision: hasVision || undefined,
    };
};

/**
 * Fetches models from the Venice AI API (OpenAI-compatible list format).
 * @returns Promise resolving to an array of normalized Model objects
 */
export const fetchVeniceModels = async (): Promise<Model[]> => {
    console.log("[Venice] Fetching models from API:", VENICE_API_URL);

    try {
        const response = await axios.get<VeniceApiResponse>(VENICE_API_URL, {
            headers: {
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
            },
            timeout: 10_000,
        });

        const rawModels = response.data?.data;

        if (!Array.isArray(rawModels) || rawModels.length === 0) {
            console.warn("[Venice] No models returned from API");

            return [];
        }

        const models = rawModels.map(transformVeniceModel);

        console.log(`[Venice] Found ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Venice] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
