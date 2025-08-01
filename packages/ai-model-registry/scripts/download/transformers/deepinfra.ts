import { kebabCase } from "@visulima/string";
import axios from "axios";

import type { Model } from "../../../src/schema.js";

/**
 * Deep Infra model data from models.dev API
 */
interface DeepInfraModelData {
    attachment: boolean;
    cost: {
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
 * Deep Infra provider data from models.dev API
 */
interface DeepInfraProviderData {
    doc: string;
    env: string[];
    id: string;
    models: Record<string, DeepInfraModelData>;
    name: string;
    npm: string;
}

/**
 * Transforms Deep Infra model data from models.dev API into the normalized structure.
 * @param providerData The provider data from models.dev API
 * @returns Array of normalized model objects
 */
const transformDeepInfraModels = (providerData: DeepInfraProviderData): Model[] => {
    const models: Model[] = [];

    for (const [modelId, modelData] of Object.entries(providerData.models)) {
        const model: Model = {
            attachment: modelData.attachment,
            cost: {
                input: modelData.cost.input,
                inputCacheHit: null,
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
            provider: "Deep Infra",
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
 * Fetches Deep Infra models from models.dev API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchDeepInfraModels(): Promise<Model[]> {
    console.log("[Deep Infra] Fetching: https://models.dev/api.json");

    try {
        const response = await axios.get("https://models.dev/api.json");
        const apiData = response.data;

        // Extract Deep Infra provider data
        const deepInfraProviderData = apiData.deepinfra as DeepInfraProviderData;

        if (!deepInfraProviderData) {
            console.error("[Deep Infra] No Deep Infra provider data found in models.dev API");

            return [];
        }

        const models = transformDeepInfraModels(deepInfraProviderData);

        console.log(`[Deep Infra] Successfully transformed ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Deep Infra] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

export { fetchDeepInfraModels, transformDeepInfraModels };
