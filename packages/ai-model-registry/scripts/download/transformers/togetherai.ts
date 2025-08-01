import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const TOGETHER_AI_API_URL = "https://api.together.ai/v1/models";
const TOGETHER_AI_DOCS_URL = "https://docs.together.ai/";

/**
 * Fetches Together AI models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchTogetherAIModels(): Promise<Model[]> {
    console.log("[Together AI] Fetching models from API and documentation...");

    try {
        const models: Model[] = [];

        // Try to fetch from their API first
        try {
            console.log("[Together AI] Attempting to fetch from API:", TOGETHER_AI_API_URL);
            const apiResponse = await axios.get(TOGETHER_AI_API_URL);

            if (apiResponse.data && Array.isArray(apiResponse.data.data)) {
                console.log(`[Together AI] Found ${apiResponse.data.data.length} models via API`);

                for (const modelData of apiResponse.data.data) {
                    const model: Model = {
                        attachment: false,
                        cost: {
                            input: modelData.pricing?.input || null,
                            inputCacheHit: null,
                            output: modelData.pricing?.output || null,
                        },
                        extendedThinking: false,
                        id: kebabCase(modelData.id || modelData.name),
                        knowledge: null,
                        lastUpdated: null,
                        limit: {
                            context: modelData.context_length || null,
                            output: modelData.max_output || null,
                        },
                        modalities: {
                            input: modelData.capabilities?.vision ? ["text", "image"] : ["text"],
                            output: ["text"],
                        },
                        name: modelData.name || modelData.id,
                        openWeights: modelData.open_weights || false,
                        provider: "Together AI",
                        providerDoc: TOGETHER_AI_DOCS_URL,
                        // Provider metadata
                        providerEnv: ["TOGETHER_API_KEY"],
                        providerModelsDevId: "together-ai",
                        providerNpm: "@ai-sdk/together",
                        reasoning: false,
                        releaseDate: null,
                        streamingSupported: true,
                        temperature: true,
                        toolCall: modelData.capabilities?.tool_use || false,
                        vision: modelData.capabilities?.vision || false,
                    };

                    models.push(model);
                }
            }
        } catch {
            console.log("[Together AI] API fetch failed, falling back to documentation scraping");
        }

        // If API didn't work or returned no models, try scraping documentation
        if (models.length === 0) {
            console.log("[Together AI] Scraping documentation for model information");
            const docsModels = await scrapeTogetherAIDocs();

            models.push(...docsModels);
        }

        console.log(`[Together AI] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[Together AI] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

/**
 * Scrapes Together AI documentation for model information.
 */
async function scrapeTogetherAIDocs(): Promise<Model[]> {
    try {
        const response = await axios.get(TOGETHER_AI_DOCS_URL);
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for model tables or lists in the documentation
        $("table, .model-list, .models-table").each((index, element) => {
            const tableText = $(element).text().toLowerCase();

            // Check if this table contains model information
            if (tableText.includes("model") || tableText.includes("together") || tableText.includes("llama") || tableText.includes("mistral")) {
                console.log(`[Together AI] Found potential model table ${index + 1}`);

                $(element)
                    .find("tr, .model-item")
                    .each((_, row) => {
                        const cells = $(row)
                            .find("td, .model-cell")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        if (cells.length >= 2 && cells[0] && !cells[0].includes("model")) {
                            const modelName = cells[0];

                            console.log(`[Together AI] Found model: ${modelName}`);

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
                                    context: parseContextLength(cells[1] || cells[2]),
                                    output: null,
                                },
                                modalities: {
                                    input: modelName.toLowerCase().includes("vision") ? ["text", "image"] : ["text"],
                                    output: ["text"],
                                },
                                name: modelName,
                                openWeights: modelName.toLowerCase().includes("llama") || modelName.toLowerCase().includes("mistral"),
                                provider: "Together AI",
                                providerDoc: TOGETHER_AI_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["TOGETHER_API_KEY"],
                                providerModelsDevId: "together-ai",
                                providerNpm: "@ai-sdk/together",
                                reasoning: false,
                                releaseDate: null,
                                streamingSupported: true,
                                temperature: true,
                                toolCall: modelName.toLowerCase().includes("large") || modelName.toLowerCase().includes("medium"),
                                vision: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("vl"),
                            };

                            models.push(model);
                        }
                    });
            }
        });

        // If no tables found, try to extract from text content
        if (models.length === 0) {
            const bodyText = $("body").text();
            const modelMatches = bodyText.match(/([\w\-]+(?:together|llama|mistral|gemma|qwen)[\w\-]*)/gi);

            if (modelMatches) {
                console.log(`[Together AI] Found ${modelMatches.length} potential models in text`);

                for (const match of modelMatches.slice(0, 30)) {
                    // Limit to first 30 matches
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
                                input: modelName.toLowerCase().includes("vision") ? ["text", "image"] : ["text"],
                                output: ["text"],
                            },
                            name: modelName,
                            openWeights: modelName.toLowerCase().includes("llama") || modelName.toLowerCase().includes("mistral"),
                            provider: "Together AI",
                            providerDoc: TOGETHER_AI_DOCS_URL,
                            // Provider metadata
                            providerEnv: ["TOGETHER_API_KEY"],
                            providerModelsDevId: "together-ai",
                            providerNpm: "@ai-sdk/together",
                            reasoning: false,
                            releaseDate: null,
                            streamingSupported: true,
                            temperature: true,
                            toolCall: modelName.toLowerCase().includes("large") || modelName.toLowerCase().includes("medium"),
                            vision: modelName.toLowerCase().includes("vision"),
                        };

                        models.push(model);
                    }
                }
            }
        }

        console.log(`[Together AI] Scraped ${models.length} models from documentation`);

        return models;
    } catch (error) {
        console.error("[Together AI] Error scraping documentation:", error instanceof Error ? error.message : String(error));

        return [];
    }
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
 * Transforms Together AI model data into the normalized structure.
 * @param rawData Raw data from Together AI API
 * @returns Array of normalized model objects
 */
export function transformTogetherAIModels(rawData: any): Model[] {
    const models: Model[] = [];

    // This function is kept for interface compatibility but the main logic is in fetchTogetherAIModels
    if (Array.isArray(rawData)) {
        for (const modelData of rawData) {
            const model: Model = {
                attachment: false,
                cost: {
                    input: modelData.pricing?.input || null,
                    inputCacheHit: null,
                    output: modelData.pricing?.output || null,
                },
                extendedThinking: false,
                id: kebabCase(modelData.id || modelData.name),
                knowledge: null,
                lastUpdated: null,
                limit: {
                    context: modelData.context_length || null,
                    output: modelData.max_output || null,
                },
                modalities: {
                    input: modelData.capabilities?.vision ? ["text", "image"] : ["text"],
                    output: ["text"],
                },
                name: modelData.name || modelData.id,
                openWeights: modelData.open_weights || false,
                provider: "Together AI",
                providerDoc: TOGETHER_AI_DOCS_URL,
                // Provider metadata
                providerEnv: ["TOGETHER_API_KEY"],
                providerModelsDevId: "together-ai",
                providerNpm: "@ai-sdk/together",
                reasoning: false,
                releaseDate: null,
                streamingSupported: true,
                temperature: true,
                toolCall: modelData.capabilities?.tool_use || false,
                vision: modelData.capabilities?.vision || false,
            };

            models.push(model);
        }
    }

    return models;
}
