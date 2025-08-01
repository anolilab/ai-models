import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const GOOGLE_VERTEX_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GOOGLE_VERTEX_DOCS_URL = "https://cloud.google.com/vertex-ai/docs/generative-ai";

/**
 * Fetches Google Vertex models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchGoogleVertexModels(): Promise<Model[]> {
    console.log("[Google Vertex] Fetching models from API and documentation...");

    try {
        const models: Model[] = [];

        // Try to fetch from their API first
        try {
            console.log("[Google Vertex] Attempting to fetch from API:", GOOGLE_VERTEX_API_URL);
            const apiResponse = await axios.get(GOOGLE_VERTEX_API_URL);

            if (apiResponse.data && Array.isArray(apiResponse.data.models)) {
                console.log(`[Google Vertex] Found ${apiResponse.data.models.length} models via API`);

                for (const modelData of apiResponse.data.models) {
                    const model: Model = {
                        attachment: false,
                        cost: {
                            input: null,
                            inputCacheHit: null,
                            output: null,
                        },
                        extendedThinking: false,
                        id: kebabCase(modelData.name || modelData.displayName),
                        knowledge: null,
                        lastUpdated: null,
                        limit: {
                            context: modelData.inputTokenLimit || null,
                            output: modelData.outputTokenLimit || null,
                        },
                        modalities: {
                            input: modelData.supportedGenerationMethods?.includes("generate-content") ? ["text", "image"] : ["text"],
                            output: ["text"],
                        },
                        name: modelData.displayName || modelData.name,
                        openWeights: false,
                        provider: "Google Vertex",
                        providerDoc: GOOGLE_VERTEX_DOCS_URL,
                        // Provider metadata
                        providerEnv: ["GOOGLE_VERTEX_PROJECT", "GOOGLE_VERTEX_LOCATION", "GOOGLE_APPLICATION_CREDENTIALS"],
                        providerModelsDevId: "google-vertex",
                        providerNpm: "@ai-sdk/google-vertex",
                        reasoning: false,
                        releaseDate: null,
                        streamingSupported: true,
                        temperature: true,
                        toolCall: modelData.supportedGenerationMethods?.includes("tool-calls") || false,
                        vision: modelData.supportedGenerationMethods?.includes("generate-content") || false,
                    };

                    models.push(model);
                }
            }
        } catch {
            console.log("[Google Vertex] API fetch failed, falling back to documentation scraping");
        }

        // If API didn't work or returned no models, try scraping documentation
        if (models.length === 0) {
            console.log("[Google Vertex] Scraping documentation for model information");
            const docsModels = await scrapeGoogleVertexDocs();

            models.push(...docsModels);
        }

        console.log(`[Google Vertex] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[Google Vertex] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

/**
 * Scrapes Google Vertex documentation for model information.
 */
