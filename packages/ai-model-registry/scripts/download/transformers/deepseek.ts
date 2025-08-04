import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

/**
 * Transforms DeepSeek model data from their pricing documentation page into the normalized structure.
 * @param htmlContent The HTML content from the DeepSeek pricing page
 * @returns Array of normalized model objects
 */
import { parsePrice, parseTokenLimit } from "../utils/index.js";

export const transformDeepSeekModels = (htmlContent: string): Model[] => {
    const $ = load(htmlContent);
    const models: Model[] = [];

    // Find the pricing table
    $("table").each((tableIndex, table) => {
        const tableText = $(table).text();

        // Look for the table that contains model information
        if (tableText.includes("deepseek-chat") && tableText.includes("deepseek-reasoner")) {
            const rows = $(table).find("tr");
            const modelNames: string[] = [];
            const contextLengths: string[] = [];
            const maxOutputs: string[] = [];
            const standardPrices: { input: string[]; output: string[] } = { input: [], output: [] };
            const discountPrices: { input: string[]; output: string[] } = { input: [], output: [] };

            rows.each((rowIndex, row) => {
                const cells = $(row)
                    .find("td")
                    .map((_, td) => $(td).text().trim())
                    .get();

                if (cells.length === 0)
                    return;

                // Extract model names from first row
                if (rowIndex === 0 && cells.length >= 3) {
                    // The first row has colspan="2" for the first cell, so we need to handle this
                    // The structure is: [colspan="2" cell, deepseek-chat, deepseek-reasoner]
                    if (cells.length >= 3) {
                        modelNames.push(cells[1], cells[2]); // deepseek-chat, deepseek-reasoner
                    }
                }
                // Extract context lengths
                else if (cells[0]?.includes("CONTEXT LENGTH") && cells.length >= 3) {
                    contextLengths.push(cells[1], cells[2]);
                }
                // Extract max output
                else if (cells[0]?.includes("MAX OUTPUT") && cells.length >= 3) {
                    maxOutputs.push(cells[1], cells[2]);
                }
                // Extract standard prices
                else if (cells[0]?.includes("STANDARD PRICE") && cells.length >= 3) {
                    // Input cache hit prices
                    if (cells[1]?.includes("INPUT (CACHE HIT)")) {
                        standardPrices.input.push(cells[2], cells[3]);
                    }
                    // Input cache miss prices
                    else if (cells[1]?.includes("INPUT (CACHE MISS)")) {
                        // Skip cache miss for now, use cache hit prices
                    }
                    // Output prices
                    else if (cells[1]?.includes("OUTPUT")) {
                        standardPrices.output.push(cells[2], cells[3]);
                    }
                }
                // Extract output prices (they appear in a separate row)
                else if (cells[0]?.includes("OUTPUT") && cells.length >= 3) {
                    // Check if this is a discount price row by looking for "OFF" in the price
                    const isDiscountPrice = cells[1]?.includes("OFF") || cells[2]?.includes("OFF");

                    if (isDiscountPrice) {
                        discountPrices.output.push(cells[1], cells[2]);
                    } else {
                        standardPrices.output.push(cells[1], cells[2]);
                    }
                }
                // Extract discount prices
                else if (cells[0]?.includes("DISCOUNT PRICE") && cells.length >= 3) {
                    // Input cache hit prices
                    if (cells[1]?.includes("INPUT (CACHE HIT)")) {
                        discountPrices.input.push(cells[2], cells[3]);
                    }
                    // Output prices
                    else if (cells[1]?.includes("OUTPUT")) {
                        discountPrices.output.push(cells[2], cells[3]);
                    }
                }
                // Extract discount output prices (they appear in a separate row)
                else if (cells[0]?.includes("OUTPUT") && cells.length >= 3 && cells[1]?.includes("OFF")) {
                    discountPrices.output.push(cells[1], cells[2]);
                }
            });

            // Create models from extracted data
            modelNames.forEach((modelName, index) => {
                if (!modelName || modelName === "N/A") {
                    return;
                }

                console.log(`[DeepSeek] Processing model: ${modelName}`);

                // Determine actual model name based on API name
                let actualModelName = modelName;
                let releaseDate = null;

                if (modelName === "deepseek-chat") {
                    actualModelName = "DeepSeek-V3-0324";
                    releaseDate = "2024-03-24";
                } else if (modelName === "deepseek-reasoner") {
                    actualModelName = "DeepSeek-R1-0528";
                    releaseDate = "2024-05-28";
                }

                // Determine model capabilities
                const isR1 = actualModelName.includes("R1");
                const isV3 = actualModelName.includes("V3");

                // Determine reasoning capability (R1 models have extended thinking)
                const hasExtendedThinking = isR1;

                // Determine tool calling capability
                const hasToolCall = isR1 || isV3;

                // Determine temperature support
                const hasTemperature = isV3; // V3 models support temperature

                // Determine knowledge cutoff
                let knowledgeCutoff = null;

                if (actualModelName.includes("2024")) {
                    knowledgeCutoff = "2024";
                } else if (actualModelName.includes("2023")) {
                    knowledgeCutoff = "2023";
                }

                // Get pricing data
                const inputPrice = standardPrices.input[index] ? parsePrice(standardPrices.input[index]) : null;
                const outputPrice = standardPrices.output[index] ? parsePrice(standardPrices.output[index]) : null;

                // Get context and output limits
                const contextLength = contextLengths[index] ? parseTokenLimit(contextLengths[index]) : null;
                const maxOutput = maxOutputs[index] ? parseTokenLimit(maxOutputs[index]) : null;

                const model: Model = {
                    attachment: false,
                    cost: {
                        input: inputPrice,
                        inputCacheHit: inputPrice, // Use same price for cache hit
                        output: outputPrice,
                    },
                    extendedThinking: hasExtendedThinking,
                    id: kebabCase(actualModelName),
                    knowledge: knowledgeCutoff,
                    lastUpdated: null,
                    limit: {
                        context: contextLength,
                        output: maxOutput,
                    },
                    modalities: {
                        input: ["text"],
                        output: ["text"],
                    },
                    name: actualModelName,
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
                    vision: false,
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
export const fetchDeepSeekModels = async (): Promise<Model[]> => {
    console.log("[DeepSeek] Fetching: https://api-docs.deepseek.com/quick_start/pricing");

    const response = await axios.get("https://api-docs.deepseek.com/quick_start/pricing");
    const htmlContent = response.data;

    const models = transformDeepSeekModels(htmlContent);

    // If no models were found, this might indicate a parsing failure
    if (models.length === 0) {
        throw new Error("No models found in DeepSeek documentation - this may indicate a parsing failure or API change");
    }

    return models;
};
