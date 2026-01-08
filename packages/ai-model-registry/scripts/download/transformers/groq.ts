import { kebabCase } from "@visulima/string";
import axios from "axios";

import type { Model } from "../../../src/schema.js";
import { parsePrice, parseTokenLimit } from "../utils/index.js";

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
 * Parses a markdown table row into cells.
 * @param row The markdown table row string
 * @returns Array of cell values
 */
const parseMarkdownTableRow = (row: string): string[] => row
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

/**
 * Extracts model ID from a markdown table cell that may contain links and images.
 * The model ID typically appears after the link, e.g., `[![Meta](...)Llama 3.1 8B](/docs/model/llama-3.1-8b-instant)llama-3.1-8b-instant`
 * @param cell The markdown table cell content
 * @returns The extracted model ID
 */
const extractModelId = (cell: string): string | null => {
    // Pattern to match model IDs after markdown links
    // Example: `[![Meta](...)Llama 3.1 8B](/docs/model/llama-3.1-8b-instant)llama-3.1-8b-instant`
    // The model ID appears after the closing parenthesis of the link
    const linkPattern = /\]\([^)]+\)([a-z0-9\-./]+)/i;
    const match = cell.match(linkPattern);

    if (match && match[1]) {
        const modelId = match[1].trim();

        // Validate it looks like a model ID (contains at least one slash or hyphen, or is a simple ID)
        if (modelId.length >= 3 && /^[a-z0-9\-./]+$/i.test(modelId)) {
            return modelId;
        }
    }

    // Fallback: look for any valid model ID pattern in the cell
    // Model IDs typically have format like: llama-3.1-8b-instant, meta-llama/llama-guard-4-12b, etc.
    const modelIdPattern = /([a-z0-9]+(?:[-./][a-z0-9]+)+)/i;
    const fallbackMatch = cell.match(modelIdPattern);

    if (fallbackMatch && fallbackMatch[1]) {
        return fallbackMatch[1];
    }

    return null;
};

/**
 * Extracts detail URL from a markdown table cell.
 * @param cell The markdown table cell content
 * @returns The extracted detail URL or null
 */
const extractDetailUrl = (cell: string): string | null => {
    const linkPattern = /\]\(([^)]+)\)/;
    const match = cell.match(linkPattern);

    if (match && match[1]) {
        const url = match[1];

        return url.startsWith("http") ? url : `https://console.groq.com${url}`;
    }

    return null;
};

/**
 * Parses price string that may contain "input" and "output" prices.
 * Examples: "$0.05 input$0.08 output", "$0.111 per hour"
 * @param priceText The price text to parse
 * @returns Object with input and output prices, or null for per-hour pricing
 */
const parsePriceString = (priceText: string): { input: string | null; output: string | null } | null => {
    if (!priceText || priceText.trim() === "-" || priceText.trim() === "") {
        return { input: null, output: null };
    }

    // Check for per-hour pricing (e.g., "$0.111 per hour")
    if (priceText.toLowerCase().includes("per hour")) {
        return null; // Special handling needed for per-hour models
    }

    // Extract input and output prices
    const inputMatch = priceText.match(/\$([\d.]+)\s*input/i);
    const outputMatch = priceText.match(/\$([\d.]+)\s*output/i);

    return {
        input: inputMatch ? `$${inputMatch[1]}` : null,
        output: outputMatch ? `$${outputMatch[1]}` : null,
    };
};

/**
 * Transforms Groq model data from their markdown documentation into the normalized structure.
 * @param markdownContent The markdown content from the Groq documentation
 * @returns Array of normalized model objects
 */
