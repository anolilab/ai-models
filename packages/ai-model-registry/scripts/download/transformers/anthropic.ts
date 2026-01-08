import { kebabCase } from "@visulima/string";
import axios from "axios";

import type { Model } from "../../../src/schema.js";
import { parseTokenLimit } from "../utils/index.js";

/**
 * Parses a knowledge cutoff date string (e.g., "Jan 2025", "Feb 2025") into a year string.
 * @param dateString The date string to parse
 * @returns Year as string or null if parsing fails
 */
const parseKnowledgeCutoff = (dateString: string): string | null => {
    if (!dateString) {
        return null;
    }

    const yearMatch = dateString.match(/(\d{4})/);

    if (yearMatch) {
        return yearMatch[1];
    }

    return null;
};

/**
 * Extracts release date from Claude API ID (e.g., "claude-sonnet-4-5-20250929" -> "2025-09-29").
 * @param apiId The Claude API ID
 * @returns Release date in YYYY-MM-DD format or null
 */
const extractReleaseDateFromApiId = (apiId: string): string | null => {
    if (!apiId) {
        return null;
    }

    const dateMatch = apiId.match(/(\d{4})(\d{2})(\d{2})/);

    if (dateMatch) {
        const [, year, month, day] = dateMatch;

        return `${year}-${month}-${day}`;
    }

    return null;
};

/**
 * Interface for temporary model data during parsing
 */
interface ModelData {
    apiId?: string;
    contextLimit?: number;
    extendedThinking?: boolean;
    inputCost?: number;
    knowledgeCutoff?: string;
    name: string;
    outputCost?: number;
    outputLimit?: number;
    releaseDate?: string | null;
}

/**
 * Parses a markdown table row into cells.
 * @param row The markdown table row string
 * @returns Array of cell values
 */
const parseMarkdownTableRow = (row: string): string[] =>
    row
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);

/**
 * Extracts markdown tables from content.
 * @param markdownContent The markdown content to parse
 * @returns Table data with headers and rows
 */
const extractMarkdownTables = (markdownContent: string): { headers: string[]; rows: string[][] }[] => {
    const lines = markdownContent.split("\n");
    const tables: { headers: string[]; rows: string[][] }[] = [];
    let currentTable: { headers: string[]; rows: string[][] } | null = null;
    let inTable = false;

    for (const line of lines) {
        const trimmedLine = line.trim();

        /**
         * Check if this is a table row (starts with |)
         */
        if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
            /**
             * Skip separator rows (e.g., |:---|:---|)
             */
            if (trimmedLine.match(/^\|[\s:|-]+\|$/)) {
                continue;
            }

            const cells = parseMarkdownTableRow(trimmedLine);

            /**
             * If we have a "Feature" column, this is a model comparison table
             */
            if (cells[0] === "Feature" || cells[0]?.includes("Feature")) {
                /**
                 * Start a new table
                 */
                currentTable = {
                    headers: cells.slice(1),
                    rows: [],
                };
                inTable = true;
            } else if (inTable && currentTable) {
                /**
                 * Add data row to current table
                 */
                currentTable.rows.push(cells);
            }
        } else if (inTable && currentTable) {
            /**
             * End of table - save it and reset
             */
            if (currentTable.headers.length > 0 && currentTable.rows.length > 0) {
                tables.push(currentTable);
            }

            currentTable = null;
            inTable = false;
        }
    }

    /**
     * Don't forget the last table
     */
    if (inTable && currentTable && currentTable.headers.length > 0 && currentTable.rows.length > 0) {
        tables.push(currentTable);
    }

    return tables;
};

/**
 * Transforms Anthropic model data from their markdown documentation into the normalized structure.
 * The structure has models as columns and features as rows.
 * @param markdownContent The markdown content from the Anthropic models documentation page
 * @returns Array of normalized model objects
 */
