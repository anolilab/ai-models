import axios from "axios";

import type { Model } from "../../../src/schema.js";

const V0_API_URL = "https://api.v0.dev/v1/models";
const V0_DOCS_URL = "https://v0.dev/docs/api";

/**
 * Raw model entry from the v0 OpenAI-compatible models list endpoint
 */
interface V0RawModel {
    created: number;
    id: string;
    object: string;
    owned_by: string;
}

/**
 * Response envelope from the v0 models API
 */
interface V0ApiResponse {
    data: V0RawModel[];
    object: string;
}

/**
 * Transforms a single v0 API model entry into the normalized Model structure.
 */
export const transformV0Model = (rawModel: V0RawModel): Model => {
    const isLarge = rawModel.id.endsWith("-lg");
    const releaseDate = rawModel.created ? new Date(rawModel.created * 1000).toISOString().split("T")[0] : null;

    return {
        attachment: false,
        cost: {
            input: null,
            inputCacheHit: null,
            output: null,
        },
        extendedThinking: false,
        id: rawModel.id,
        knowledge: null,
        lastUpdated: null,
        limit: {
            // v0-1.5-lg has a larger context than md variants
            context: isLarge ? 128_000 : 64_000,
            output: null,
        },
        modalities: {
            input: ["text", "image"],
            output: ["text"],
        },
        name: rawModel.id,
        openWeights: false,
        ownedBy: rawModel.owned_by,
        provider: "Vercel",
        providerDoc: V0_DOCS_URL,
        providerEnv: ["V0_API_KEY"],
        providerModelsDevId: "v0",
        providerNpm: "@ai-sdk/v0",
        reasoning: false,
        releaseDate,
        streamingSupported: true,
        temperature: true,
        toolCall: true,
        vision: true,
    };
};

/**
 * Fetches models from the v0 API (OpenAI-compatible list format).
 * @returns Promise resolving to an array of normalized Model objects
 */
export const fetchV0Models = async (): Promise<Model[]> => {
    console.log("[V0] Fetching models from API:", V0_API_URL);

    try {
        const response = await axios.get<V0ApiResponse>(V0_API_URL, {
            headers: {
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
            },
            timeout: 10_000,
        });

        const rawModels = response.data?.data;

        if (!Array.isArray(rawModels) || rawModels.length === 0) {
            console.warn("[V0] No models returned from API");

            return [];
        }

        const models = rawModels.map(transformV0Model);

        console.log(`[V0] Found ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[V0] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
