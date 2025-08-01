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
const parsePrice = (priceString: string): number | null => {
    if (!priceString || priceString === "N/A" || priceString === "Free") {
        return null;
    }

    const match = priceString.match(/\$?([\d,]+\.?\d*)/);

    if (match) {
        return Number.parseFloat(match[1].replaceAll(",", ""));
    }

    return null;
};

const parseTokenLimit = (limitString: string): number | null => {
    if (!limitString || limitString === "N/A")
        return null;

    const match = limitString.match(/(\d+(?:\.\d+)?)\s*K/i);

    if (match) {
        return Math.round(Number.parseFloat(match[1]) * 1000);
    }

    // Try to match just numbers
    const numberMatch = limitString.match(/(\d+)/);

    if (numberMatch) {
        return Number.parseInt(numberMatch[1], 10);
    }

    return null;
};

/**
 * Parses a file size string and converts to number (in MB)
 * @param fileSizeStr File size string in format like "20 MB" or "100 MB"
 * @returns Parsed size as number (in MB) or null if parsing fails
 * @example
 * parseFileSize("20 MB") // Returns 20
 * parseFileSize("100 MB") // Returns 100
 */
const parseFileSize = (fileSizeString: string): number | null => {
    if (!fileSizeString || fileSizeString === "N/A")
        return null;

    const match = fileSizeString.match(/(\d+(?:\.\d+)?)\s*[GMK]B?/i);

    if (match) {
        const value = Number.parseFloat(match[1]);
        const unit = match[0].toLowerCase();

        if (unit.includes("gb"))
            return Math.round(value * 1024 * 1024 * 1024);

        if (unit.includes("mb"))
            return Math.round(value * 1024 * 1024);

        if (unit.includes("kb"))
            return Math.round(value * 1024);

        return Math.round(value);
    }

    return null;
};

/**
 * Determines if a model supports vision based on its name or characteristics
 * @param modelId The model ID
 * @returns True if the model supports vision
 */
const supportsVision = (modelId: string): boolean => {
    const visionModels = [
        "llama-3.1-8b-instant",
        "llama-3.1-70b-versatile",
        "llama-3.1-405b-reasoning",
        "llama-3.1-8b-instant-vision",
        "llama-3.1-70b-versatile-vision",
        "llama-3.1-405b-reasoning-vision",
    ];

    return visionModels.some((model) => modelId.toLowerCase().includes(model.toLowerCase()));
};

/**
 * Determines if a model supports audio based on its name or characteristics
 * @param modelId The model ID
 * @returns True if the model supports audio
 */
const supportsAudio = (modelId: string): boolean => {
    const audioModels = ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "llama-3.1-405b-reasoning"];

    return audioModels.some((model) => modelId.toLowerCase().includes(model.toLowerCase()));
};

/**
 * Determines if a model supports text-to-speech based on its name or characteristics
 * @param modelId The model ID
 * @returns True if the model supports text-to-speech
 */
const supportsTextToSpeech = (modelId: string): boolean => {
    const ttsModels = ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "llama-3.1-405b-reasoning"];

    return ttsModels.some((model) => modelId.toLowerCase().includes(model.toLowerCase()));
};

/**
 * Determines if a model supports compound/tool use based on its name or characteristics
 * @param modelId The model ID
 * @returns True if the model supports compound/tool use
 */
const supportsCompound = (modelId: string): boolean => {
    const compoundModels = ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "llama-3.1-405b-reasoning"];

    return compoundModels.some((model) => modelId.toLowerCase().includes(model.toLowerCase()));
};

/**
 * Determines if a model is a preview/beta model
 * @param modelId The model ID
 * @returns True if the model is a preview/beta model
 */
const isPreviewModel = (modelId: string): boolean => {
    const previewModels = ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "llama-3.1-405b-reasoning"];

    return previewModels.some((model) => modelId.toLowerCase().includes(model.toLowerCase()));
};

/**
 * Determines input modalities for a model
 * @param modelId The model ID
 * @param developer The developer name
 * @returns Array of input modalities
 */
const getInputModalities = (modelId: string, developer: string): string[] => {
    const modalities = ["text"];

    if (supportsVision(modelId)) {
        modalities.push("image");
    }

    if (supportsAudio(modelId)) {
        modalities.push("audio");
    }

    return modalities;
};