export const transformGroqModels = async (markdownContent: string): Promise<Model[]> => {
    const models: Model[] = [];
    const lines = markdownContent.split("\n");
    let currentSection: "production" | "preview" | "systems" | null = null;
    let inTable = false;
    let headers: string[] = [];
    let headerIndexMap: Record<string, number> = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect section headers
        if (line.startsWith("## ")) {
            const sectionText = line.toLowerCase();

            if (sectionText.includes("production models")) {
                currentSection = "production";
            } else if (sectionText.includes("preview models")) {
                currentSection = "preview";
            } else if (sectionText.includes("production systems")) {
                currentSection = "systems";
            } else {
                currentSection = null;
            }

            inTable = false;
            headers = [];
            headerIndexMap = {};

            continue;
        }

        // Detect table start (header row)
        if (line.startsWith("|") && line.endsWith("|") && !inTable) {
            const cells = parseMarkdownTableRow(line);

            // Check if this looks like a table header (contains "MODEL ID" or similar)
            if (cells.length > 0 && (cells[0].includes("MODEL") || cells[0].includes("Model"))) {
                headers = cells;
                headerIndexMap = {};

                headers.forEach((header, index) => {
                    const normalizedHeader = header.toLowerCase().trim();

                    if (normalizedHeader.includes("model") && headerIndexMap["model"] === undefined) {
                        headerIndexMap["model"] = index;
                    }

                    if (normalizedHeader.includes("speed") && headerIndexMap["speed"] === undefined) {
                        headerIndexMap["speed"] = index;
                    }

                    if (normalizedHeader.includes("price") && headerIndexMap["price"] === undefined) {
                        headerIndexMap["price"] = index;
                    }

                    if (normalizedHeader.includes("context") && headerIndexMap["context"] === undefined) {
                        headerIndexMap["context"] = index;
                    }

                    if ((normalizedHeader.includes("completion") || normalizedHeader.includes("max")) && headerIndexMap["completion"] === undefined) {
                        headerIndexMap["completion"] = index;
                    }

                    if (normalizedHeader.includes("file") && headerIndexMap["file"] === undefined) {
                        headerIndexMap["file"] = index;
                    }
                });

                inTable = true;
                // Skip the separator row
                i++;

                continue;
            }
        }

        // Process table rows
        if (inTable && line.startsWith("|") && line.endsWith("|")) {
            // Skip separator rows
            if (line.match(/^\|[\s:|-]+\|$/)) {
                continue;
            }

            const cells = parseMarkdownTableRow(line);

            if (cells.length === 0) {
                continue;
            }

            // Extract model ID from first column
            const modelIndex = headerIndexMap["model"] ?? 0;

            if (modelIndex < 0 || modelIndex >= cells.length) {
                continue;
            }

            const modelIdCell = cells[modelIndex] || "";
            const modelId = extractModelId(modelIdCell);

            if (!modelId || modelId.length < 3) {
                continue;
            }

            const detailUrl = extractDetailUrl(modelIdCell);
            const priceIndex = headerIndexMap["price"] ?? -1;
            const contextIndex = headerIndexMap["context"] ?? -1;
            const completionIndex = headerIndexMap["completion"] ?? -1;
            const fileIndex = headerIndexMap["file"] ?? -1;

            const priceCell = priceIndex >= 0 && priceIndex < cells.length ? cells[priceIndex] : "";
            const contextCell = contextIndex >= 0 && contextIndex < cells.length ? cells[contextIndex] : "";
            const completionCell = completionIndex >= 0 && completionIndex < cells.length ? cells[completionIndex] : "";
            const fileSizeCell = fileIndex >= 0 && fileIndex < cells.length ? cells[fileIndex] : "";

            // Parse pricing
            const priceInfo = parsePriceString(priceCell);
            const isPreview = currentSection === "preview";
            const isSystem = currentSection === "systems";

            // Determine model name (use model ID as fallback)
            const modelName = modelId;

            // Determine capabilities based on model name and section
            const lowerName = modelName.toLowerCase();
            const details: any = {
                audio: lowerName.includes("whisper") || lowerName.includes("audio"),
                preview: isPreview,
                reasoning: lowerName.includes("reasoning") || lowerName.includes("compound"),
                vision: lowerName.includes("vision") || lowerName.includes("image"),
            };

            const capabilities = getModelCapabilities(modelName, details);

            // Handle special cases (e.g., Whisper has per-hour pricing)
            const costInput = priceInfo ? parsePrice(priceInfo.input || "") : null;
            const costOutput = priceInfo ? parsePrice(priceInfo.output || "") : null;

            const model: Model = {
                attachment: false,
                cost: {
                    input: costInput,
                    inputCacheHit: null,
                    output: costOutput,
                },
                extendedThinking: capabilities.reasoning,
                id: kebabCase(modelId),
                knowledge: null,
                lastUpdated: null,
                limit: {
                    context: parseTokenLimit(contextCell),
                    output: parseTokenLimit(completionCell),
                },
                modalities: {
                    input: getInputModalities(modelName, details),
                    output: getOutputModalities(modelName, details),
                },
                name: modelName,
                openWeights: false,
                preview: isPreview,
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
            console.log(`[Groq] Extracted model: ${modelId} (${isPreview ? "preview" : "production"})`);
        }

        // Reset table state if we hit a non-table line
        if (inTable && !line.startsWith("|")) {
            inTable = false;
            headers = [];
            headerIndexMap = {};
        }
    }

    console.log(`[Groq] Extracted ${models.length} models from markdown documentation`);

    return models;
};

/**
 * Fetches models from Groq documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchGroqModels = async (): Promise<Model[]> => {
    console.log("[Groq] Fetching: https://console.groq.com/docs/models.md");

    try {
        const response = await axios.get("https://console.groq.com/docs/models.md");
        const markdownContent = response.data;

        const models = await transformGroqModels(markdownContent);

        console.log(`[Groq] Successfully transformed ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Groq] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
