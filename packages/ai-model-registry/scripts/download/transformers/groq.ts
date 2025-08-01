import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

/**
 * Parses a token limit string and converts to number
 * @param limitStr Limit string in format like "131,072" or "8,192"
 * @returns Parsed limit as number or null if parsing fails
 * @example
 * parseTokenLimit("131,072") // Returns 131072
 * parseTokenLimit("8,192") // Returns 8192
 */
const parseTokenLimit = (limitString: string): number | null => {
    if (!limitString || limitString === "N/A")
        return null;

    // Remove commas and parse
    const cleanString = limitString.replace(/,/g, "");
    const match = cleanString.match(/(\d+(?:\.\d+)?)\s*K/i);

    if (match) {
        return Math.round(Number.parseFloat(match[1]) * 1000);
    }

    // Try to match just numbers
    const numberMatch = cleanString.match(/(\d+)/);

    if (numberMatch) {
        return Number.parseInt(numberMatch[1], 10);
    }

    return null;
};

/**
 * Parses a price string and converts to number
 * @param priceString Price string in format like "$0.05" or "$0.10"
 * @returns Parsed price as number or null if parsing fails
 */
const parsePrice = (priceString: string): number | null => {
    if (!priceString || priceString === "N/A" || priceString === "Free" || priceString === "Varies") {
        return null;
    }

    const match = priceString.match(/\$?([\d,]+\.?\d*)/);

    if (match) {
        return Number.parseFloat(match[1].replace(/,/g, ""));
    }

    return null;
};

/**
 * Determines model capabilities based on model name and details
 */
const getModelCapabilities = (
    modelName: string,
    details: any,
): {
    audio: boolean;
    preview: boolean;
    reasoning: boolean;
    streaming: boolean;
    temperature: boolean;
    toolCall: boolean;
    vision: boolean;
} => {
    const lowerName = modelName.toLowerCase();

    return {
        audio: lowerName.includes("audio") || details.audio || false,
        preview: lowerName.includes("beta") || lowerName.includes("preview") || details.preview || false,
        reasoning: lowerName.includes("reasoning") || details.reasoning || false,
        streaming: true, // All Groq models support streaming
        temperature: true, // All Groq models support temperature
        toolCall: true, // Most Groq models support tool calling
        vision: lowerName.includes("vision") || details.vision || false,
    };
};

/**
 * Gets input modalities for a model
 */
const getInputModalities = (modelName: string, details: any): string[] => {
    const modalities = ["text"];
    const capabilities = getModelCapabilities(modelName, details);

    if (capabilities.vision) {
        modalities.push("image");
    }

    if (capabilities.audio) {
        modalities.push("audio");
    }

    return modalities;
};

/**
 * Gets output modalities for a model
 */
const getOutputModalities = (modelName: string, details: any): string[] => {
    const modalities = ["text"];
    const capabilities = getModelCapabilities(modelName, details);

    if (capabilities.audio) {
        modalities.push("audio");
    }

    return modalities;
};

/**
 * Fetches model details from a model's detail page
 */
const fetchModelDetails = async (detailUrl: string): Promise<any> => {
    try {
        const response = await axios.get(detailUrl);
        const $ = load(response.data);

        const details: any = {};

        // Extract pricing information
        $("h2, h3").each((_, element) => {
            const text = $(element).text().toLowerCase();

            if (text.includes("pricing")) {
                const pricingSection = $(element).nextUntil("h2, h3");

                // Look for price information in the section
                pricingSection.find("td, .price, .cost").each((_, priceEl) => {
                    const priceText = $(priceEl).text();

                    if (priceText.includes("$")) {
                        details.pricing = priceText;
                    }
                });
            }
        });

        // Extract capabilities from the page content
        const pageText = $.text().toLowerCase();

        details.vision = pageText.includes("vision") || pageText.includes("image");
        details.audio = pageText.includes("audio") || pageText.includes("speech");
        details.reasoning = pageText.includes("reasoning") || pageText.includes("compound");
        details.preview = pageText.includes("preview") || pageText.includes("beta");

        return details;
    } catch (error) {
        console.warn(`[Groq] Error fetching model details from ${detailUrl}:`, error instanceof Error ? error.message : String(error));

        return {};
    }
};

/**
 * Transforms Groq model data from their documentation into the normalized structure.
 * @param htmlContent The HTML content from the Groq documentation
 * @returns Array of normalized model objects
 */
