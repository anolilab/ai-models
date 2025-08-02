import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const FIREWORKS_MODELS_URL = "https://app.fireworks.ai/models?filter=All%20Models";
const FIREWORKS_DOCS_URL = "https://readme.fireworks.ai/";

/**
 * Scrapes Fireworks AI models page for model information.
 */
const scrapeFireworksModelsPage = async (): Promise<Model[]> => {
    try {
        console.log("[Fireworks AI] Scraping models page:", FIREWORKS_MODELS_URL);
        const response = await axios.get(FIREWORKS_MODELS_URL);
        const $ = load(response.data);

        const models: Model[] = [];

        // Find all model rows using the data-testid attribute
        $("[data-testid=\"model-row\"]").each((index, element) => {
            const $row = $(element);

            // Extract model name
            const modelName = $row.find("p.font-bold").first().text().trim();

            if (!modelName)
                return;

            console.log(`[Fireworks AI] Found model: ${modelName}`);

            // Extract pricing information
            const pricingText = $row
                .find(String.raw`.text-muted-foreground\/60`)
                .text()
                .trim();
            const cost = parsePricing(pricingText);

            // Extract context length
            const contextMatch = pricingText.match(/(\d+)k\s+Context/);
            const contextLength = contextMatch ? Number.parseInt(contextMatch[1]) * 1024 : null;

            // Extract model type/capabilities from badges
            const badges = $row
                .find(".gap-1 .bg-white")
                .map((_, badge) => $(badge).text().trim())
                .get();
            const isVision = badges.some((badge) => badge.toLowerCase().includes("vision"));

            const model: Model = {
                attachment: false,
                cost,
                extendedThinking: modelName.toLowerCase().includes("thinking"),
                id: kebabCase(modelName).replace("accounts-fireworks-models-", "accounts/fireworks/models/"),
                knowledge: null,
                lastUpdated: null,
                limit: {
                    context: contextLength,
                    output: null,
                },
                modalities: {
                    input: isVision ? ["text", "image"] : ["text"],
                    output: ["text"],
                },
                name: modelName,
                openWeights: false,
                provider: "Fireworks AI",
                providerDoc: FIREWORKS_DOCS_URL,
                // Provider metadata
                providerEnv: ["FIREWORKS_API_KEY"],
                providerModelsDevId: "fireworks-ai",
                providerNpm: "@ai-sdk/fireworks",
                reasoning: modelName.toLowerCase().includes("thinking"),
                releaseDate: null,
                streamingSupported: true,
                temperature: true, // Most models support temperature
                toolCall: false, // Need to check documentation for this
                vision: isVision,
            };

            models.push(model);
        });

        console.log(`[Fireworks AI] Scraped ${models.length} models from models page`);

        return models;
    } catch (error) {
        console.error("[Fireworks AI] Error scraping models page:", error instanceof Error ? error.message : String(error));

        return [];
    }
};

/**
 * Parse pricing information from text (e.g., "$0.22/M Input • $0.88/M Output")
 */
const parsePricing = (pricingText: string): { input: number | null; inputCacheHit: number | null; output: number | null } => {
    let input: number | null = null;
    let output: number | null = null;
    const inputCacheHit: number | null = null;

    if (!pricingText)
        return { input, inputCacheHit, output };

    // Extract input cost
    const inputMatch = pricingText.match(/\$([\d.]+)\/M\s+Input/);

    if (inputMatch) {
        const parsed = Number.parseFloat(inputMatch[1]);

        input = Number.isNaN(parsed) ? null : parsed;
    }

    // Extract output cost
    const outputMatch = pricingText.match(/\$([\d.]+)\/M\s+Output/);

    if (outputMatch) {
        const parsed = Number.parseFloat(outputMatch[1]);

        output = Number.isNaN(parsed) ? null : parsed;
    }

    return { input, inputCacheHit, output };
};

/**
 * Transforms Fireworks AI model data into the normalized structure.
 * @param rawData Raw data from Fireworks AI API
 * @returns Array of normalized model objects
 */
export const transformFireworksAIModels = (rawData: any): Model[] => {
    const models: Model[] = [];

    // This function is kept for interface compatibility but the main logic is in fetchFireworksAIModels
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
                id: kebabCase(modelData.id || modelData.name).replace("accounts-fireworks-models-", "accounts/fireworks/models/"),
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
                provider: "Fireworks AI",
                providerDoc: FIREWORKS_DOCS_URL,
                // Provider metadata
                providerEnv: ["FIREWORKS_API_KEY"],
                providerModelsDevId: "fireworks-ai",
                providerNpm: "@ai-sdk/fireworks",
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
 * Fetches Fireworks AI models from their models page.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchFireworksAIModels = async (): Promise<Model[]> => {
    console.log("[Fireworks AI] Fetching models from models page...");

    try {
        const models = await scrapeFireworksModelsPage();

        console.log(`[Fireworks AI] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[Fireworks AI] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
