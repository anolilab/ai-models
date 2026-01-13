import { kebabCase } from "@visulima/string";
import axios from "axios";

import type { Model } from "../../../src/schema.js";

const WANDB_DOCS_URL = "https://docs.wandb.ai/guides/inference/models/";
const WANDB_PRICING_URL = "https://wandb.ai/site/pricing/inference";

/**
 * Weights & Biases model data structure for internal use
 */
interface WandBModelData {
    created: number;
    id: string;
    object: string;
    owned_by: string;
    parent: string | null;
    permission: unknown[];
    root: string;
}

/**
 * Pricing data structure from Weights & Biases pricing page
 * Source: https://wandb.ai/site/pricing/inference
 */
interface WandBPricingData {
    contextWindow: string;
    description: string;
    inputCost: number;
    name: string;
    outputCost: number;
    parameters: string;
    type: string;
}

/**
 * Model information structure from documentation
 */
interface WandBModelInfo {
    contextWindow: string;
    description: string;
    modelId: string;
    name: string;
    parameters: string;
    type: string;
}

const parseContextWindow = (contextWindow: string): number | null => {
    const match = contextWindow.match(/(\d+)K/i);

    if (match) {
        return parseInt(match[1], 10) * 1024;
    }

    return null;
};

/**
 * Fetches model information from Weights & Biases documentation
 * @returns Promise that resolves to a record of model information
 */
const fetchModelInfo = async (): Promise<Record<string, WandBModelInfo>> => {
    console.log("[Weights & Biases] Fetching model information from documentation...");

    try {
        const response = await axios.get(WANDB_DOCS_URL, {
            timeout: 30000,
        });

        const html = response.data;
        const modelInfo: Record<string, WandBModelInfo> = {};

        // Look for the models table structure
        // The table has: Model | Model ID (for API usage) | Type(s) | Context Window | Parameters | Description
        const tableRegex =
            /<tr>\s*<td>([^<]+)<\/td>\s*<td><code>([^<]+)<\/code><\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<\/tr>/g;

        let match;

        while ((match = tableRegex.exec(html)) !== null) {
            const modelName = match[1].trim();
            const modelId = match[2].trim();
            const type = match[3].trim();
            const contextWindow = match[4].trim();
            const parameters = match[5].trim();
            const description = match[6].trim();

            if (modelName && modelId) {
                modelInfo[modelName] = {
                    contextWindow,
                    description,
                    modelId,
                    name: modelName,
                    parameters,
                    type,
                };
            }
        }

        console.log(`[Weights & Biases] Successfully parsed ${Object.keys(modelInfo).length} model information entries from documentation`);

        return modelInfo;
    } catch (error) {
        console.error("[Weights & Biases] Error fetching model information:", error);
        throw error;
    }
};

/**
 * Fetches pricing data from Weights & Biases pricing page
 * @param modelInfo Model information from documentation for matching
 * @returns Promise that resolves to a record of pricing data
 */
const fetchPricingData = async (modelInfo: Record<string, WandBModelInfo>): Promise<Record<string, WandBPricingData>> => {
    console.log("[Weights & Biases] Fetching pricing data from pricing page...");

    try {
        const response = await axios.get(WANDB_PRICING_URL, {
            timeout: 30000,
        });

        const html = response.data;
        const pricingData: Record<string, WandBPricingData> = {};

        // Look for pricing table structure
        // The table has: Model | Input Tokens | Output Tokens
        const pricingRegex =
            /<div class="comparison-row__label">([^<]+)<\/div>\s*<div class="comparison-row__value">\$([^<]+)<\/div>\s*<div class="comparison-row__value">\$([^<]+)<\/div>/g;

        let match;

        while ((match = pricingRegex.exec(html)) !== null) {
            const modelName = match[1].trim();
            const inputCost = parseFloat(match[2]);
            const outputCost = parseFloat(match[3]);

            // Find the model in documentation by matching the model name
            // The pricing page uses API IDs, so we need to find the matching model
            const matchingModel = Object.values(modelInfo).find((model) => {
                // Try to match by model ID first
                if (model.modelId === modelName) return true;

                // Try to match by display name (with some normalization)
                const normalizedPricingName = modelName.toLowerCase().replace(/[^a-z0-9]/g, "");
                const normalizedDisplayName = model.name.toLowerCase().replace(/[^a-z0-9]/g, "");

                return normalizedPricingName.includes(normalizedDisplayName) || normalizedDisplayName.includes(normalizedPricingName);
            });

            if (matchingModel) {
                pricingData[matchingModel.modelId] = {
                    contextWindow: matchingModel.contextWindow,
                    description: matchingModel.description,
                    inputCost,
                    name: modelName,
                    outputCost,
                    parameters: matchingModel.parameters,
                    type: matchingModel.type,
                };
            }
        }

        console.log(`[Weights & Biases] Successfully parsed ${Object.keys(pricingData).length} pricing entries`);

        return pricingData;
    } catch (error) {
        console.error("[Weights & Biases] Error fetching pricing data:", error);
        throw error;
    }
};

