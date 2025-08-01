import axios from "axios";

import type { Model } from "../../../src/schema.js";

/**
 * Raw model data from OpenRouter API
 */
interface OpenRouterModel {
    architecture?: {
        input_modalities?: string[];
        output_modalities?: string[];
    };
    author?: string;
    context_length?: number;
    created: number;
    id: string;
    name: string;
    owned_by?: string;
    pricing?: {
        completion?: string | number;
        prompt?: string | number;
    };
    top_provider?: {
        context_length?: number;
        max_completion_tokens?: number;
    };
}

/**
 * OpenRouter API response structure
 */
interface OpenRouterResponse {
    data: OpenRouterModel[];
}

/**
 * Safely gets a value from an object with a default fallback
 * @param obj The object to get the value from
 * @param key The key to look for
 * @param def Default value if key doesn't exist or is undefined
 * @returns The value or default
 * @example
 * const value = get(someObj, 'someKey', 'default');
 */
const get = <T>(object: unknown, key: string, def: T): T => {
    if (object && typeof object === "object" && key in object) {
        return (object as Record<string, T>)[key];
    }

    return def;
};

/**
 * Transforms an OpenRouter model object (new API structure) into the normalized structure.
 * @param model The raw model object from OpenRouter API
 * @returns The normalized model structure
 */
const transformOpenRouterModel = (model: OpenRouterModel): Model => {
    const pricing = model.pricing || {};

    return {
        attachment: false,
        cost: {
            input: typeof pricing.prompt === "number" ? pricing.prompt : null,
            inputCacheHit: null,
            output: typeof pricing.completion === "number" ? pricing.completion : null,
        },
        extendedThinking: false,
        id: model.id,
        knowledge: null,
        lastUpdated: null,
        limit: {
            context: model.context_length || get(model.top_provider, "context_length", null),
            output: get(model.top_provider, "max_completion_tokens", null),
        },
        modalities: {
            input: get(model.architecture, "input_modalities", ["text"]),
            output: get(model.architecture, "output_modalities", ["text"]),
        },
        name: model.name,
        openWeights: false,
        provider: model.owned_by || model.author || "OpenRouter",
        providerDoc: "https://openrouter.ai/docs",
        // Provider metadata
        providerEnv: ["OPENROUTER_API_KEY"],
        providerModelsDevId: "openrouter",
        providerNpm: "@ai-sdk/openrouter",
        reasoning: false,
        releaseDate: model.created ? new Date(model.created * 1000).toISOString().split("T")[0] : null,
        streamingSupported: true,
        temperature: true,
        toolCall: true,
        vision: get(model.architecture, "input_modalities", []).includes("image"),
    };
};

/**
 * Fetches models from OpenRouter API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchOpenRouterModels(): Promise<Model[]> {
    console.log("[OpenRouter] Fetching: https://openrouter.ai/api/v1/models");

    try {
        const response = await axios.get<OpenRouterResponse>("https://openrouter.ai/api/v1/models");
        const { data } = response;

        const models = Array.isArray(data.data) ? data.data : [];
        const transformedModels = models.map(transformOpenRouterModel);

        return transformedModels;
    } catch (error) {
        console.error("[OpenRouter] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

export { fetchOpenRouterModels, transformOpenRouterModel };
