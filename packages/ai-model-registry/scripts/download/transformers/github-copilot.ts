import { kebabCase, snakeCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

/**
 * Raw model information extracted from table
 */
interface ModelInfo {
    [key: string]: string;
}

/**
 * Transforms GitHub Copilot model data from their documentation page into the normalized structure.
 * @param htmlContent The HTML content from the GitHub Copilot models page
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

const transformGitHubCopilotModels = (htmlContent: string): Model[] => {
    const $ = load(htmlContent);
    const models: Model[] = [];

    // Find the models table
    $("table").each((tableIndex, table) => {
        const tableText = $(table).text();

        // Look for the table that contains model information
        if (tableText.includes("Model") && (tableText.includes("Context") || tableText.includes("Tokens"))) {
            console.log(`[GitHub Copilot] Found models table ${tableIndex + 1}`);

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

                    console.log(`[GitHub Copilot] Processing model: ${modelName}`);

                    // Determine model capabilities based on name
                    const isVision = modelName.toLowerCase().includes("vision");
                    const isSonnet = modelName.toLowerCase().includes("sonnet");
                    const isOpus = modelName.toLowerCase().includes("opus");
                    const isHaiku = modelName.toLowerCase().includes("haiku");

                    // Determine reasoning capability (Opus and Sonnet have extended thinking)
                    const hasExtendedThinking = isOpus || isSonnet;

                    // Determine tool calling capability
                    const hasToolCall = isOpus || isSonnet || isHaiku;

                    // Determine temperature support
                    const hasTemperature = true; // All GitHub Copilot models support temperature

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
                        provider: "GitHub Copilot",
                        providerDoc: "https://docs.github.com/en/copilot/reference/ai-models/supported-models",
                        // Provider metadata
                        providerEnv: ["GITHUB_TOKEN"],
                        providerModelsDevId: "github-copilot",
                        providerNpm: "@ai-sdk/github-copilot",
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

    console.log(`[GitHub Copilot] Extracted ${models.length} models from documentation`);

    return models;
};

/**
 * Fetches models from GitHub Copilot documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchGitHubCopilotModels(): Promise<Model[]> {
    console.log("[GitHub Copilot] Fetching: https://docs.github.com/en/copilot/reference/ai-models/supported-models");

    try {
        const response = await axios.get("https://docs.github.com/en/copilot/reference/ai-models/supported-models");
        const htmlContent = response.data;

        const models = transformGitHubCopilotModels(htmlContent);

        return models;
    } catch (error) {
        console.error("[GitHub Copilot] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

export { fetchGitHubCopilotModels, transformGitHubCopilotModels };