export const transformAnthropicModels = (markdownContent: string): Model[] => {
    const models: Model[] = [];

    /**
     * Extract all markdown tables
     */
    const tables = extractMarkdownTables(markdownContent);

    console.log(`[Anthropic] Found ${tables.length} model comparison table(s)`);

    /**
     * Process each table
     */
    for (const table of tables) {
        const headers = table.headers.filter((header) => header && header.toLowerCase().includes("claude"));

        if (headers.length === 0) {
            continue;
        }

        console.log(`[Anthropic] Processing table with ${headers.length} models: ${headers.join(", ")}`);

        /**
         * Initialize model data objects
         */
        const modelData: Record<string, ModelData> = {};

        headers.forEach((header) => {
            modelData[header] = {
                name: header,
            };
        });

        /**
         * Process each feature row
         */
        for (const row of table.rows) {
            if (row.length < 2) {
                continue;
            }

            const featureName = row[0]?.trim() || "";
            const values = row.slice(1);

            /**
             * Map feature values to models
             */
            headers.forEach((modelName, index) => {
                if (index >= values.length || !modelData[modelName]) {
                    return;
                }

                const value = (values[index] || "").trim();

                /**
                 * Extract data based on feature type
                 */
                if (featureName.includes("Claude API ID")) {
                    /**
                     * Clean up markdown formatting (remove backticks, etc.)
                     */
                    const apiId = value.replace(/[`*]/g, "").trim();

                    modelData[modelName].apiId = apiId;
                    const releaseDate = extractReleaseDateFromApiId(apiId);

                    if (releaseDate) {
                        modelData[modelName].releaseDate = releaseDate;
                    }
                } else if (featureName.includes("Pricing")) {
                    /**
                     * Format: "$3 / input MTok" followed by "$15 / output MTok"
                     * May contain HTML br tags or newlines
                     */
                    const cleanValue = value.replace(/<br\s*\/?>/gi, "\n");
                    const inputMatch = cleanValue.match(/\$([\d.]+)\s*\/\s*input/i);
                    const outputMatch = cleanValue.match(/\$([\d.]+)\s*\/\s*output/i);

                    if (inputMatch) {
                        modelData[modelName].inputCost = Number.parseFloat(inputMatch[1]);
                    }

                    if (outputMatch) {
                        modelData[modelName].outputCost = Number.parseFloat(outputMatch[1]);
                    }
                } else if (featureName.includes("Context window")) {
                    /**
                     * Format: "200K tokens" or "200K tokens / 1M tokens (beta)"
                     * May contain markdown tooltips that need to be stripped
                     */
                    const cleanValue = value.replace(/<[^>]+>/g, "").trim();
                    const contextLimit = parseTokenLimit(cleanValue);

                    if (contextLimit) {
                        modelData[modelName].contextLimit = contextLimit;
                    }
                } else if (featureName.includes("Max output")) {
                    const cleanValue = value.replace(/<[^>]+>/g, "").trim();
                    const outputLimit = parseTokenLimit(cleanValue);

                    if (outputLimit) {
                        modelData[modelName].outputLimit = outputLimit;
                    }
                } else if (featureName.includes("Extended thinking")) {
                    modelData[modelName].extendedThinking = value.toLowerCase() === "yes";
                } else if (featureName.includes("Reliable knowledge cutoff")) {
                    /**
                     * Format: "Jan 2025" with optional superscript tags that need to be stripped
                     */
                    const cleanValue = value.replace(/<[^>]+>/g, "").trim();
                    const knowledgeCutoff = parseKnowledgeCutoff(cleanValue);

                    if (knowledgeCutoff) {
                        modelData[modelName].knowledgeCutoff = knowledgeCutoff;
                    }
                }
            });
        }

        /**
         * Convert model data to Model objects
         */
        headers.forEach((modelName) => {
            const data = modelData[modelName];

            if (!data) {
                return;
            }

            /**
             * Determine model capabilities based on name
             * All Claude models support vision
             */
            const isVision = true;

            /**
             * Determine extended thinking - check data first, then infer from model name
             */
            const hasExtendedThinking = data.extendedThinking ?? modelName.toLowerCase().includes("haiku") === false;
            const hasToolCall = true;
            const hasTemperature = true;

            const model: Model = {
                attachment: false,
                cost: {
                    input: data.inputCost ?? null,
                    inputCacheHit: null,
                    output: data.outputCost ?? null,
                },
                extendedThinking: hasExtendedThinking,
                id: kebabCase(modelName),
                knowledge: data.knowledgeCutoff ?? null,
                lastUpdated: null,
                limit: {
                    context: data.contextLimit ?? null,
                    output: data.outputLimit ?? null,
                },
                modalities: {
                    input: isVision ? ["text", "image"] : ["text"],
                    output: ["text"],
                },
                name: modelName,
                openWeights: false,
                provider: "Anthropic",
                providerDoc: "https://platform.claude.com/docs/en/about-claude/models/overview",
                providerEnv: ["ANTHROPIC_API_KEY"],
                providerModelsDevId: "anthropic",
                providerNpm: "@ai-sdk/anthropic",
                reasoning: hasExtendedThinking,
                releaseDate: data.releaseDate ?? null,
                streamingSupported: true,
                temperature: hasTemperature,
                toolCall: hasToolCall,
                vision: isVision,
            };

            models.push(model);
            console.log(`[Anthropic] Processed model: ${modelName}`);
        });
    }

    console.log(`[Anthropic] Extracted ${models.length} models from documentation`);

    return models;
};

/**
 * Fetches models from Anthropic markdown documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchAnthropicModels = async (): Promise<Model[]> => {
    console.log("[Anthropic] Fetching: https://platform.claude.com/docs/en/about-claude/models/overview.md");

    const response = await axios.get("https://platform.claude.com/docs/en/about-claude/models/overview.md");
    const markdownContent = response.data;

    const models = transformAnthropicModels(markdownContent);

    return models;
};