/**
 * Determines output modalities for a model
 * @param modelId The model ID
 * @param developer The developer name
 * @returns Array of output modalities
 */
const getOutputModalities = (modelId: string, developer: string): string[] => {
    const modalities = ["text"];

    if (supportsTextToSpeech(modelId)) {
        modalities.push("audio");
    }

    return modalities;
};

/**
 * Transforms Groq model data from their documentation into the normalized structure.
 * @param htmlContent The HTML content from the Groq documentation
 * @returns Array of normalized model objects
 */
const transformGroqModels = (htmlContent: string): Model[] => {
    const $ = load(htmlContent);
    const models: Model[] = [];

    // Find the models table
    $("table").each((tableIndex, table) => {
        const tableText = $(table).text();

        // Look for the table that contains model information
        if (tableText.includes("Model") && (tableText.includes("Context") || tableText.includes("Tokens"))) {
            console.log(`[Groq] Found models table ${tableIndex + 1}`);

            $(table)
                .find("tbody tr")
                .each((rowIndex, row) => {
                    const cells = $(row)
                        .find("td")
                        .map((_, td) => $(td).text().trim())
                        .get();

                    // Skip header rows or empty rows
                    if (cells.length < 3 || !cells[0] || cells[0].includes("Model")) {
                        return;
                    }

                    const modelName = cells[0];
                    const contextLength = cells[1];
                    const maxOutput = cells[2];
                    const inputCost = cells[3];
                    const outputCost = cells[4];
                    const developer = cells[5] || "Meta"; // Default to Meta if not specified

                    // Skip if not a valid model
                    if (!modelName || modelName === "N/A") {
                        return;
                    }

                    console.log(`[Groq] Processing model: ${modelName}`);

                    // Determine model capabilities based on name
                    const hasVision = supportsVision(modelName);
                    const hasAudio = supportsAudio(modelName);
                    const hasTTS = supportsTextToSpeech(modelName);
                    const hasCompound = supportsCompound(modelName);
                    const isPreview = isPreviewModel(modelName);

                    // Determine reasoning capability (larger models typically have better reasoning)
                    const hasReasoning = modelName.includes("405b") || modelName.includes("70b");

                    // Determine tool calling capability
                    const hasToolCall = true; // Most Groq models support tool calling

                    // Determine temperature support
                    const hasTemperature = true; // All Groq models support temperature

                    // Determine knowledge cutoff
                    let knowledgeCutoff = null;

                    if (modelName.includes("2024")) {
                        knowledgeCutoff = "2024";
                    } else if (modelName.includes("2023")) {
                        knowledgeCutoff = "2023";
                    }

                    // Determine release date based on model name
                    let releaseDate = null;

                    if (modelName.includes("3.1")) {
                        releaseDate = "2024-07-18";
                    } else if (modelName.includes("3.0")) {
                        releaseDate = "2024-04-18";
                    }

                    const model: Model = {
                        attachment: false,
                        cost: {
                            input: parsePrice(inputCost),
                            inputCacheHit: null,
                            output: parsePrice(outputCost),
                        },
                        extendedThinking: hasReasoning,
                        id: kebabCase(modelName),
                        knowledge: knowledgeCutoff,
                        lastUpdated: null,
                        limit: {
                            context: parseTokenLimit(contextLength),
                            output: parseTokenLimit(maxOutput),
                        },
                        modalities: {
                            input: getInputModalities(modelName, developer),
                            output: getOutputModalities(modelName, developer),
                        },
                        name: modelName,
                        openWeights: false,
                        preview: isPreview,
                        provider: "Groq",
                        providerDoc: "https://console.groq.com/docs/models",
                        // Provider metadata
                        providerEnv: ["GROQ_API_KEY"],
                        providerModelsDevId: "groq",
                        providerNpm: "@ai-sdk/groq",
                        reasoning: hasReasoning,
                        releaseDate,
                        streamingSupported: true,
                        temperature: hasTemperature,
                        toolCall: hasToolCall,
                        vision: hasVision,
                    };

                    models.push(model);
                });
        }
    });

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

        const models = transformGroqModels(htmlContent);

        console.log(`[Groq] Successfully transformed ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Groq] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

export { fetchGroqModels, transformGroqModels };
