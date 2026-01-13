import axios from "axios";

import type { Model } from "../../../src/schema.js";

/**
 * Raw model data from Inception API
 */
interface InceptionModel {
    created: number;
    id: string;
    object: string;
    owned_by: string;
    parent: string | null;
    permission: unknown[];
    root: string;
}

/**
 * Inception API response structure
 */
interface InceptionResponse {
    data: InceptionModel[];
    object: string;
}

/**
 * Hardcoded model information for Inception models
 * Source: Provider documentation and pricing information
 */
const INCEPTION_MODEL_INFO: Record<string, Partial<Model>> = {
    mercury: {
        attachment: false,
        cost: {
            input: 0.25 / 1000, // Convert from per 1M tokens to per 1K tokens
            inputCacheHit: 0.25 / 1000, // Convert from per 1M tokens to per 1K tokens
            output: 1.0 / 1000, // Convert from per 1M tokens to per 1K tokens
        },
        knowledge: "2023-10",
        lastUpdated: "2025-07-31",
        limit: {
            context: 128_000, // Maximum context window (tokens)
            output: 16_384, // Maximum output tokens
        },
        modalities: {
            input: ["text"],
            output: ["text"],
        },
        name: "Mercury",
        reasoning: false,
        releaseDate: "2025-06-26",
        temperature: true,
        toolCall: true,
    },
    "mercury-coder": {
        attachment: false,
        cost: {
            input: 0.25 / 1000, // Convert from per 1M tokens to per 1K tokens
            inputCacheHit: 0.25 / 1000, // Convert from per 1M tokens to per 1K tokens
            output: 1.0 / 1000, // Convert from per 1M tokens to per 1K tokens
        },
        knowledge: "2023-10",
        lastUpdated: "2025-07-31",
        limit: {
            context: 128_000, // Maximum context window (tokens)
            output: 16_384, // Maximum output tokens
        },
        modalities: {
            input: ["text"],
            output: ["text"],
        },
        name: "Mercury Coder",
        reasoning: false,
        releaseDate: "2025-02-26",
        temperature: true,
        toolCall: true,
    },
    "mercury-coder-small": {
        attachment: false,
        cost: {
            input: 0.25 / 1000, // Convert from per 1M tokens to per 1K tokens
            inputCacheHit: 0.25 / 1000, // Convert from per 1M tokens to per 1K tokens
            output: 1.0 / 1000, // Convert from per 1M tokens to per 1K tokens
        },
        knowledge: "2023-10",
        lastUpdated: "2025-07-31",
        limit: {
            context: 128_000, // Maximum context window (tokens)
            output: 16_384, // Maximum output tokens
        },
        modalities: {
            input: ["text"],
            output: ["text"],
        },
        name: "Mercury Coder Small",
        reasoning: false,
        releaseDate: "2025-02-26",
        temperature: true,
        toolCall: true,
    },
    "mercury-small": {
        attachment: false,
        cost: {
            input: 0.25 / 1000, // Convert from per 1M tokens to per 1K tokens
            inputCacheHit: 0.25 / 1000, // Convert from per 1M tokens to per 1K tokens
            output: 1.0 / 1000, // Convert from per 1M tokens to per 1K tokens
        },
        knowledge: "2023-10",
        lastUpdated: "2025-07-31",
        limit: {
            context: 128_000, // Maximum context window (tokens)
            output: 16_384, // Maximum output tokens
        },
        modalities: {
            input: ["text"],
            output: ["text"],
        },
        name: "Mercury Small",
        reasoning: false,
        releaseDate: "2025-06-26",
        temperature: true,
        toolCall: true,
    },
};

/**
 * Transforms an Inception model object into the normalized structure.
 * @param model The raw model object from Inception API
 * @returns The normalized model structure
 */
export const transformInceptionModel = (model: InceptionModel): Model => {
    // Get hardcoded model information if available
    const modelInfo = INCEPTION_MODEL_INFO[model.id] || {};

    return {
        attachment: modelInfo.attachment ?? false,
        cost: {
            input: modelInfo.cost?.input ?? null,
            inputCacheHit: modelInfo.cost?.inputCacheHit ?? null,
            output: modelInfo.cost?.output ?? null,
        },
        extendedThinking: false,
        id: model.id,
        knowledge: modelInfo.knowledge ?? null,
        lastUpdated: modelInfo.lastUpdated ?? null,
        limit: {
            context: modelInfo.limit?.context ?? null,
            output: modelInfo.limit?.output ?? null,
        },
        modalities: {
            input: modelInfo.modalities?.input ?? ["text"],
            output: modelInfo.modalities?.output ?? ["text"],
        },
        name: modelInfo.name ?? model.id,
        openWeights: false,
        provider: model.owned_by || "Inception",
        providerDoc: "https://platform.inceptionlabs.ai/docs",
        // Provider metadata
        providerEnv: ["INCEPTION_API_KEY"],
        providerModelsDevId: "inception",
        providerNpm: "@ai-sdk/openai-compatible",
        reasoning: modelInfo.reasoning ?? false,
        releaseDate: modelInfo.releaseDate ?? (model.created ? new Date(model.created * 1000).toISOString().split("T")[0] : null),
        streamingSupported: true,
        temperature: modelInfo.temperature ?? true,
        toolCall: modelInfo.toolCall ?? true,
        vision: false,
    };
};

/**
 * Fetches models from Inception API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchInceptionModels = async (): Promise<Model[]> => {
    console.log("[Inception] Fetching: https://api.inceptionlabs.ai/v1/models");

    try {
        const response = await axios.get<InceptionResponse>("https://api.inceptionlabs.ai/v1/models");
        const { data } = response;

        const models = Array.isArray(data.data) ? data.data : [];
        const transformedModels = models.map(transformInceptionModel);

        return transformedModels;
    } catch (error) {
        console.error("[Inception] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
