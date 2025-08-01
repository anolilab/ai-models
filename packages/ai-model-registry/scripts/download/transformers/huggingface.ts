import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const HF_API_URL = "https://huggingface.co/api/models";
const HF_DOCS_URL = "https://huggingface.co/docs";

/**
 * Raw model data from HuggingFace API
 */
interface HuggingFaceModel {
    author?: string;
    cardData?: {
        language?: string[];
        license?: string;
        model_type?: string;
    };
    created?: string;
    gated?: boolean;
    id: string;
    lastModified?: string;
    name?: string;
    private?: boolean;
    siblings?: {
        rfilename: string;
    }[];
    tags?: string[];
}

/**
 * Fetches models from HuggingFace API and transforms them.
 * @param apiKey Optional HuggingFace API key for authenticated requests
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchHuggingFaceModels(apiKey?: string): Promise<Model[]> {
    console.log("[HuggingFace] Fetching models from API...");

    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
        };

        if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }

        // Try different API endpoints and parameters
        const endpoints = [
            `${HF_API_URL}?sort=downloads&direction=-1&limit=100`,
            `${HF_API_URL}?search=text-generation&sort=downloads&direction=-1&limit=100`,
            `${HF_API_URL}?search=llm&sort=downloads&direction=-1&limit=100`,
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`[HuggingFace] Trying endpoint: ${endpoint}`);
                const response = await axios.get(endpoint, {
                    headers,
                    timeout: 15_000,
                });

                if (response.data && Array.isArray(response.data)) {
                    const models = transformHuggingFaceModels(response.data);

                    console.log(`[HuggingFace] Found ${models.length} models via API`);

                    return models;
                }
            } catch (endpointError) {
                console.log(`[HuggingFace] Endpoint failed: ${endpointError instanceof Error ? endpointError.message : String(endpointError)}`);
                continue;
            }
        }

        console.log("[HuggingFace] All API endpoints failed, falling back to documentation scraping");

        // Fallback to documentation scraping
        try {
            const docsModels = await scrapeHuggingFaceDocs();

            if (docsModels.length > 0) {
                return docsModels;
            }
        } catch (docsError) {
            console.error("[HuggingFace] Documentation scraping also failed:", docsError instanceof Error ? docsError.message : String(docsError));
        }

        // Final fallback: return known popular models
        console.log("[HuggingFace] Using fallback with known popular models");

        return getFallbackModels();
    } catch (error) {
        console.error("[HuggingFace] All methods failed:", error instanceof Error ? error.message : String(error));

        return getFallbackModels();
    }
}

/**
 * Returns a list of known popular Hugging Face models as fallback
 */