async function scrapeGoogleVertexDocs(): Promise<Model[]> {
    try {
        const response = await axios.get(GOOGLE_VERTEX_DOCS_URL);
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for model tables or lists in the documentation
        $("table, .model-list, .models-table").each((index, element) => {
            const tableText = $(element).text().toLowerCase();

            // Check if this table contains model information
            if (tableText.includes("model") || tableText.includes("gemini") || tableText.includes("palm") || tableText.includes("vertex")) {
                console.log(`[Google Vertex] Found potential model table ${index + 1}`);

                $(element)
                    .find("tr, .model-item")
                    .each((_, row) => {
                        const cells = $(row)
                            .find("td, .model-cell")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        if (cells.length >= 2 && cells[0] && !cells[0].includes("model")) {
                            const modelName = cells[0];

                            console.log(`[Google Vertex] Found model: ${modelName}`);

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
                                        modelName.toLowerCase().includes("vision")
                                        || modelName.toLowerCase().includes("pro")
                                        || modelName.toLowerCase().includes("ultra")
                                            ? ["text", "image"]
                                            : ["text"],
                                    output: ["text"],
                                },
                                name: modelName,
                                openWeights: false,
                                provider: "Google Vertex",
                                providerDoc: GOOGLE_VERTEX_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["GOOGLE_VERTEX_PROJECT", "GOOGLE_VERTEX_LOCATION", "GOOGLE_APPLICATION_CREDENTIALS"],
                                providerModelsDevId: "google-vertex",
                                providerNpm: "@ai-sdk/google-vertex",
                                reasoning: false,
                                releaseDate: null,
                                streamingSupported: true,
                                temperature: true,
                                toolCall: modelName.toLowerCase().includes("pro") || modelName.toLowerCase().includes("ultra"),
                                vision:
                                    modelName.toLowerCase().includes("vision")
                                    || modelName.toLowerCase().includes("pro")
                                    || modelName.toLowerCase().includes("ultra"),
                            };

                            models.push(model);
                        }
                    });
            }
        });

        // If no tables found, try to extract from text content
        if (models.length === 0) {
            const bodyText = $("body").text();
            const modelMatches = bodyText.match(/([\w\-]+(?:gemini|palm|vertex|pro|ultra)[\w\-]*)/gi);

            if (modelMatches) {
                console.log(`[Google Vertex] Found ${modelMatches.length} potential models in text`);

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
                                input:
                                    modelName.toLowerCase().includes("vision")
                                    || modelName.toLowerCase().includes("pro")
                                    || modelName.toLowerCase().includes("ultra")
                                        ? ["text", "image"]
                                        : ["text"],
                                output: ["text"],
                            },
                            name: modelName,
                            openWeights: false,
                            provider: "Google Vertex",
                            providerDoc: GOOGLE_VERTEX_DOCS_URL,
                            // Provider metadata
                            providerEnv: ["GOOGLE_VERTEX_PROJECT", "GOOGLE_VERTEX_LOCATION", "GOOGLE_APPLICATION_CREDENTIALS"],
                            providerModelsDevId: "google-vertex",
                            providerNpm: "@ai-sdk/google-vertex",
                            reasoning: false,
                            releaseDate: null,
                            streamingSupported: true,
                            temperature: true,
                            toolCall: modelName.toLowerCase().includes("pro") || modelName.toLowerCase().includes("ultra"),
                            vision:
                                modelName.toLowerCase().includes("vision")
                                || modelName.toLowerCase().includes("pro")
                                || modelName.toLowerCase().includes("ultra"),
                        };

                        models.push(model);
                    }
                }
            }
        }

        console.log(`[Google Vertex] Scraped ${models.length} models from documentation`);

        return models;
    } catch (error) {
        console.error("[Google Vertex] Error scraping documentation:", error instanceof Error ? error.message : String(error));

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
 * Transforms Google Vertex model data into the normalized structure.
 * @param rawData Raw data from Google Vertex API
 * @returns Array of normalized model objects
 */
export function transformGoogleVertexModels(rawData: any): Model[] {
    const models: Model[] = [];

    // This function is kept for interface compatibility but the main logic is in fetchGoogleVertexModels
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
                id: kebabCase(modelData.name || modelData.displayName),
                knowledge: null,
                lastUpdated: null,
                limit: {
                    context: modelData.inputTokenLimit || null,
                    output: modelData.outputTokenLimit || null,
                },
                modalities: {
                    input: modelData.supportedGenerationMethods?.includes("generate-content") ? ["text", "image"] : ["text"],
                    output: ["text"],
                },
                name: modelData.displayName || modelData.name,
                openWeights: false,
                provider: "Google Vertex",
                providerDoc: GOOGLE_VERTEX_DOCS_URL,
                // Provider metadata
                providerEnv: ["GOOGLE_VERTEX_PROJECT", "GOOGLE_VERTEX_LOCATION", "GOOGLE_APPLICATION_CREDENTIALS"],
                providerModelsDevId: "google-vertex",
                providerNpm: "@ai-sdk/google-vertex",
                reasoning: false,
                releaseDate: null,
                streamingSupported: true,
                temperature: true,
                toolCall: modelData.supportedGenerationMethods?.includes("tool-calls") || false,
                vision: modelData.supportedGenerationMethods?.includes("generate-content") || false,
            };

            models.push(model);
        }
    }

    return models;
}
