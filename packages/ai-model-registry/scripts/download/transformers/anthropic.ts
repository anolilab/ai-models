import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

/**
 * Model details extracted from the features table
 */
interface ModelDetails {
    api_model_name?: string;
    comparative_latency?: string;
    context_window?: string;
    description?: string;
    extended_thinking?: boolean;
    max_output?: string;
    multilingual?: boolean;
    priority_tier?: boolean;
    strengths?: string;
    training_cutoff?: string;
    vision?: boolean;
}

/**
 * Pricing information extracted from the pricing table
 */
interface ModelPricing {
    input: number | null;
    output: number | null;
}

/**
 * Raw model data before transformation
 */
interface RawModelData {
    details: ModelDetails;
    name: string;
    pricing: ModelPricing;
}

/**
 * Model column information from the features table header
 */
interface ModelColumn {
    index: number;
    name: string;
}

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
    if (!limitString || limitString === "N/A") {
        return null;
    }

    const match = limitString.match(/([\d,]+)/);

    if (match) {
        return Number.parseInt(match[1].replaceAll(",", ""), 10);
    }

    return null;
};

/**
 * Transforms Anthropic model data from their documentation page into the normalized structure.
 * @param htmlContent The HTML content from the Anthropic models documentation page
 * @returns Array of normalized model objects
 */
const transformAnthropicModels = (htmlContent: string): Model[] => {
    const $ = load(htmlContent);
    const models: Model[] = [];

    // Find the models table
    $("table").each((tableIndex, table) => {
        const tableText = $(table).text();

        // Look for the table that contains model information
        if (tableText.includes("Claude") && (tableText.includes("Context") || tableText.includes("Tokens"))) {
            console.log(`[Anthropic] Found models table ${tableIndex + 1}`);

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

                    // Skip if not a valid Claude model
                    if (!modelName.toLowerCase().includes("claude")) {
                        return;
                    }

                    console.log(`[Anthropic] Processing model: ${modelName}`);

                    // Determine model capabilities based on name
                    const isVision = modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("haiku");
                    const isSonnet = modelName.toLowerCase().includes("sonnet");
                    const isOpus = modelName.toLowerCase().includes("opus");
                    const isHaiku = modelName.toLowerCase().includes("haiku");

                    // Determine reasoning capability (Opus and Sonnet have extended thinking)
                    const hasExtendedThinking = isOpus || isSonnet;

                    // Determine tool calling capability
                    const hasToolCall = isOpus || isSonnet || isHaiku;

                    // Determine temperature support
                    const hasTemperature = true; // All Claude models support temperature

                    // Determine knowledge cutoff
                    let knowledgeCutoff = null;

                    if (modelName.includes("2024")) {
                        knowledgeCutoff = "2024";
                    } else if (modelName.includes("2023")) {
                        knowledgeCutoff = "2023";
                    }

                    // Determine release date based on model name
                    let releaseDate = null;

                    if (modelName.includes("3.5")) {
                        releaseDate = "2024-03-04";
                    } else if (modelName.includes("3")) {
                        releaseDate = "2024-02-29";
                    } else if (modelName.includes("2.1")) {
                        releaseDate = "2023-11-21";
                    } else if (modelName.includes("2.0")) {
                        releaseDate = "2023-07-11";
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
                        provider: "Anthropic",
                        providerDoc: "https://docs.anthropic.com/en/docs/about-claude/models",
                        // Provider metadata
                        providerEnv: ["ANTHROPIC_API_KEY"],
                        providerModelsDevId: "anthropic",
                        providerNpm: "@ai-sdk/anthropic",
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

    console.log(`[Anthropic] Extracted ${models.length} models from documentation`);

    return models;
};

/**
 * Fetches models from Anthropic documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchAnthropicModels(): Promise<Model[]> {
    console.log("[Anthropic] Fetching: https://docs.anthropic.com/en/docs/about-claude/models");

    const response = await axios.get("https://docs.anthropic.com/en/docs/about-claude/models");
    const htmlContent = response.data;

    const models = transformAnthropicModels(htmlContent);

    return models;
}

export { fetchAnthropicModels, transformAnthropicModels };