function getFallbackModels(): Model[] {
    const popularModels = [
        "microsoft/DialoGPT-medium",
        "gpt2",
        "distilgpt2",
        "EleutherAI/gpt-neo-125M",
        "EleutherAI/gpt-neo-1.3B",
        "EleutherAI/gpt-neo-2.7B",
        "EleutherAI/gpt-j-6B",
        "microsoft/DialoGPT-large",
        "microsoft/DialoGPT-small",
        "facebook/opt-125m",
        "facebook/opt-350m",
        "facebook/opt-1.3b",
        "facebook/opt-2.7b",
        "facebook/opt-6.7b",
        "facebook/opt-13b",
        "facebook/opt-30b",
        "facebook/opt-66b",
        "bigscience/bloom-560m",
        "bigscience/bloom-1b1",
        "bigscience/bloom-1b7",
        "bigscience/bloom-3b",
        "bigscience/bloom-7b1",
        "bigscience/bloomz-560m",
        "bigscience/bloomz-1b1",
        "bigscience/bloomz-1b7",
        "bigscience/bloomz-3b",
        "bigscience/bloomz-7b1",
        "tiiuae/falcon-7b",
        "tiiuae/falcon-40b",
        "tiiuae/falcon-180b",
        "mosaicml/mpt-7b",
        "mosaicml/mpt-30b",
        "mosaicml/mpt-7b-instruct",
        "mosaicml/mpt-30b-instruct",
        "meta-llama/Llama-2-7b",
        "meta-llama/Llama-2-13b",
        "meta-llama/Llama-2-70b",
        "meta-llama/Llama-2-7b-chat",
        "meta-llama/Llama-2-13b-chat",
        "meta-llama/Llama-2-70b-chat",
        "microsoft/phi-1",
        "microsoft/phi-1_5",
        "microsoft/phi-2",
        "Qwen/Qwen-7B",
        "Qwen/Qwen-14B",
        "Qwen/Qwen-72B",
        "Qwen/Qwen-7B-Chat",
        "Qwen/Qwen-14B-Chat",
        "Qwen/Qwen-72B-Chat",
        "01-ai/Yi-6B",
        "01-ai/Yi-34B",
        "01-ai/Yi-6B-Chat",
        "01-ai/Yi-34B-Chat",
        "THUDM/chatglm2-6b",
        "THUDM/chatglm3-6b",
        "baichuan-inc/Baichuan2-7B-Base",
        "baichuan-inc/Baichuan2-13B-Base",
        "baichuan-inc/Baichuan2-7B-Chat",
        "baichuan-inc/Baichuan2-13B-Chat",
        "internlm/internlm-7b",
        "internlm/internlm-20b",
        "internlm/internlm-chat-7b",
        "internlm/internlm-chat-20b",
        "deepseek-ai/deepseek-coder-6.7b-base",
        "deepseek-ai/deepseek-coder-33b-base",
        "deepseek-ai/deepseek-coder-6.7b-instruct",
        "deepseek-ai/deepseek-coder-33b-instruct",
        "WizardLM/WizardCoder-15B-V1.0",
        "WizardLM/WizardCoder-Python-34B-V1.0",
        "Salesforce/codegen-350M-mono",
        "Salesforce/codegen-2B-mono",
        "Salesforce/codegen-6B-mono",
        "Salesforce/codegen-16B-mono",
        "microsoft/DialoGPT-medium",
        "microsoft/DialoGPT-large",
        "microsoft/DialoGPT-small",
    ];

    const models: Model[] = [];

    for (const modelId of popularModels) {
        const modelName = modelId.split("/").pop() || modelId;
        const isVision = modelId.toLowerCase().includes("vision") || modelId.toLowerCase().includes("vl");
        const isCode = modelId.toLowerCase().includes("code") || modelId.toLowerCase().includes("coder");

        const model: Model = {
            attachment: false,
            cost: {
                input: null,
                inputCacheHit: null,
                output: null,
            },
            extendedThinking: false,
            id: kebabCase(modelId),
            knowledge: null,
            lastUpdated: null,
            limit: {
                context: null,
                output: null,
            },
            modalities: {
                input: isVision ? ["text", "image"] : ["text"],
                output: ["text"],
            },
            name: modelName,
            openWeights: true,
            provider: "Hugging Face",
            providerDoc: HF_DOCS_URL,
            // Provider metadata
            providerEnv: ["HUGGINGFACE_API_KEY"],
            providerModelsDevId: "huggingface",
            providerNpm: "@ai-sdk/huggingface",
            reasoning: false,
            releaseDate: null,
            streamingSupported: true,
            temperature: true,
            toolCall: false,
            vision: isVision,
        };

        models.push(model);
    }

    console.log(`[HuggingFace] Created ${models.length} fallback models`);

    return models;
}

/**
 * Transforms HuggingFace model data from their API into the normalized structure.
 * @param modelsData The raw model data from HuggingFace API
 * @returns Array of normalized model objects
 */
