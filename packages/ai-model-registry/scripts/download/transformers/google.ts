import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";
import { parseContextLength } from "../utils/index.js";

const GOOGLE_DOCS_URL = "https://ai.google.dev/models";

/**
 * Parse context length from string (e.g., "32k" -> 32768)
 */

/**
 * Transforms Google model data from their documentation into the normalized structure.
 * @param htmlContent The HTML content from the Google AI documentation
 * @returns Array of normalized model objects
 */
export const transformGoogleModels = (htmlContent: string): Model[] => {
    const $ = load(htmlContent);
    const models: Model[] = [];

    // Look for model links with specific structure: <a href="#model-name">Model Name</a>
    $("a[href^='#gemini-']").each((index, link) => {
        const href = $(link).attr("href");
        const modelName = $(link).text().trim();

        if (href && modelName && modelName.length > 3) {
            console.log(`[Google] Found model: ${modelName}`);

            // Parse context length from the table row if available
            const tableRow = $(link).closest("tr");
            let contextLength: number | null = null;

            if (tableRow.length > 0) {
                const cells = tableRow
                    .find("td")
                    .map((_, td) => $(td).text().trim())
                    .get();

                contextLength = parseContextLength(cells[1] || cells[2] || "");
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
                    input: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("gemini-1-5-pro") ? ["text", "image"] : ["text"],
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

    // If no models found via links, try to extract from text content
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
