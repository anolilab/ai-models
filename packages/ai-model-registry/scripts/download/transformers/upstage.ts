import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const UPSTAGE_API_URL = "https://api.upstage.ai/v1/models";
const UPSTAGE_DOCS_URL = "https://docs.upstage.ai/";

/**
 * Scrapes Upstage documentation for model information.
 */
const scrapeUpstageDocs = async (): Promise<Model[]> => {
    try {
        const response = await axios.get(UPSTAGE_DOCS_URL, { timeout: 10_000 });
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for model tables or lists in the documentation
        $("table, .model-list, .models-table").each((index, element) => {
            const tableText = $(element).text().toLowerCase();

            // Check if this table contains model information
            if (tableText.includes("model") || tableText.includes("upstage") || tableText.includes("solar") || tableText.includes("llama")) {
                console.log(`[Upstage] Found potential model table ${index + 1}`);

                $(element)
                    .find("tr, .model-item")
                    .each((_, row) => {
                        const cells = $(row)
                            .find("td, .model-cell")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        if (cells.length >= 2 && cells[0] && !cells[0].includes("model")) {
                            const modelName = cells[0];

                            console.log(`[Upstage] Found model: ${modelName}`);

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
                                provider: "Upstage",
                                providerDoc: UPSTAGE_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["UPSTAGE_API_KEY"],
                                providerModelsDevId: "upstage",
                                providerNpm: "@ai-sdk/upstage",
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
            const modelMatches = bodyText.match(/([\w\-]+(?:upstage|solar|llama|mistral)[\w\-]*)/gi);

            if (modelMatches) {
                console.log(`[Upstage] Found ${modelMatches.length} potential models in text`);

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
                            provider: "Upstage",
                            providerDoc: UPSTAGE_DOCS_URL,
                            // Provider metadata
                            providerEnv: ["UPSTAGE_API_KEY"],
                            providerModelsDevId: "upstage",
                            providerNpm: "@ai-sdk/upstage",
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

        console.log(`[Upstage] Scraped ${models.length} models from documentation`);

        return models;
    } catch (error) {
        console.error("[Upstage] Error scraping documentation:", error instanceof Error ? error.message : String(error));

        return [];
    }
};

/**
 * Parse context length from string (e.g., "32k" -> 32768)
 */
const parseContextLength = (lengthString: string): number | null => {
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
};

/**
 * Transforms Upstage model data into the normalized structure.
 * @param rawData Raw data from Upstage API
 * @returns Array of normalized model objects
 */
export const transformUpstageModels = (rawData: any): Model[] => {
    const models: Model[] = [];

    // This function is kept for interface compatibility but the main logic is in fetchUpstageModels
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
                provider: "Upstage",
                providerDoc: UPSTAGE_DOCS_URL,
                // Provider metadata
                providerEnv: ["UPSTAGE_API_KEY"],
                providerModelsDevId: "upstage",
                providerNpm: "@ai-sdk/upstage",
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

/**
 * Fetches Upstage models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchUpstageModels = async (): Promise<Model[]> => {
    console.log("[Upstage] Fetching models from API and documentation...");

    try {
        const models: Model[] = [];

        // Try to fetch from their API first
        try {
            console.log("[Upstage] Attempting to fetch from API:", UPSTAGE_API_URL);
            const apiResponse = await axios.get(UPSTAGE_API_URL, {
                headers: {
                    Accept: "application/json",
                    "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
                },
                timeout: 10_000,
            });

            if (apiResponse.data && Array.isArray(apiResponse.data)) {
                console.log(`[Upstage] Found ${apiResponse.data.length} models via API`);

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
                        provider: "Upstage",
                        providerDoc: UPSTAGE_DOCS_URL,
                        // Provider metadata
                        providerEnv: ["UPSTAGE_API_KEY"],
                        providerModelsDevId: "upstage",
                        providerNpm: "@ai-sdk/upstage",
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
            console.log("[Upstage] API fetch failed, falling back to documentation scraping");
        }

        // If API didn't work or returned no models, try scraping documentation
        if (models.length === 0) {
            console.log("[Upstage] Scraping documentation for model information");
            const docsModels = await scrapeUpstageDocs();

            if (docsModels.length > 0) {
                models.push(...docsModels);
            }
        }

        console.log(`[Upstage] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[Upstage] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