function transformHuggingFaceModels(modelsData: HuggingFaceModel[]): Model[] {
    const models: Model[] = [];

    // Filter for popular open models
    const popularModels = modelsData
        .filter((model) => !model.private && !model.gated)
        .filter((model) => {
            const tags = model.tags || [];

            return tags.some(
                (tag) =>
                    tag.includes("text-generation")
                    || tag.includes("text2text-generation")
                    || tag.includes("conversational")
                    || tag.includes("chat")
                    || tag.includes("llm"),
            );
        })
        .slice(0, 50); // Limit to top 50 models

    for (const modelData of popularModels) {
        const modelName = modelData.name || modelData.id;
        const tags = modelData.tags || [];

        // Determine capabilities based on tags
        const hasVision = tags.some((tag) => tag.includes("vision") || tag.includes("image"));
        const hasCode = tags.some((tag) => tag.includes("code") || tag.includes("programming"));
        const isMultimodal = tags.some((tag) => tag.includes("multimodal"));

        const model: Model = {
            attachment: false,
            cost: {
                input: null,
                inputCacheHit: null,
                output: null,
            },
            extendedThinking: false,
            id: kebabCase(modelData.id),
            knowledge: null,
            lastUpdated: modelData.lastModified ? new Date(modelData.lastModified).toISOString() : null,
            limit: {
                context: null, // Context length varies by model
                output: null,
            },
            modalities: {
                input: hasVision || isMultimodal ? ["text", "image"] : ["text"],
                output: ["text"],
            },
            name: modelName,
            openWeights: true, // Hugging Face models are typically open weights
            provider: "Hugging Face",
            providerDoc: HF_DOCS_URL,
            // Provider metadata
            providerEnv: ["HUGGINGFACE_API_KEY"],
            providerModelsDevId: "huggingface",
            providerNpm: "@ai-sdk/huggingface",
            reasoning: false,
            releaseDate: modelData.created ? new Date(modelData.created).toISOString() : null,
            streamingSupported: true,
            temperature: true,
            toolCall: false,
            vision: hasVision || isMultimodal,
        };

        models.push(model);
    }

    return models;
}

/**
 * Scrapes HuggingFace documentation for model information.
 */
async function scrapeHuggingFaceDocs(): Promise<Model[]> {
    try {
        const response = await axios.get(HF_DOCS_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
            },
            timeout: 10_000,
        });
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for model tables or lists in the documentation
        $("table, .model-list, .models-table").each((index, element) => {
            const tableText = $(element).text().toLowerCase();

            // Check if this table contains model information
            if (tableText.includes("model") || tableText.includes("huggingface") || tableText.includes("transformers")) {
                console.log(`[HuggingFace] Found potential model table ${index + 1}`);

                $(element)
                    .find("tr, .model-item")
                    .each((_, row) => {
                        const cells = $(row)
                            .find("td, .model-cell")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        if (cells.length >= 2 && cells[0] && !cells[0].includes("model")) {
                            const modelName = cells[0];

                            console.log(`[HuggingFace] Found model: ${modelName}`);

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
                                    context: parseContextLength(cells[1] || cells[2]),
                                    output: null,
                                },
                                modalities: {
                                    input: modelName.toLowerCase().includes("vision") ? ["text", "image"] : ["text"],
                                    output: ["text"],
                                },
                                name: modelName,
                                openWeights: true,
                                provider: "Hugging Face",
                                providerDoc: HF_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["HUGGINGFACE_API_KEY"],
                                providerModelsDevId: "huggingface",
                                providerNpm: "@ai-sdk/huggingface",
                                reasoning: false,
                                releaseDate: null,
                                streamingSupported: true,
                                temperature: true,
                                toolCall: false,
                                vision: modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("vl"),
                            };

                            models.push(model);
                        }
                    });
            }
        });

        console.log(`[HuggingFace] Scraped ${models.length} models from documentation`);

        return models;
    } catch (error) {
        console.error("[HuggingFace] Error scraping documentation:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

/**
 * Parse context length from string (e.g., "32k" -> 32768)
 */
function parseContextLength(lengthString: string): number | null {
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
}

export { fetchHuggingFaceModels, transformHuggingFaceModels };
