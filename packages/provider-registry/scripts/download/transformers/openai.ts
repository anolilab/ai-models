import { kebabCase } from "@visulima/string";
import axios from "axios";

import type { Model } from "../../../src/schema.js";

/**
 * OpenAI model data from models.dev API
 */
interface OpenAIModelData {
    attachment: boolean;
    cost: {
        cache_read?: number;
        input: number;
        output: number;
    };
    id: string;
    knowledge: string;
    last_updated: string;
    limit: {
        context: number;
        output: number;
    };
    modalities: {
        input: string[];
        output: string[];
    };
    name: string;
    open_weights: boolean;
    reasoning: boolean;
    release_date: string;
    temperature: boolean;
    tool_call: boolean;
}

/**
 * OpenAI provider data from models.dev API
 */
interface OpenAIProviderData {
    doc: string;
    env: string[];
    id: string;
    models: Record<string, OpenAIModelData>;
    name: string;
    npm: string;
}

/**
 * Transforms OpenAI model data from models.dev API into the normalized structure.
 * @param providerData The provider data from models.dev API
 * @returns Array of normalized model objects
 */
const transformOpenAIModels = (providerData: OpenAIProviderData): Model[] => {
    const models: Model[] = [];

    for (const [modelId, modelData] of Object.entries(providerData.models)) {
        const model: Model = {
            attachment: modelData.attachment,
            cost: {
                input: modelData.cost.input,
                inputCacheHit: modelData.cost.cache_read || null,
                output: modelData.cost.output,
            },
            extendedThinking: modelData.extended_thinking,
            id: modelId,
            knowledge: modelData.knowledge,
            lastUpdated: modelData.last_updated || null,
            limit: {
                context: modelData.limit.context,
                output: modelData.limit.output,
            },
            modalities: {
                input: modelData.modalities.input,
                output: modelData.modalities.output,
            },
            name: modelData.name,
            openWeights: modelData.open_weights,
            provider: "OpenAI",
            providerDoc: providerData.doc,
            // Provider metadata
            providerEnv: providerData.env,
            providerModelsDevId: providerData.id,
            providerNpm: providerData.npm,
            reasoning: modelData.reasoning,
            releaseDate: modelData.release_date || null,
            streamingSupported: true,
            temperature: modelData.temperature,
            toolCall: modelData.tool_call,
            vision: modelData.vision,
        };

        models.push(model);
    }

    return models;
};

/**
 * Fetches OpenAI models from models.dev API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchOpenAIModels(): Promise<Model[]> {
    console.log("[OpenAI] Fetching: https://models.dev/api.json");

    try {
        const response = await axios.get("https://models.dev/api.json");
        const apiData = response.data;

        // Extract OpenAI provider data
        const openAIProviderData = apiData.openai as OpenAIProviderData;

        if (!openAIProviderData) {
            console.error("[OpenAI] No OpenAI provider data found in models.dev API");

            return [];
        }

        const models = transformOpenAIModels(openAIProviderData);

        console.log(`[OpenAI] Successfully transformed ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[OpenAI] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

export { fetchOpenAIModels, transformOpenAIModels };