const transformGroqModels = async (htmlContent: string): Promise<Model[]> => {
    const $ = load(htmlContent);
    const models: Model[] = [];
    const modelDataToProcess: {
        cells: string[];
        detailUrl: string | null;
        modelId: string;
        modelName: string;
    }[] = [];

    // Look for model IDs in the HTML content
    const modelIdPattern = /"([a-zA-Z0-9\-./]+)"[^"]*"font-mono"/g;
    const matches = htmlContent.matchAll(modelIdPattern);

    for (const match of matches) {
        const modelId = match[1];

        // Skip if it's not a valid model ID
        if (!modelId || modelId.includes("$") || modelId.includes("span") || modelId.length < 3) {
            continue;
        }

        console.log(`[Groq] Found model ID: ${modelId}`);

        // Look for the detail URL near this model ID
        const detailUrlPattern = new RegExp(`"${modelId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-details"[^}]*href":"([^"]+)"`, "g");
        const detailMatches = htmlContent.matchAll(detailUrlPattern);
        let detailUrl = null;

        for (const detailMatch of detailMatches) {
            detailUrl = detailMatch[1].startsWith("http") ? detailMatch[1] : `https://console.groq.com${detailMatch[1]}`;
            break;
        }

        // Look for the specific model row in the table and extract the context window and max tokens
        // We'll use a simpler approach: find the model ID and then look for the next two numbers in the same row
        const modelRowPattern = new RegExp(
            `"${modelId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^}]*"font-mono"[^}]*>[^<]+<\/span>[^}]*>([^<]+)<\/div>[^}]*>([0-9,]+)<\/div>[^}]*>([0-9,]+)<\/div>`,
            "g",
        );
        const modelRowMatches = htmlContent.matchAll(modelRowPattern);
        const cells: string[] = [];

        for (const modelRowMatch of modelRowMatches) {
            const developer = modelRowMatch[1];
            const contextWindow = modelRowMatch[2];
            const maxTokens = modelRowMatch[3];

            // Skip if the developer doesn't look like a valid developer name
            if (developer && !developer.includes("$") && developer.length > 1) {
                cells.push(contextWindow);
                cells.push(maxTokens);
                console.log(`[Groq] Found model row data for ${modelId}: ${developer}, ${contextWindow}, ${maxTokens}`);
                break;
            }
        }

        // If we didn't find the data, try a simpler approach
        if (cells.length === 0) {
            // Look for numbers near the model ID in the HTML
            const numberPattern = new RegExp(`"${modelId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^}]*"([0-9,]+)"`, "g");
            const numberMatches = htmlContent.matchAll(numberPattern);
            const numbers: string[] = [];

            for (const numberMatch of numberMatches) {
                numbers.push(numberMatch[1]);
            }

            // Take the first two numbers as context and max tokens
            if (numbers.length >= 2) {
                cells.push(numbers[0]);
                cells.push(numbers[1]);
                console.log(`[Groq] Found number data for ${modelId}: ${numbers[0]}, ${numbers[1]}`);
            } else {
                console.log(`[Groq] No context data found for ${modelId}`);
            }
        }

        modelDataToProcess.push({
            cells,
            detailUrl,
            modelId,
            modelName: modelId,
        });
    }

    // If no models found with the pattern approach, try the table approach as fallback
    if (modelDataToProcess.length === 0) {
        $("table").each((tableIndex, table) => {
            const tableText = $(table).text();

            // Look for tables that contain model information
            if (tableText.includes("Model") || tableText.includes("Production") || tableText.includes("Preview")) {
                console.log(`[Groq] Processing table ${tableIndex + 1}: ${tableText.substring(0, 100)}...`);

                $(table)
                    .find("tbody tr")
                    .each((rowIndex, row) => {
                        const cells = $(row)
                            .find("td")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        // Skip header rows or empty rows
                        if (cells.length < 2 || !cells[0] || cells[0].includes("Model")) {
                            return;
                        }

                        const modelName = cells[0];
                        const modelId = cells[1] || modelName;

                        // Find the detail page link
                        const detailLink = $(row).find("a").attr("href");
                        let detailUrl = null;

                        if (detailLink) {
                            detailUrl = detailLink.startsWith("http") ? detailLink : `https://console.groq.com${detailLink}`;
                        }

                        console.log(`[Groq] Found model: ${modelName} (${modelId}) - ${detailUrl}`);

                        modelDataToProcess.push({
                            cells,
                            detailUrl,
                            modelId,
                            modelName,
                        });
                    });
            }
        });
    }

    // Process all models asynchronously
    for (const modelData of modelDataToProcess) {
        // Fetch model details if we have a detail URL
        let modelDetails = {};

        if (modelData.detailUrl) {
            modelDetails = await fetchModelDetails(modelData.detailUrl);
        }

        // Extract basic information from the table row
        const contextLength = modelData.cells[0] || "";
        const maxOutput = modelData.cells[1] || "";
        const inputCost = modelData.cells[2] || "";
        const outputCost = modelData.cells[3] || "";

        const capabilities = getModelCapabilities(modelData.modelName, modelDetails);

        const model: Model = {
            attachment: false,
            cost: {
                input: parsePrice(inputCost),
                inputCacheHit: null,
                output: parsePrice(outputCost),
            },
            extendedThinking: capabilities.reasoning,
            id: kebabCase(modelData.modelId),
            knowledge: null, // Will be extracted from details if available
            lastUpdated: null,
            limit: {
                context: parseTokenLimit(contextLength),
                output: parseTokenLimit(maxOutput),
            },
            modalities: {
                input: getInputModalities(modelData.modelName, modelDetails),
                output: getOutputModalities(modelData.modelName, modelDetails),
            },
            name: modelData.modelName,
            openWeights: false,
            preview: capabilities.preview,
            provider: "Groq",
            providerDoc: "https://console.groq.com/docs/models",
            providerEnv: ["GROQ_API_KEY"],
            providerModelsDevId: "groq",
            providerNpm: "@ai-sdk/groq",
            reasoning: capabilities.reasoning,
            releaseDate: null,
            streamingSupported: capabilities.streaming,
            temperature: capabilities.temperature,
            toolCall: capabilities.toolCall,
            vision: capabilities.vision,
        };

        models.push(model);
    }

    console.log(`[Groq] Extracted ${models.length} models from documentation`);

    return models;
};

/**
 * Fetches models from Groq documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchGroqModels(): Promise<Model[]> {
    console.log("[Groq] Fetching: https://console.groq.com/docs/models");

    try {
        const response = await axios.get("https://console.groq.com/docs/models");
        const htmlContent = response.data;

        const models = await transformGroqModels(htmlContent);

        console.log(`[Groq] Successfully transformed ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Groq] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

export { fetchGroqModels, transformGroqModels };
