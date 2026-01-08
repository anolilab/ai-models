import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";
import { parseContextLength, toNumber } from "../utils/index.js";

const GOOGLE_VERTEX_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GOOGLE_VERTEX_DOCS_URL = "https://cloud.google.com/vertex-ai/generative-ai/docs/models";

/**
 * Scrapes Google Vertex documentation for model information.
 */
const scrapeGoogleVertexDocs = async (): Promise<Model[]> => {
    try {
        const response = await axios.get(GOOGLE_VERTEX_DOCS_URL);
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for model-list divs which contain the actual models
        $(".model-list").each((index, modelList) => {
            console.log(`[Google Vertex] Found model list ${index + 1}`);

            // Find all links within the model-list that likely point to model details
            $(modelList)
                .find("a")
                .each((linkIndex, link) => {
                    const href = $(link).attr("href");
                    const modelName = $(link).text().trim();

                    // Check if this looks like a model name and has a valid href
                    if (
                        href
                        && modelName
                        && modelName.length > 3
                        && modelName.length < 100
                        && (modelName.toLowerCase().includes("gemini")
                            || modelName.toLowerCase().includes("palm")
                            || modelName.toLowerCase().includes("pro")
                            || modelName.toLowerCase().includes("ultra")
                            || modelName.toLowerCase().includes("imagen")
                            || modelName.toLowerCase().includes("veo")
                            || modelName.toLowerCase().includes("gemma")
                            || modelName.toLowerCase().includes("embedding"))
                        && !modelName.toLowerCase().includes("overview")
                        && !modelName.toLowerCase().includes("tutorial")
                        && !modelName.toLowerCase().includes("quickstart")
                    ) {
                        console.log(`[Google Vertex] Found model: ${modelName}`);

                        // Try to get additional context from the parent elements
                        const parentText = $(link).parent().text();
                        let contextLength: number | null = null;

                        // Look for context length in the surrounding text
                        const contextMatch = parentText.match(/(\d+)([km])\s*(?:tokens?|context)/i);

                        if (contextMatch) {
                            contextLength = parseContextLength(contextMatch[0]);
                        }

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
                                input:
                                    modelName.toLowerCase().includes("vision")
                                    || modelName.toLowerCase().includes("pro")
                                    || modelName.toLowerCase().includes("ultra")
                                    || modelName.toLowerCase().includes("imagen")
                                        ? ["text", "image"]
                                        : ["text"],
                                output: modelName.toLowerCase().includes("imagen") || modelName.toLowerCase().includes("veo") ? ["image", "video"] : ["text"],
                            },
                            name: modelName,
                            openWeights: modelName.toLowerCase().includes("gemma"),
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
                                || modelName.toLowerCase().includes("ultra")
                                || modelName.toLowerCase().includes("imagen"),
                        };

                        models.push(model);
                    }
                });
        });

        // If no models found via model-list, try to extract from text content
        if (models.length === 0) {
            const bodyText = $("body").text();
            const modelMatches = bodyText.match(/([\w-]+(?:gemini|palm|vertex|pro|ultra|imagen|veo|gemma)[\w-]*)/gi);

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
                                    || modelName.toLowerCase().includes("imagen")
                                        ? ["text", "image"]
                                        : ["text"],
                                output: modelName.toLowerCase().includes("imagen") || modelName.toLowerCase().includes("veo") ? ["image", "video"] : ["text"],
                            },
                            name: modelName,
                            openWeights: modelName.toLowerCase().includes("gemma"),
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
                                || modelName.toLowerCase().includes("ultra")
                                || modelName.toLowerCase().includes("imagen"),
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
};

/**
 * Transforms Google Vertex model data into the normalized structure.
 * @param rawData Raw data from Google Vertex API
 * @returns Array of normalized model objects
 */
export const transformGoogleVertexModels = (rawData: unknown): Model[] => {
    const models: Model[] = [];

    // This function is kept for interface compatibility but the main logic is in fetchGoogleVertexModels
    if (Array.isArray(rawData)) {
        for (const modelData of rawData as {
            displayName?: string;
            inputTokenLimit?: number;
            name?: string;
            outputTokenLimit?: number;
            supportedGenerationMethods?: string[];
        }[]) {
            const model: Model = {
                attachment: false,
                cost: {
                    input: null,
                    inputCacheHit: null,
                    output: null,
                },
                extendedThinking: false,
                id: kebabCase(modelData.name || modelData.displayName || ""),
                knowledge: null,
                lastUpdated: null,
                limit: {
                    context: toNumber(modelData.inputTokenLimit) || null,
                    output: toNumber(modelData.outputTokenLimit) || null,
                },
                modalities: {
                    input: modelData.supportedGenerationMethods?.includes("generate-content") ? ["text", "image"] : ["text"],
                    output: ["text"],
                },
                name: modelData.displayName || modelData.name || "",
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
};

/**
 * Fetches Google Vertex models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchGoogleVertexModels = async (): Promise<Model[]> => {
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
                        id: kebabCase(modelData.name || modelData.displayName || ""),
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
                        name: modelData.displayName || modelData.name || "",
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
};
