import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

/**
 * Cerebras model data interface
 */
interface CerebrasModelData {
    capabilities?: {
        reasoning?: boolean;
        streaming?: boolean;
        temperature?: boolean;
        toolCall?: boolean;
        vision?: boolean;
    };
    cost?: {
        input?: number | null;
        output?: number | null;
    };
    detailUrl?: string;
    id: string;
    limit?: {
        context?: number | null;
        output?: number | null;
    };
    modalities?: {
        input: string[];
        output: string[];
    };
    name: string;
}

/**
 * Parses a model name to extract the model ID
 * @param modelName The model name from the table
 * @returns The model ID
 */
const parseModelId = (modelName: string): string => {
    // Extract model ID from model name
    const lowerName = modelName.toLowerCase();

    // Handle different naming patterns
    if (lowerName.includes("llama 4 scout"))
        return "llama-4-scout-17b-16e-instruct";

    if (lowerName.includes("llama 3.1 8b"))
        return "llama3.1-8b";

    if (lowerName.includes("llama 3.3 70b"))
        return "llama-3.3-70b";

    if (lowerName.includes("qwen 3 32b"))
        return "qwen-3-32b";

    if (lowerName.includes("llama 4 maverick"))
        return "llama-4-maverick-17b-128e-instruct";

    if (lowerName.includes("qwen 3 235b instruct"))
        return "qwen-3-235b-a22b-instruct-2507";

    if (lowerName.includes("qwen 3 235b thinking"))
        return "qwen-3-235b-a22b-thinking-2507";

    if (lowerName.includes("qwen 3 480b coder"))
        return "qwen-3-coder-480b";

    if (lowerName.includes("deepseek r1 distill llama 70b"))
        return "deepseek-r1-distill-llama-70b";

    // Fallback: convert to kebab case
    return modelName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
};

/**
 * Parses parameter count from string
 * @param paramStr Parameter string like "109 billion"
 * @returns Number of parameters in billions
 */
const parseParameters = (paramStr: string): number | null => {
    const match = paramStr.match(/(\d+(?:\.\d+)?)\s*billion/i);

    return match ? parseFloat(match[1]) : null;
};

/**
 * Estimates context length based on model parameters
 * @param parameters Number of parameters in billions
 * @returns Estimated context length
 */
const estimateContextLength = (parameters: number): number => {
    // Rough estimation based on model size
    if (parameters >= 200)
        return 32768; // Large models

    if (parameters >= 100)
        return 16384; // Medium-large models

    if (parameters >= 50)
        return 8192; // Medium models

    return 4096; // Small models
};

/**
 * Fetches model details from a model's detail page
 * @param detailUrl The URL to the model detail page
 * @returns Promise that resolves to model details
 */
