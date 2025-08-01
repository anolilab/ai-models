import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const INFERENCE_API_URL = "https://inference.net/api/models";
const INFERENCE_DOCS_URL = "https://inference.net/models";

/**
 * Fetches Inference models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchInferenceModels(): Promise<Model[]> {
    console.log("[Inference] Fetching models from API and documentation...");

    try {
        const models: Model[] = [];

        // Try to fetch from their API first
        try {
            console.log("[Inference] Attempting to fetch from API:", INFERENCE_API_URL);
            const apiResponse = await axios.get(INFERENCE_API_URL);

            if (apiResponse.data && Array.isArray(apiResponse.data)) {
                console.log(`[Inference] Found ${apiResponse.data.length} models via API`);

                for (const modelData of apiResponse.data) {
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
                        provider: "Inference",
                        providerDoc: INFERENCE_DOCS_URL,
                        // Provider metadata
                        providerEnv: ["INFERENCE_API_KEY"],
                        providerModelsDevId: "inference",
                        providerNpm: "@ai-sdk/openai-compatible",
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
        } catch {
            console.log("[Inference] API fetch failed, falling back to documentation scraping");
        }

        // If API didn't work or returned no models, try scraping documentation
        if (models.length === 0) {
            console.log("[Inference] Scraping documentation for model information");
            const docsModels = await scrapeInferenceDocs();

            models.push(...docsModels);
        }

        console.log(`[Inference] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[Inference] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

/**
 * Scrapes Inference documentation for model information.
 */
async function scrapeInferenceDocs(): Promise<Model[]> {
    try {
        const response = await axios.get(INFERENCE_DOCS_URL);
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for model tables or lists in the documentation
        $("table, .model-list, .models-table").each((index, element) => {
            const tableText = $(element).text().toLowerCase();

            // Check if this table contains model information
            if (tableText.includes("model") || tableText.includes("llama") || tableText.includes("mistral") || tableText.includes("gemma")) {
                console.log(`[Inference] Found potential model table ${index + 1}`);

                $(element)
                    .find("tr, .model-item")
                    .each((_, row) => {
                        const cells = $(row)
                            .find("td, .model-cell")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        if (cells.length >= 2 && cells[0] && !cells[0].includes("model")) {
                            const modelName = cells[0];

                            console.log(`[Inference] Found model: ${modelName}`);

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
                                openWeights: false,
                                provider: "Inference",
                                providerDoc: INFERENCE_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["INFERENCE_API_KEY"],
                                providerModelsDevId: "inference",
                                providerNpm: "@ai-sdk/openai-compatible",
                                reasoning: false,
                                releaseDate: null,
                                streamingSupported: true,
                                temperature: true,
                                toolCall: false,
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
            const modelMatches = bodyText.match(/([\w\-]+(?:llama|mistral|gemma|vision)[\w\-]*)/gi);

            if (modelMatches) {
                console.log(`[Inference] Found ${modelMatches.length} potential models in text`);

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
                                input: modelName.toLowerCase().includes("vision") ? ["text", "image"] : ["text"],
                                output: ["text"],
                            },
                            name: modelName,
                            openWeights: false,
                            provider: "Inference",
                            providerDoc: INFERENCE_DOCS_URL,
                            // Provider metadata
                            providerEnv: ["INFERENCE_API_KEY"],
                            providerModelsDevId: "inference",
                            providerNpm: "@ai-sdk/openai-compatible",
                            reasoning: false,
                            releaseDate: null,
                            streamingSupported: true,
                            temperature: true,
                            toolCall: false,
                            vision: modelName.toLowerCase().includes("vision"),
                        };

                        models.push(model);
                    }
                }
            }
        }

        console.log(`[Inference] Scraped ${models.length} models from documentation`);

        return models;
    } catch (error) {
        console.error("[Inference] Error scraping documentation:", error instanceof Error ? error.message : String(error));

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
 * Transforms Inference model data into the normalized structure.
 * @param rawData Raw data from Inference API
 * @returns Array of normalized model objects
 */
export function transformInferenceModels(rawData: any): Model[] {
    const models: Model[] = [];

    // This function is kept for interface compatibility but the main logic is in fetchInferenceModels
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
                provider: "Inference",
                providerDoc: INFERENCE_DOCS_URL,
                // Provider metadata
                providerEnv: ["INFERENCE_API_KEY"],
                providerModelsDevId: "inference",
                providerNpm: "@ai-sdk/openai-compatible",
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
}
