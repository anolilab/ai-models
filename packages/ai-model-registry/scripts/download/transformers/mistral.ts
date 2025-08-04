import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";
import { parseContextLength } from "../utils/index.js";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/models";
const MISTRAL_DOCS_URL = "https://docs.mistral.ai/getting-started/models/";

/**
 * Scrapes Mistral documentation for model information.
 */
const scrapeMistralDocs = async (): Promise<Model[]> => {
    try {
        const response = await axios.get(MISTRAL_DOCS_URL);
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for model tables or lists in the documentation
        $("table, .model-list, .models-table").each((index, element) => {
            const tableText = $(element).text().toLowerCase();

            // Check if this table contains model information
            if (tableText.includes("model") || tableText.includes("mistral") || tableText.includes("large") || tableText.includes("medium")) {
                console.log(`[Mistral] Found potential model table ${index + 1}`);

                $(element)
                    .find("tr, .model-item")
                    .each((_, row) => {
                        const cells = $(row)
                            .find("td, .model-cell")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        if (cells.length >= 2 && cells[0] && !cells[0].includes("model")) {
                            const modelName = cells[0];

                            console.log(`[Mistral] Found model: ${modelName}`);

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
                                    input:
                                        modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("large") ? ["text", "image"] : ["text"],
                                    output: ["text"],
                                },
                                name: modelName,
                                openWeights: false,
                                provider: "Mistral",
                                providerDoc: MISTRAL_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["MISTRAL_API_KEY"],
                                providerModelsDevId: "mistral",
                                providerNpm: "@ai-sdk/mistral",
                                reasoning: false,
                                releaseDate: null,
                                streamingSupported: true,
                                temperature: true,
                                toolCall: modelName.toLowerCase().includes("large") || modelName.toLowerCase().includes("medium"),
                                vision: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("large"),
                            };

                            models.push(model);
                        }
                    });
            }
        });

        // If no tables found, try to extract from text content
        if (models.length === 0) {
            const bodyText = $("body").text();
            const modelMatches = bodyText.match(/([\w\-]+(?:mistral|large|medium|small)[\w\-]*)/gi);

            if (modelMatches) {
                console.log(`[Mistral] Found ${modelMatches.length} potential models in text`);

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
                                input: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("large") ? ["text", "image"] : ["text"],
                                output: ["text"],
                            },
                            name: modelName,
                            openWeights: false,
                            provider: "Mistral",
                            providerDoc: MISTRAL_DOCS_URL,
                            // Provider metadata
                            providerEnv: ["MISTRAL_API_KEY"],
                            providerModelsDevId: "mistral",
                            providerNpm: "@ai-sdk/mistral",
                            reasoning: false,
                            releaseDate: null,
                            streamingSupported: true,
                            temperature: true,
                            toolCall: modelName.toLowerCase().includes("large") || modelName.toLowerCase().includes("medium"),
                            vision: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("large"),
                        };

                        models.push(model);
                    }
                }
            }
        }

        console.log(`[Mistral] Scraped ${models.length} models from documentation`);

        return models;
    } catch (error) {
        console.error("[Mistral] Error scraping documentation:", error instanceof Error ? error.message : String(error));

        return [];
    }
};

/**
 * Transforms Mistral model data into the normalized structure.
 * @param rawData Raw data from Mistral API
 * @returns Array of normalized model objects
 */
export const transformMistralModels = (rawData: any): Model[] => {
    const models: Model[] = [];

    // This function is kept for interface compatibility but the main logic is in fetchMistralModels
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
                provider: "Mistral",
                providerDoc: MISTRAL_DOCS_URL,
                // Provider metadata
                providerEnv: ["MISTRAL_API_KEY"],
                providerModelsDevId: "mistral",
                providerNpm: "@ai-sdk/mistral",
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
};

/**
 * Fetches Mistral models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchMistralModels = async (): Promise<Model[]> => {
    console.log("[Mistral] Fetching models from API and documentation...");

    try {
        const models: Model[] = [];

        // Try to fetch from their API first
        try {
            console.log("[Mistral] Attempting to fetch from API:", MISTRAL_API_URL);
            const apiResponse = await axios.get(MISTRAL_API_URL);

            if (apiResponse.data && Array.isArray(apiResponse.data.data)) {
                console.log(`[Mistral] Found ${apiResponse.data.data.length} models via API`);

                for (const modelData of apiResponse.data.data) {
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
                        provider: "Mistral",
                        providerDoc: MISTRAL_DOCS_URL,
                        // Provider metadata
                        providerEnv: ["MISTRAL_API_KEY"],
                        providerModelsDevId: "mistral",
                        providerNpm: "@ai-sdk/mistral",
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
            console.log("[Mistral] API fetch failed, falling back to documentation scraping");
        }

        // If API didn't work or returned no models, try scraping documentation
        if (models.length === 0) {
            console.log("[Mistral] Scraping documentation for model information");
            const docsModels = await scrapeMistralDocs();

            models.push(...docsModels);
        }

        console.log(`[Mistral] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[Mistral] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
