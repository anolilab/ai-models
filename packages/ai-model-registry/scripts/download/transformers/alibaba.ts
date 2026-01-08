import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";
import { parseTokenLimit, toNumber } from "../utils/index.js";

const DEEPSEEK_DOCS_URL = "https://help.aliyun.com/zh/model-studio/deepseek-api";
const KIMI_DOCS_URL = "https://help.aliyun.com/zh/model-studio/kimi-api";

/**
 * Fetches DeepSeek models from the documentation page.
 */
const fetchDeepSeekModels = async (): Promise<Model[]> => {
    console.log(`[Alibaba] Fetching DeepSeek model list from: ${DEEPSEEK_DOCS_URL}`);

    try {
        const response = await axios.get(DEEPSEEK_DOCS_URL);
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for the model comparison table - specifically the one with model names
        $("table").each((index, table) => {
            const tableText = $(table).text();

            // Check if this table contains model information (look for deepseek-r1, deepseek-v3, etc.)
            if (tableText.includes("deepseek-r1") || tableText.includes("deepseek-v3") || tableText.includes("deepseek-r1-distill")) {
                console.log(`[Alibaba] Found DeepSeek model table ${index + 1}`);

                $(table)
                    .find("tbody tr")
                    .each((_, row) => {
                        const cells = $(row)
                            .find("td")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        // Filter for valid model rows - must have model name in first column and be a real model
                        if (cells.length >= 6 && cells[0] && isValidDeepSeekModel(cells[0])) {
                            const modelName = cleanDeepSeekModelName(cells[0]);
                            const contextLength = cells[1];
                            const maxInput = cells[2];
                            const maxOutput = cells[4];
                            const inputCost = cells[5];
                            const outputCost = cells[6];

                            console.log(`[Alibaba] Found DeepSeek model: ${modelName}`);

                            const model: Model = {
                                attachment: false,
                                cost: {
                                    input: toNumber(parseCost(inputCost)),
                                    inputCacheHit: null,
                                    output: toNumber(parseCost(outputCost)),
                                },
                                extendedThinking: modelName.includes("r1"), // DeepSeek-R1 has extended thinking
                                id: kebabCase(modelName),
                                knowledge: null,
                                lastUpdated: null,
                                limit: {
                                    context: toNumber(parseTokenLimit(contextLength)),
                                    output: toNumber(parseTokenLimit(maxOutput)),
                                },
                                modalities: { input: ["text"], output: ["text"] },
                                name: modelName,
                                openWeights: false,
                                provider: "Alibaba",
                                providerDoc: DEEPSEEK_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["ALIBABA_API_KEY"],
                                providerModelsDevId: "alibaba",
                                providerNpm: "@ai-sdk/openai-compatible",
                                reasoning: modelName.includes("r1"), // DeepSeek-R1 models support reasoning
                                releaseDate: null,
                                streamingSupported: true,
                                temperature: modelName.includes("v3"), // DeepSeek-V3 supports temperature
                                toolCall: modelName.includes("r1") || modelName.includes("v3"), // Both support tool calling
                                vision: false,
                            };

                            models.push(model);
                        }
                    });
            }
        });

        console.log(`[Alibaba] Extracted ${models.length} DeepSeek models from docs.`);

        return models;
    } catch (error) {
        console.error("[Alibaba] Error fetching DeepSeek models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};

/**
 * Fetches Kimi models from the documentation page.
 */
const fetchKimiModels = async (): Promise<Model[]> => {
    console.log(`[Alibaba] Fetching Kimi model list from: ${KIMI_DOCS_URL}`);

    try {
        const response = await axios.get(KIMI_DOCS_URL);
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for the model comparison table - specifically the one with Kimi model information
        $("table").each((index, table) => {
            const tableText = $(table).text();

            // Check if this table contains Kimi model information
            if (tableText.includes("Moonshot-Kimi-K2-Instruct")) {
                console.log(`[Alibaba] Found Kimi model table ${index + 1}`);

                $(table)
                    .find("tbody tr")
                    .each((_, row) => {
                        const cells = $(row)
                            .find("td")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        // Filter for valid model rows - must have model name in first column and be a real model
                        if (cells.length >= 3 && cells[0] && isValidKimiModel(cells[0])) {
                            const modelName = cleanKimiModelName(cells[0]);
                            const contextLength = cells[1];
                            const inputCost = cells[2];
                            const outputCost = cells[3];

                            console.log(`[Alibaba] Found Kimi model: ${modelName}`);

                            const model: Model = {
                                attachment: false,
                                cost: {
                                    input: toNumber(parseCost(inputCost)),
                                    inputCacheHit: null,
                                    output: toNumber(parseCost(outputCost)),
                                },
                                extendedThinking: false,
                                id: kebabCase(modelName),
                                knowledge: null,
                                lastUpdated: null,
                                limit: {
                                    context: toNumber(parseTokenLimit(contextLength)),
                                    output: null, // Not specified in Kimi table
                                },
                                modalities: { input: ["text"], output: ["text"] },
                                name: modelName,
                                openWeights: false,
                                provider: "Alibaba",
                                providerDoc: KIMI_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["ALIBABA_API_KEY"],
                                providerModelsDevId: "alibaba",
                                providerNpm: "@ai-sdk/openai-compatible",
                                reasoning: false, // Kimi models don't support reasoning
                                releaseDate: null,
                                streamingSupported: true,
                                temperature: true, // Most models support temperature
                                toolCall: false, // Kimi doesn't support tool calling
                                vision: false,
                            };

                            models.push(model);
                        }
                    });
            }
        });

        console.log(`[Alibaba] Extracted ${models.length} Kimi models from docs.`);

        return models;
    } catch (error) {
        console.error("[Alibaba] Error fetching Kimi models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};

const isValidDeepSeekModel = (modelName: string): boolean => {
    // Must contain deepseek and be a real model name
    const validModels = [
        "deepseek-r1",
        "deepseek-r1-0528",
        "deepseek-v3",
        "deepseek-r1-distill-qwen-1.5b",
        "deepseek-r1-distill-qwen-7b",
        "deepseek-r1-distill-qwen-14b",
        "deepseek-r1-distill-qwen-32b",
        "deepseek-r1-distill-llama-8b",
        "deepseek-r1-distill-llama-70b",
    ];

    return validModels.some((validModel) => modelName.toLowerCase().includes(validModel.toLowerCase()));
};

const cleanDeepSeekModelName = (modelName: string): string => {
    // Remove Chinese text and extract only the model identifier
    const cleanName = modelName
        .replace(/基于.*$/, "") // Remove "基于..." (based on...)
        .replace(/参数量为.*$/, "") // Remove "参数量为..." (parameter count is...)
        .replace(/满血版模型.*$/, "") // Remove "满血版模型..." (full version model...)
        .replace(/当前能力等同于.*$/, "") // Remove "当前能力等同于..." (current capability equivalent to...)
        .trim();

    // Map to standard names
    if (cleanName.includes("deepseek-r1-distill-qwen-1.5b")) {
        return "deepseek-r1-distill-qwen-1.5b";
    }

    if (cleanName.includes("deepseek-r1-0528") || cleanName.includes("deepseek-r1-685b")) {
        return "deepseek-r1-0528";
    }

    if (cleanName.includes("deepseek-v3-0324")) {
        return "deepseek-v3-0324";
    }

    return cleanName;
};

const isValidKimiModel = (modelName: string): boolean => {
    // Must contain kimi and be a real model name
    const validModels = ["Moonshot-Kimi-K2-Instruct"];

    return validModels.some((validModel) => modelName.toLowerCase().includes(validModel.toLowerCase()));
};

const cleanKimiModelName = (modelName: string): string => {
    // Map to standard names
    if (modelName.includes("Moonshot-Kimi-K2-Instruct")) {
        return "Moonshot-Kimi-K2-Instruct";
    }

    if (modelName.includes("Kimi-K2-Instruct")) {
        return "Kimi-K2-Instruct";
    }

    return modelName;
};

const parseCost = (costString: string): number | null => {
    if (!costString || costString === "限时免费体验") {
        return null;
    }

    const match = costString.match(/(\d+\.?\d*)/);

    return match ? Number.parseFloat(match[1]) : null;
};

/**
 * Fetches Alibaba models (DeepSeek and Kimi) by scraping the documentation pages.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchAlibabaModels = async (): Promise<Model[]> => {
    const models: Model[] = [];

    // Fetch DeepSeek models
    const deepseekModels = await fetchDeepSeekModels();

    models.push(...deepseekModels);

    // Fetch Kimi models
    const kimiModels = await fetchKimiModels();

    models.push(...kimiModels);

    console.log(`[Alibaba] Total models extracted: ${models.length} (${deepseekModels.length} DeepSeek + ${kimiModels.length} Kimi)`);

    return models;
};

export const transformAlibabaModels = (): Model[] =>
    // Not used in scraping version, but kept for interface compatibility
    [];
