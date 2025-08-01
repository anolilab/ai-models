import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

/**
 * Model mapping from API names to actual model names
 */
interface ModelMappings {
    [key: string]: string;
}

/**
 * Release dates for models
 */
interface ReleaseDates {
    [key: string]: string;
}

/**
 * Pricing data for a model
 */
interface PricingData {
    input?: number;
    input_cache_hit?: number;
    output?: number;
}

/**
 * API model configuration
 */
interface ApiModelConfig {
    id: string;
    outputLimit: number;
    reasoning: boolean;
}

/**
 * Transforms DeepSeek model data from their pricing documentation page into the normalized structure.
 * @param htmlContent The HTML content from the DeepSeek pricing page
 * @returns Array of normalized model objects
 */
const parsePrice = (priceString: string): number | null => {
    if (!priceString || priceString === "N/A" || priceString === "Free") {
        return null;
    }

    const match = priceString.match(/\$?([\d,]+\.?\d*)/);

    if (match) {
        return Number.parseFloat(match[1].replaceAll(",", ""));
    }

    return null;
};

const parseTokenLimit = (limitString: string): number | null => {
    if (!limitString || limitString === "N/A")
        return null;

    const match = limitString.match(/(\d+(?:\.\d+)?)\s*K/i);

    if (match) {
        return Math.round(Number.parseFloat(match[1]) * 1000);
    }

    // Try to match just numbers
    const numberMatch = limitString.match(/(\d+)/);

    if (numberMatch) {
        return Number.parseInt(numberMatch[1], 10);
    }

    return null;
};

const transformDeepSeekModels = (htmlContent: string): Model[] => {
    const $ = load(htmlContent);
    const models: Model[] = [];

    // Find the models table
    $("table").each((tableIndex, table) => {
        const tableText = $(table).text();

        // Look for the table that contains model information
        if (tableText.includes("Model") && (tableText.includes("Context") || tableText.includes("Tokens"))) {
            console.log(`[DeepSeek] Found models table ${tableIndex + 1}`);

            $(table)
                .find("tbody tr")
                .each((rowIndex, row) => {
                    const cells = $(row)
                        .find("td")
                        .map((_, td) => $(td).text().trim())
                        .get();

                    // Skip header rows or empty rows
                    if (cells.length < 3 || !cells[0] || cells[0].includes("Model")) {
                        return;
                    }

                    const modelName = cells[0];
                    const contextLength = cells[1];
                    const maxOutput = cells[2];
                    const inputCost = cells[3];
                    const outputCost = cells[4];

                    // Skip if not a valid model
                    if (!modelName || modelName === "N/A") {
                        return;
                    }

                    console.log(`[DeepSeek] Processing model: ${modelName}`);

                    // Determine model capabilities based on name
                    const isVision = modelName.toLowerCase().includes("vision");
                    const isR1 = modelName.toLowerCase().includes("r1");
                    const isV3 = modelName.toLowerCase().includes("v3");

                    // Determine reasoning capability (R1 models have extended thinking)
                    const hasExtendedThinking = isR1;

                    // Determine tool calling capability
                    const hasToolCall = isR1 || isV3;

                    // Determine temperature support
                    const hasTemperature = isV3; // V3 models support temperature

                    // Determine knowledge cutoff
                    let knowledgeCutoff = null;

                    if (modelName.includes("2024")) {
                        knowledgeCutoff = "2024";
                    } else if (modelName.includes("2023")) {
                        knowledgeCutoff = "2023";
                    }

                    // Determine release date based on model name
                    let releaseDate = null;

                    if (modelName.includes("r1-0528")) {
                        releaseDate = "2024-05-28";
                    } else if (modelName.includes("v3-0324")) {
                        releaseDate = "2024-03-24";
                    } else if (modelName.includes("r1")) {
                        releaseDate = "2024-01-15";
                    }

                    const model: Model = {
                        attachment: false,
                        cost: {
                            input: parsePrice(inputCost),
                            inputCacheHit: null,
                            output: parsePrice(outputCost),
                        },
                        extendedThinking: hasExtendedThinking,
                        id: kebabCase(modelName),
                        knowledge: knowledgeCutoff,
                        lastUpdated: null,
                        limit: {
                            context: parseTokenLimit(contextLength),
                            output: parseTokenLimit(maxOutput),
                        },
                        modalities: {
                            input: isVision ? ["text", "image"] : ["text"],
                            output: ["text"],
                        },
                        name: modelName,
                        openWeights: false,
                        provider: "DeepSeek",
                        providerDoc: "https://api-docs.deepseek.com/quick_start/pricing",
                        // Provider metadata
                        providerEnv: ["DEEPSEEK_API_KEY"],
                        providerModelsDevId: "deepseek",
                        providerNpm: "@ai-sdk/deepseek",
                        reasoning: hasExtendedThinking,
                        releaseDate,
                        streamingSupported: true,
                        temperature: hasTemperature,
                        toolCall: hasToolCall,
                        vision: isVision,
                    };

                    models.push(model);
                });
        }
    });

    console.log(`[DeepSeek] Extracted ${models.length} models from documentation`);

    return models;
};

/**
 * Fetches models from DeepSeek pricing documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchDeepSeekModels(): Promise<Model[]> {
    console.log("[DeepSeek] Fetching: https://api-docs.deepseek.com/quick_start/pricing");

    try {
        const response = await axios.get("https://api-docs.deepseek.com/quick_start/pricing");
        const htmlContent = response.data;

        const models = transformDeepSeekModels(htmlContent);

        return models;
    } catch (error) {
        console.error("[DeepSeek] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

export { fetchDeepSeekModels, transformDeepSeekModels };
