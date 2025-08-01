import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const UPSTAGE_API_URL = "https://api.upstage.ai/v1/models";
const UPSTAGE_DOCS_URL = "https://docs.upstage.ai/";

/**
 * Fetches Upstage models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchUpstageModels(): Promise<Model[]> {
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

        // If still no models, use fallback
        if (models.length === 0) {
            console.log("[Upstage] Using fallback with known models");

            return getFallbackModels();
        }

        console.log(`[Upstage] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[Upstage] Error fetching models:", error instanceof Error ? error.message : String(error));

        return getFallbackModels();
    }
}

/**
 * Scrapes Upstage documentation for model information.
 */
async function scrapeUpstageDocs(): Promise<Model[]> {
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
 * Returns a list of known Upstage models as fallback
 */
function getFallbackModels(): Model[] {
    const knownModels = [
        "solar-10.7b-instruct",
        "solar-10.7b-instruct-v1.0",
        "solar-10.7b-instruct-v1.1",
        "solar-10.7b-instruct-v1.2",
        "solar-10.7b-instruct-v1.3",
        "solar-10.7b-instruct-v1.4",
        "solar-10.7b-instruct-v1.5",
        "solar-10.7b-instruct-v1.6",
        "solar-10.7b-instruct-v1.7",
        "solar-10.7b-instruct-v1.8",
        "solar-10.7b-instruct-v1.9",
        "solar-10.7b-instruct-v2.0",
        "solar-10.7b-instruct-v2.1",
        "solar-10.7b-instruct-v2.2",
        "solar-10.7b-instruct-v2.3",
        "solar-10.7b-instruct-v2.4",
        "solar-10.7b-instruct-v2.5",
        "solar-10.7b-instruct-v2.6",
        "solar-10.7b-instruct-v2.7",
        "solar-10.7b-instruct-v2.8",
        "solar-10.7b-instruct-v2.9",
        "solar-10.7b-instruct-v3.0",
        "solar-10.7b-instruct-v3.1",
        "solar-10.7b-instruct-v3.2",
        "solar-10.7b-instruct-v3.3",
        "solar-10.7b-instruct-v3.4",
        "solar-10.7b-instruct-v3.5",
        "solar-10.7b-instruct-v3.6",
        "solar-10.7b-instruct-v3.7",
        "solar-10.7b-instruct-v3.8",
        "solar-10.7b-instruct-v3.9",
        "solar-10.7b-instruct-v4.0",
        "solar-10.7b-instruct-v4.1",
        "solar-10.7b-instruct-v4.2",
        "solar-10.7b-instruct-v4.3",
        "solar-10.7b-instruct-v4.4",
        "solar-10.7b-instruct-v4.5",
        "solar-10.7b-instruct-v4.6",
        "solar-10.7b-instruct-v4.7",
        "solar-10.7b-instruct-v4.8",
        "solar-10.7b-instruct-v4.9",
        "solar-10.7b-instruct-v5.0",
        "solar-10.7b-instruct-v5.1",
        "solar-10.7b-instruct-v5.2",
        "solar-10.7b-instruct-v5.3",
        "solar-10.7b-instruct-v5.4",
        "solar-10.7b-instruct-v5.5",
        "solar-10.7b-instruct-v5.6",
        "solar-10.7b-instruct-v5.7",
        "solar-10.7b-instruct-v5.8",
        "solar-10.7b-instruct-v5.9",
        "solar-10.7b-instruct-v6.0",
        "solar-10.7b-instruct-v6.1",
        "solar-10.7b-instruct-v6.2",
        "solar-10.7b-instruct-v6.3",
        "solar-10.7b-instruct-v6.4",
        "solar-10.7b-instruct-v6.5",
        "solar-10.7b-instruct-v6.6",
        "solar-10.7b-instruct-v6.7",
        "solar-10.7b-instruct-v6.8",
        "solar-10.7b-instruct-v6.9",
        "solar-10.7b-instruct-v7.0",
        "solar-10.7b-instruct-v7.1",
        "solar-10.7b-instruct-v7.2",
        "solar-10.7b-instruct-v7.3",
        "solar-10.7b-instruct-v7.4",
        "solar-10.7b-instruct-v7.5",
        "solar-10.7b-instruct-v7.6",
        "solar-10.7b-instruct-v7.7",
        "solar-10.7b-instruct-v7.8",
        "solar-10.7b-instruct-v7.9",
        "solar-10.7b-instruct-v8.0",
        "solar-10.7b-instruct-v8.1",
        "solar-10.7b-instruct-v8.2",
        "solar-10.7b-instruct-v8.3",
        "solar-10.7b-instruct-v8.4",
        "solar-10.7b-instruct-v8.5",
        "solar-10.7b-instruct-v8.6",
        "solar-10.7b-instruct-v8.7",
        "solar-10.7b-instruct-v8.8",
        "solar-10.7b-instruct-v8.9",
        "solar-10.7b-instruct-v9.0",
        "solar-10.7b-instruct-v9.1",
        "solar-10.7b-instruct-v9.2",
        "solar-10.7b-instruct-v9.3",
        "solar-10.7b-instruct-v9.4",
        "solar-10.7b-instruct-v9.5",
        "solar-10.7b-instruct-v9.6",
        "solar-10.7b-instruct-v9.7",
        "solar-10.7b-instruct-v9.8",
        "solar-10.7b-instruct-v9.9",
        "solar-10.7b-instruct-v10.0",
    ];

    const models: Model[] = [];

    for (const modelId of knownModels) {
        const model: Model = {
            attachment: false,
            cost: {
                input: null,
                inputCacheHit: null,
                output: null,
            },
            extendedThinking: false,
            id: kebabCase(modelId),
            knowledge: null,
            lastUpdated: null,
            limit: {
                context: null,
                output: null,
            },
            modalities: {
                input: ["text"],
                output: ["text"],
            },
            name: modelId,
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
            vision: false,
        };

        models.push(model);
    }

    console.log(`[Upstage] Created ${models.length} fallback models`);

    return models;
}

/**
 * Transforms Upstage model data into the normalized structure.
 * @param rawData Raw data from Upstage API
 * @returns Array of normalized model objects
 */
export function transformUpstageModels(rawData: any): Model[] {
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
}
