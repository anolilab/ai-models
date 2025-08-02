import axios from "axios";

import type { Model } from "../../../src/schema.js";

/**
 * Raw model data from Vercel Gateway API
 */
interface VercelModel {
    author?: string;
    context_window?: number;
    created: number;
    id: string;
    input_modalities?: string[];
    knowledge?: string;
    max_tokens?: number;
    name: string;
    output_modalities?: string[];
    owned_by?: string;
    pricing?: {
        input?: string | number;
        output?: string | number;
    };
}

/**
 * Vercel Gateway API response structure
 */
interface VercelResponse {
    data: VercelModel[];
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
 * Transforms a Vercel Gateway model object into the normalized structure.
 * @param model The raw model object from Vercel Gateway API
 * @returns The normalized model structure
 */
export const transformVercelModel = (model: VercelModel): Model => {
    const pricing = model.pricing || {};

    return {
        attachment: false,
        cost: {
            input: typeof pricing.input === "number" ? pricing.input : null,
            inputCacheHit: null,
            output: typeof pricing.output === "number" ? pricing.output : null,
        },
        extendedThinking: false,
        id: model.id,
        knowledge: model.knowledge || null,
        lastUpdated: null,
        limit: {
            context: model.context_window || null,
            output: model.max_tokens || null,
        },
        modalities: {
            input: get(model, "input_modalities", ["text"]),
            output: get(model, "output_modalities", ["text"]),
        },
        name: model.name,
        openWeights: false,
        provider: model.owned_by || model.author || "Vercel",
        providerDoc: "https://sdk.vercel.ai/docs",
        // Provider metadata
        providerEnv: ["VERCEL_AI_API_KEY"],
        providerModelsDevId: "vercel",
        providerNpm: "@ai-sdk/vercel",
        reasoning: false,
        releaseDate: model.created ? new Date(model.created * 1000).toISOString().split("T")[0] : null,
        streamingSupported: true,
        temperature: true,
        toolCall: true,
        vision: get(model, "input_modalities", []).includes("image"),
    };
};

/**
 * Fetches models from Vercel Gateway API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchVercelModels = async (): Promise<Model[]> => {
    console.log("[VercelGateway] Fetching: https://ai-gateway.vercel.sh/v1/models");

    try {
        const response = await axios.get<VercelResponse>("https://ai-gateway.vercel.sh/v1/models");
        const { data } = response;

        const models = Array.isArray(data.data) ? data.data : [];
        const transformedModels = models.map(transformVercelModel);

        return transformedModels;
    } catch (error) {
        console.error("[VercelGateway] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