const fetchModelDetails = async (detailUrl: string): Promise<any> => {
    try {
        const response = await axios.get(detailUrl);
        const $ = load(response.data);

        const details: any = {};

        // Extract capabilities from the page content
        const pageText = $.text().toLowerCase();

        details.vision = pageText.includes("vision") || pageText.includes("image");
        details.reasoning = pageText.includes("reasoning") || pageText.includes("thinking");
        details.toolCall = pageText.includes("tool") || pageText.includes("function");
        details.streaming = true; // All Cerebras models support streaming
        details.temperature = true; // All Cerebras models support temperature

        // Extract pricing information from the page content
        const fullText = $.text();

        // Look for pricing patterns in the JavaScript data with escaped quotes
        const pricingMatch = fullText.match(/inputPrice:\s*\\"\$(\d+(?:\.\d*)?)\s*\/\s*M\s*tokens\\"/);

        if (pricingMatch) {
            details.inputCost = parseFloat(pricingMatch[1]);
        }

        const outputPricingMatch = fullText.match(/outputPrice:\s*\\"\$(\d+(?:\.\d*)?)\s*\/\s*M\s*tokens\\"/);

        if (outputPricingMatch) {
            details.outputCost = parseFloat(outputPricingMatch[1]);
        }

        // Try alternative patterns for input pricing
        if (!details.inputCost) {
            const inputMatch2 = fullText.match(/inputPrice:\s*\\"\$(\d+\.?\d*)/);

            if (inputMatch2) {
                details.inputCost = parseFloat(inputMatch2[1]);
            }
        }

        // Try alternative patterns for output pricing
        if (!details.outputCost) {
            const outputMatch2 = fullText.match(/outputPrice:\s*\\"\$(\d+\.?\d*)/);

            if (outputMatch2) {
                details.outputCost = parseFloat(outputMatch2[1]);
            }
        }

        // Alternative: Look for pricing in the page content with different patterns
        if (!details.inputCost) {
            const inputMatch = fullText.match(/\$(\d+(?:\.\d*)?)\s*\/\s*M\s*tokens?\s*input/i);

            if (inputMatch) {
                details.inputCost = parseFloat(inputMatch[1]);
            }
        }

        if (!details.outputCost) {
            const outputMatch = fullText.match(/\$(\d+(?:\.\d*)?)\s*\/\s*M\s*tokens?\s*output/i);

            if (outputMatch) {
                details.outputCost = parseFloat(outputMatch[1]);
            }
        }

        return details;
    } catch (error) {
        console.warn(`[Cerebras] Error fetching model details from ${detailUrl}:`, error instanceof Error ? error.message : String(error));

        return {
            reasoning: false,
            streaming: true,
            temperature: true,
            toolCall: false,
            vision: false,
        };
    }
};

/**
 * Transforms Cerebras model data into the normalized structure.
 * @param modelsData Array of Cerebras model data
 * @returns Array of normalized model objects
 */
export const transformCerebrasModels = (modelsData: CerebrasModelData[]): Model[] => {
    const models: Model[] = [];

    for (const modelData of modelsData) {
        const model: Model = {
            attachment: false,
            cost: {
                input: modelData.cost?.input || null,
                inputCacheHit: null,
                output: modelData.cost?.output || null,
            },
            extendedThinking: modelData.capabilities?.reasoning || false,
            id: modelData.id,
            knowledge: null,
            lastUpdated: null,
            limit: {
                context: modelData.limit?.context || null,
                output: modelData.limit?.output || null,
            },
            modalities: {
                input: modelData.modalities?.input || ["text"],
                output: modelData.modalities?.output || ["text"],
            },
            name: modelData.name,
            openWeights: false,
            provider: "Cerebras",
            providerDoc: "https://inference-docs.cerebras.ai/models/overview",
            providerEnv: ["CEREBRAS_API_KEY"],
            providerId: "cerebras",
            providerNpm: "@ai-sdk/cerebras",
            reasoning: modelData.capabilities?.reasoning || false,
            releaseDate: null,
            streamingSupported: modelData.capabilities?.streaming ?? true,
            temperature: modelData.capabilities?.temperature ?? true,
            toolCall: modelData.capabilities?.toolCall || false,
            vision: modelData.capabilities?.vision || false,
        };

        models.push(model);
    }

    return models;
};

/**
 * Fetches Cerebras models from their documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchCerebrasModels = async (): Promise<Model[]> => {
    console.log("[Cerebras] Fetching models from: https://inference-docs.cerebras.ai/models/overview");

    try {
        const response = await axios.get("https://inference-docs.cerebras.ai/models/overview");
        const $ = load(response.data);
        const models: CerebrasModelData[] = [];

        // Find all tables that contain model information
        $("table").each((tableIndex, table) => {
            const tableText = $(table).text();

            // Look for tables that contain model information
            if (tableText.includes("Model Name") || tableText.includes("Model ID") || tableText.includes("Parameters")) {
                console.log(`[Cerebras] Processing table ${tableIndex + 1}`);

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
                        const modelId = cells[1] || parseModelId(modelName);
                        const parameters = cells[2] ? parseParameters(cells[2]) : null;

                        // Find the detail page link
                        const detailLink = $(row).find("a").attr("href");
                        let detailUrl = null;

                        if (detailLink) {
                            detailUrl = detailLink.startsWith("http") ? detailLink : `https://inference-docs.cerebras.ai${detailLink}`;
                        }

                        console.log(`[Cerebras] Found model: ${modelName} (${modelId}) - ${detailUrl}`);

                        const modelData: CerebrasModelData = {
                            capabilities: {
                                reasoning: false,
                                streaming: true,
                                temperature: true,
                                toolCall: false,
                                vision: false,
                            },
                            cost: {
                                input: null,
                                output: null,
                            },
                            id: modelId,
                            limit: {
                                context: parameters ? estimateContextLength(parameters) : null,
                                output: null,
                            },
                            modalities: {
                                input: ["text"],
                                output: ["text"],
                            },
                            name: modelName,
                        };

                        models.push(modelData);

                        // Store detail URL for later processing
                        if (detailUrl) {
                            modelData.detailUrl = detailUrl;
                        }
                    });
            }
        });

        // Process model details asynchronously
        const detailPromises = models
            .filter((model) => model.detailUrl)
            .map(async (model) => {
                try {
                    const details = await fetchModelDetails(model.detailUrl!);

                    model.capabilities = {
                        ...model.capabilities,
                        ...details,
                    };

                    // Update pricing if found
                    if (details.inputCost !== undefined) {
                        model.cost!.input = details.inputCost;
                    }

                    if (details.outputCost !== undefined) {
                        model.cost!.output = details.outputCost;
                    }

                    console.log(`[Cerebras] Updated ${model.name} with pricing: $${details.inputCost}/M input, $${details.outputCost}/M output`);
                } catch (error) {
                    console.warn(`[Cerebras] Error fetching details for ${model.name}:`, error instanceof Error ? error.message : String(error));
                }
            });

        // Wait for all detail fetching to complete
        await Promise.all(detailPromises);

        // If no models found with table approach, use hardcoded data as fallback
        if (models.length === 0) {
            console.log("[Cerebras] No models found in tables, using hardcoded data");

            const hardcodedModels: CerebrasModelData[] = [
                {
                    capabilities: {
                        reasoning: false,
                        streaming: true,
                        temperature: true,
                        toolCall: false,
                        vision: false,
                    },
                    cost: {
                        input: null,
                        output: null,
                    },
                    id: "llama-4-scout-17b-16e-instruct",
                    limit: {
                        context: 16384,
                        output: null,
                    },
                    modalities: {
                        input: ["text"],
                        output: ["text"],
                    },
                    name: "Llama 4 Scout",
                },
                {
                    capabilities: {
                        reasoning: false,
                        streaming: true,
                        temperature: true,
                        toolCall: false,
                        vision: false,
                    },
                    cost: {
                        input: null,
                        output: null,
                    },
                    id: "llama3.1-8b",
                    limit: {
                        context: 8192,
                        output: null,
                    },
                    modalities: {
                        input: ["text"],
                        output: ["text"],
                    },
                    name: "Llama 3.1 8B",
                },
                {
                    capabilities: {
                        reasoning: false,
                        streaming: true,
                        temperature: true,
                        toolCall: false,
                        vision: false,
                    },
                    cost: {
                        input: null,
                        output: null,
                    },
                    id: "llama-3.3-70b",
                    limit: {
                        context: 16384,
                        output: null,
                    },
                    modalities: {
                        input: ["text"],
                        output: ["text"],
                    },
                    name: "Llama 3.3 70B",
                },
                {
                    capabilities: {
                        reasoning: false,
                        streaming: true,
                        temperature: true,
                        toolCall: false,
                        vision: false,
                    },
                    cost: {
                        input: null,
                        output: null,
                    },
                    id: "qwen-3-32b",
                    limit: {
                        context: 8192,
                        output: null,
                    },
                    modalities: {
                        input: ["text"],
                        output: ["text"],
                    },
                    name: "Qwen 3 32B",
                },
            ];

            models.push(...hardcodedModels);
        }

        const transformedModels = transformCerebrasModels(models);

        console.log(`[Cerebras] Successfully transformed ${transformedModels.length} models`);

        return transformedModels;
    } catch (error) {
        console.error("[Cerebras] Error fetching models:", error instanceof Error ? error.message : String(error));

        // Return hardcoded models as fallback
        const fallbackModels: CerebrasModelData[] = [
            {
                capabilities: {
                    reasoning: false,
                    streaming: true,
                    temperature: true,
                    toolCall: false,
                    vision: false,
                },
                cost: {
                    input: null,
                    output: null,
                },
                id: "llama-4-scout-17b-16e-instruct",
                limit: {
                    context: 16384,
                    output: null,
                },
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: "Llama 4 Scout",
            },
        ];

        const models = transformCerebrasModels(fallbackModels);

        console.log(`[Cerebras] Using fallback data: ${models.length} models`);

        return models;
    }
};
