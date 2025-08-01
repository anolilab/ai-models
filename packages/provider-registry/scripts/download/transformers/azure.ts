import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const AZURE_DOCS_URL = "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models";

/**
 * Transforms Azure OpenAI model data from their documentation into the normalized structure.
 * @param htmlContent The HTML content from the Azure OpenAI documentation
 * @returns Array of normalized model objects
 */
function transformAzureModels(htmlContent: string): Model[] {
    const $ = load(htmlContent);
    const models: Model[] = [];

    // Look for model tables in the documentation
    $("table").each((index, table) => {
        const tableText = $(table).text().toLowerCase();

        // Check if this table contains model information
        if (tableText.includes("model") || tableText.includes("gpt") || tableText.includes("claude") || tableText.includes("dall-e")) {
            console.log(`[Azure OpenAI] Found potential model table ${index + 1}`);

            $(table)
                .find("tbody tr")
                .each((_, row) => {
                    const cells = $(row)
                        .find("td")
                        .map((_, td) => $(td).text().trim())
                        .get();

                    if (cells.length >= 2 && cells[0] && !cells[0].includes("model") && !cells[0].includes("name")) {
                        const modelName = cells[0];

                        console.log(`[Azure OpenAI] Found model: ${modelName}`);

                        // Parse context length from the table
                        const contextLength = parseContextLength(cells[1] || cells[2] || "");

                        const model: Model = {
                            attachment: false,
                            cost: {
                                input: null,
                                inputCacheHit: null,
                                output: null,
                            },
                            extendedThinking: false,
                            id: kebabCase(modelName),
                            knowledge: null,
                            lastUpdated: null,
                            limit: {
                                context: contextLength,
                                output: null,
                            },
                            modalities: {
                                input: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("gpt-4v") ? ["text", "image"] : ["text"],
                                output: modelName.toLowerCase().includes("dall-e") ? ["image"] : ["text"],
                            },
                            name: modelName,
                            openWeights: false,
                            provider: "Azure OpenAI",
                            providerDoc: AZURE_DOCS_URL,
                            // Provider metadata
                            providerEnv: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"],
                            providerModelsDevId: "azure-openai",
                            providerNpm: "@ai-sdk/azure-openai",
                            reasoning: false,
                            releaseDate: null,
                            streamingSupported: true,
                            temperature: true,
                            toolCall: modelName.toLowerCase().includes("gpt-4") || modelName.toLowerCase().includes("claude"),
                            vision: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("gpt-4v"),
                        };

                        models.push(model);
                    }
                });
        }
    });

    // If no tables found, try to extract from text content
    if (models.length === 0) {
        const bodyText = $("body").text();
        const modelMatches = bodyText.match(/([\w\-]+(?:gpt|claude|dall-e|whisper)[\w\-]*)/gi);

        if (modelMatches) {
            console.log(`[Azure OpenAI] Found ${modelMatches.length} potential models in text`);

            for (const match of modelMatches.slice(0, 20)) {
                // Limit to first 20 matches
                const modelName = match.trim();

                if (modelName.length > 3 && modelName.length < 50) {
                    const model: Model = {
                        attachment: false,
                        cost: {
                            input: null,
                            inputCacheHit: null,
                            output: null,
                        },
                        extendedThinking: false,
                        id: kebabCase(modelName),
                        knowledge: null,
                        lastUpdated: null,
                        limit: {
                            context: null,
                            output: null,
                        },
                        modalities: {
                            input: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("gpt-4v") ? ["text", "image"] : ["text"],
                            output: modelName.toLowerCase().includes("dall-e") ? ["image"] : ["text"],
                        },
                        name: modelName,
                        openWeights: false,
                        provider: "Azure OpenAI",
                        providerDoc: AZURE_DOCS_URL,
                        // Provider metadata
                        providerEnv: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"],
                        providerModelsDevId: "azure-openai",
                        providerNpm: "@ai-sdk/azure-openai",
                        reasoning: false,
                        releaseDate: null,
                        streamingSupported: true,
                        temperature: true,
                        toolCall: modelName.toLowerCase().includes("gpt-4") || modelName.toLowerCase().includes("claude"),
                        vision: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("gpt-4v"),
                    };

                    models.push(model);
                }
            }
        }
    }

    return models;
}

/**
 * Parse context length from string (e.g., "32k" -> 32768)
 */
function parseContextLength(lengthString: string): number | null {
    if (!lengthString)
        return null;

    const match = lengthString.toLowerCase().match(/(\d+)([km])?/);

    if (!match)
        return null;

    const value = Number.parseInt(match[1], 10);
    const unit = match[2];

    if (unit === "k")
        return value * 1024;

    if (unit === "m")
        return value * 1024 * 1024;

    return value;
}

/**
 * Fetches models from Azure OpenAI documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchAzureModels(): Promise<Model[]> {
    console.log("[Azure OpenAI] Fetching:", AZURE_DOCS_URL);

    try {
        const response = await axios.get(AZURE_DOCS_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
            },
            timeout: 10_000,
        });
        const htmlContent = response.data;

        const models = transformAzureModels(htmlContent);

        console.log(`[Azure OpenAI] Found ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Azure OpenAI] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

export { fetchAzureModels, transformAzureModels };