/**
 * Transforms Weights & Biases model data to the standard Model format
 * @param modelData Raw model data
 * @param pricingData Optional pricing data
 * @returns Transformed model
 */
const transformWandBModel = (modelData: WandBModelData, pricingData?: WandBPricingData): Model => {
    const name = pricingData?.name || modelData.id;
    const description = pricingData?.description || "";
    const contextWindow = parseContextWindow(pricingData?.contextWindow || "");
    const hasVision = pricingData?.type?.toLowerCase().includes("vision") || false;

    return {
        attachment: false,
        cost: pricingData
            ? {
                  input: pricingData.inputCost / 1_000_000, // Convert from per 1M tokens to per token
                  inputCacheHit: null,
                  output: pricingData.outputCost / 1_000_000,
              }
            : null,
        description,
        extendedThinking: false,
        id: kebabCase(modelData.id),
        knowledge: null,
        lastUpdated: null,
        limit: {
            context: contextWindow,
            output: null,
        },
        modalities: {
            input: ["text"],
            output: ["text"],
        },
        name,
        openWeights: false,
        provider: "Weights & Biases",
        providerDoc: WANDB_DOCS_URL,
        providerEnv: ["WANDB_API_KEY"],
        providerId: "weights-biases",
        providerModelsDevId: "weights-biases",
        providerNpm: "@ai-sdk/openai-compatible",
        reasoning: name.toLowerCase().includes("thinking") || description.toLowerCase().includes("reasoning"),
        releaseDate: null,
        streamingSupported: true,
        temperature: true,
        toolCall: description.toLowerCase().includes("function calling") || description.toLowerCase().includes("tool"),
        vision: hasVision,
    };
};

/**
 * Fetches Weights & Biases models from their documentation and pricing pages.
 * @returns Promise that resolves to an array of transformed models
 */
// eslint-disable-next-line import/prefer-default-export
export const fetchWeightsBiasesModels = async (): Promise<Model[]> => {
    console.log("[Weights & Biases] Fetching models from documentation and pricing pages...");

    // Fetch model information from documentation
    const modelInfo = await fetchModelInfo();

    // Fetch pricing data from pricing page using dynamic model information
    const pricingData = await fetchPricingData(modelInfo);

    // Debug: Show which models are missing pricing data
    const modelNames = Object.keys(modelInfo);
    const pricingModelIds = Object.keys(pricingData);

    console.log(`[Weights & Biases] Models from documentation: ${modelNames.join(", ")}`);
    console.log(`[Weights & Biases] Models with pricing: ${pricingModelIds.join(", ")}`);

    // Check which documentation models don't have pricing data
    const missingPricing = modelNames.filter((name) => {
        const modelData = modelInfo[name];

        return !pricingModelIds.includes(modelData.modelId);
    });

    if (missingPricing.length > 0) {
        console.log(`[Weights & Biases] Models missing pricing data: ${missingPricing.join(", ")}`);
    } else {
        console.log(`[Weights & Biases] All models have pricing data! ✅`);
    }

    // Create models from pricing data
    const models = Object.entries(pricingData).map(([modelId, modelPricingData]) => {
        const mockModelData: WandBModelData = {
            created: Date.now(),
            id: modelId,
            object: "model",
            owned_by: "weights-biases",
            parent: null,
            permission: [],
            root: modelId,
        };

        return transformWandBModel(mockModelData, modelPricingData);
    });

    console.log(`[Weights & Biases] Successfully created ${models.length} models`);
    console.log(`[Weights & Biases] Done. Models processed: ${models.length}, saved: ${models.length}, errors: 0`);

    return models;
};
