import { kebabCase } from "@visulima/string";

import type { Model } from "../../../src/schema.js";

const XAI_DOCS_URL = "https://docs.x.ai/docs/models";

/**
 * Fetches XAI models from static data based on official documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchXAIModels = async (): Promise<Model[]> => {
    console.log("[XAI] Using static model data from documentation...");

    try {
        const models = getStaticModels();

        console.log(`[XAI] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[XAI] Error processing models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};

/**
 * Returns static XAI models data based on official documentation
 */
const getStaticModels = (): Model[] => {
    const modelData = [
        {
            context: 262144,
            functionCalling: true,
            name: "grok-4-0709",
            output: ["text"],
            reasoning: true,
            toolCall: true,
            vision: true,
        },
        {
            context: 131072,
            functionCalling: true,
            name: "grok-3",
            output: ["text"],
            reasoning: false,
            toolCall: false,
            vision: false,
        },
        {
            context: 131072,
            functionCalling: true,
            name: "grok-3-mini",
            output: ["text"],
            reasoning: true,
            toolCall: true,
            vision: false,
        },
        {
            context: 131072,
            functionCalling: true,
            name: "grok-3-fast",
            output: ["text"],
            reasoning: false,
            toolCall: false,
            vision: false,
        },
        {
            context: 131072,
            functionCalling: true,
            name: "grok-3-mini-fast",
            output: ["text"],
            reasoning: true,
            toolCall: true,
            vision: false,
        },
        {
            context: 32768,
            functionCalling: true,
            name: "grok-2-vision-1212",
            output: ["text"],
            reasoning: false,
            toolCall: false,
            vision: true,
        },
        {
            context: null,
            functionCalling: false,
            name: "grok-2-image-1212",
            output: ["image"],
            reasoning: false,
            toolCall: false,
            vision: true,
        },
    ];

    const models: Model[] = [];

    for (const data of modelData) {
        const model: Model = {
            attachment: false,
            cost: {
                input: null,
                inputCacheHit: null,
                output: null,
            },
            extendedThinking: false,
            id: kebabCase(data.name),
            knowledge: null,
            lastUpdated: null,
            limit: {
                context: data.context,
                output: null,
            },
            modalities: {
                input: data.vision ? ["text", "image"] : ["text"],
                output: data.output,
            },
            name: data.name,
            openWeights: false,
            provider: "XAI",
            providerDoc: XAI_DOCS_URL,
            // Provider metadata
            providerEnv: ["XAI_API_KEY"],
            providerModelsDevId: "xai",
            providerNpm: "@ai-sdk/xai",
            reasoning: data.reasoning,
            releaseDate: null,
            streamingSupported: true,
            temperature: true,
            toolCall: data.toolCall,
            vision: data.vision,
        };

        models.push(model);
    }

    console.log(`[XAI] Created ${models.length} models from static data`);

    return models;
};

/**
 * Transforms XAI model data into the normalized structure.
 * @param rawData Raw data from XAI API
 * @returns Array of normalized model objects
 */
export const transformXAIModels = (rawData: any): Model[] => {
    const models: Model[] = [];

    // This function is kept for interface compatibility but the main logic is in fetchXAIModels
    if (Array.isArray(rawData)) {
        for (const modelData of rawData) {
            const model: Model = {
                attachment: false,
                cost: {
                    input: null,
                    inputCacheHit: null,
                    output: null,
                },
                extendedThinking: false,
                id: kebabCase(modelData.id || modelData.name),
                knowledge: null,
                lastUpdated: null,
                limit: {
                    context: modelData.context_length || null,
                    output: null,
                },
                modalities: {
                    input: modelData.capabilities?.vision ? ["text", "image"] : ["text"],
                    output: ["text"],
                },
                name: modelData.name || modelData.id,
                openWeights: false,
                provider: "XAI",
                providerDoc: XAI_DOCS_URL,
                // Provider metadata
                providerEnv: ["XAI_API_KEY"],
                providerModelsDevId: "xai",
                providerNpm: "@ai-sdk/xai",
                reasoning: false,
                releaseDate: null,
                streamingSupported: true,
                temperature: true,
                toolCall: false,
                vision: modelData.capabilities?.vision || false,
            };

            models.push(model);
        }
    }

    return models;
};
