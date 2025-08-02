import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const GOOGLE_DOCS_URL = "https://ai.google.dev/models";

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
 * Transforms Google model data from their documentation into the normalized structure.
 * @param htmlContent The HTML content from the Google AI documentation
 * @returns Array of normalized model objects
 */
export const transformGoogleModels = (htmlContent: string): Model[] => {
    const $ = load(htmlContent);
    const models: Model[] = [];

    // Look for model tables in the documentation
    $("table").each((index, table) => {
        const tableText = $(table).text().toLowerCase();

        // Check if this table contains model information
        if (tableText.includes("model") || tableText.includes("gemini") || tableText.includes("palm") || tableText.includes("imagen")) {
            console.log(`[Google] Found potential model table ${index + 1}`);

            $(table)
                .find("tbody tr")
                .each((_, row) => {
                    const cells = $(row)
                        .find("td")
                        .map((_, td) => $(td).text().trim())
                        .get();

                    if (cells.length >= 2 && cells[0] && !cells[0].includes("model") && !cells[0].includes("name")) {
                        const modelName = cells[0];

                        console.log(`[Google] Found model: ${modelName}`);

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
                                input:
                                    modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("gemini-1-5-pro")
                                        ? ["text", "image"]
                                        : ["text"],
                                output: modelName.toLowerCase().includes("imagen") ? ["image"] : ["text"],
                            },
                            name: modelName,
                            openWeights: false,
                            provider: "Google",
                            providerDoc: GOOGLE_DOCS_URL,
                            // Provider metadata
                            providerEnv: ["GOOGLE_API_KEY"],
                            providerModelsDevId: "google",
                            providerNpm: "@ai-sdk/google",
                            reasoning: false,
                            releaseDate: null,
                            streamingSupported: true,
                            temperature: true,
                            toolCall: modelName.toLowerCase().includes("gemini"),
                            vision: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("gemini-1-5-pro"),
                        };

                        models.push(model);
                    }
                });
        }
    });

    // If no tables found, try to extract from text content
    if (models.length === 0) {
        const bodyText = $("body").text();
        const modelMatches = bodyText.match(/([\w\-]+(?:gemini|palm|imagen|whisper)[\w\-]*)/gi);

        if (modelMatches) {
            console.log(`[Google] Found ${modelMatches.length} potential models in text`);

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
                                modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("gemini-1-5-pro") ? ["text", "image"] : ["text"],
                            output: modelName.toLowerCase().includes("imagen") ? ["image"] : ["text"],
                        },
                        name: modelName,
                        openWeights: false,
                        provider: "Google",
                        providerDoc: GOOGLE_DOCS_URL,
                        // Provider metadata
                        providerEnv: ["GOOGLE_API_KEY"],
                        providerModelsDevId: "google",
                        providerNpm: "@ai-sdk/google",
                        reasoning: false,
                        releaseDate: null,
                        streamingSupported: true,
                        temperature: true,
                        toolCall: modelName.toLowerCase().includes("gemini"),
                        vision: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("gemini-1-5-pro"),
                    };

                    models.push(model);
                }
            }
        }
    }

    return models;
};

/**
 * Fetches models from Google AI documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchGoogleModels = async (): Promise<Model[]> => {
    console.log("[Google] Fetching: https://ai.google.dev/models");

    const response = await axios.get("https://ai.google.dev/models");
    const htmlContent = response.data;

    const models = transformGoogleModels(htmlContent);

    console.log(`[Google] Found ${models.length} models`);

    return models;
};
