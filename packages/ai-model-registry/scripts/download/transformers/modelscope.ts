import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";
import { parseContextLength } from "../utils/index.js";

const MODELSCOPE_API_URL = "https://modelscope.cn/api/v1/dolphin/models";
const MODELSCOPE_DOCS_URL = "https://modelscope.cn/docs/model-service/API-Inference/intro";

/**
 * Check if model has vision capability based on tasks, model type, name and tags
 */
const hasVisionCapability = (tasks: any[], modelType: any[], modelName: string, tags: string[]): boolean => {
    const name = modelName.toLowerCase();
    const tagString = tags.join(" ").toLowerCase();

    // Check model name for vision indicators
    if (name.includes("vision") || name.includes("vl") || name.includes("multimodal") || name.includes("image")) {
        return true;
    }

    // Check tags for vision indicators
    if (tagString.includes("vision") || tagString.includes("multimodal") || tagString.includes("image")) {
        return true;
    }

    // Check model type for vision indicators
    if (modelType && Array.isArray(modelType)) {
        for (const type of modelType) {
            if (type.toLowerCase().includes("vl") || type.toLowerCase().includes("vision")) {
                return true;
            }
        }
    }

    // Check tasks for vision-related tasks
    if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
            const taskName = task.Name?.toLowerCase() || "";

            if (taskName.includes("image") || taskName.includes("vision") || taskName.includes("multimodal")) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Check if model has tool calling capability
 */
const hasToolCallCapability = (tasks: any[], modelType: any[], modelName: string, tags: string[]): boolean => {
    const name = modelName.toLowerCase();
    const tagString = tags.join(" ").toLowerCase();

    // Check model name for tool indicators
    if (name.includes("tool") || name.includes("function") || name.includes("api")) {
        return true;
    }

    // Check tags for tool indicators
    if (tagString.includes("tool") || tagString.includes("function") || tagString.includes("api")) {
        return true;
    }

    // Check tasks for tool-related tasks
    if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
            const taskName = task.Name?.toLowerCase() || "";

            if (taskName.includes("tool") || taskName.includes("function") || taskName.includes("api")) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Check if model has reasoning capability
 */
const hasReasoningCapability = (tasks: any[], modelType: any[], modelName: string, tags: string[]): boolean => {
    const name = modelName.toLowerCase();
    const tagString = tags.join(" ").toLowerCase();

    // Check model name for reasoning indicators
    if (name.includes("reasoning") || name.includes("thinking") || name.includes("logic")) {
        return true;
    }

    // Check tags for reasoning indicators
    if (tagString.includes("reasoning") || tagString.includes("thinking") || tagString.includes("logic")) {
        return true;
    }

    // Check tasks for reasoning-related tasks
    if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
            const taskName = task.Name?.toLowerCase() || "";

            if (taskName.includes("reasoning") || taskName.includes("thinking") || taskName.includes("logic")) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Check if model has extended thinking capability
 */
const hasExtendedThinkingCapability = (tasks: any[], modelType: any[], modelName: string, tags: string[]): boolean => {
    const name = modelName.toLowerCase();
    const tagString = tags.join(" ").toLowerCase();

    // Check model name for extended thinking indicators
    if (name.includes("thinking") || name.includes("extended") || name.includes("chain-of-thought")) {
        return true;
    }

    // Check tags for extended thinking indicators
    if (tagString.includes("thinking") || tagString.includes("extended") || tagString.includes("chain-of-thought")) {
        return true;
    }

    return false;
};

/**
 * Check if model has knowledge capability
 */
const hasKnowledgeCapability = (tasks: any[], modelType: any[], modelName: string, tags: string[]): boolean => {
    const name = modelName.toLowerCase();
    const tagString = tags.join(" ").toLowerCase();

    // Check model name for knowledge indicators
    if (name.includes("knowledge") || name.includes("rag") || name.includes("retrieval")) {
        return true;
    }

    // Check tags for knowledge indicators
    if (tagString.includes("knowledge") || tagString.includes("rag") || tagString.includes("retrieval")) {
        return true;
    }

    return false;
};

/**
 * Check if model has attachment capability
 */
const hasAttachmentCapability = (tasks: any[], modelType: any[], modelName: string, tags: string[]): boolean => {
    const name = modelName.toLowerCase();
    const tagString = tags.join(" ").toLowerCase();

    // Check model name for attachment indicators
    if (name.includes("attachment") || name.includes("file") || name.includes("document")) {
        return true;
    }

    // Check tags for attachment indicators
    if (tagString.includes("attachment") || tagString.includes("file") || tagString.includes("document")) {
        return true;
    }

    return false;
};

/**
 * Determine if model has open weights based on license
 */
const isOpenWeights = (license: string): boolean => {
    if (!license) {
        return false;
    }

    const openLicenses = [
        "apache-2.0",
        "apache license 2.0",
        "mit",
        "mit license",
        "bsd-3-clause",
        "bsd-2-clause",
        "gpl-3.0",
        "gpl-2.0",
        "agpl-3.0",
        "cc-by-4.0",
        "cc-by-sa-4.0",
        "openrail",
        "openrail++",
        "creativeml-openrail-m",
        "bigcode-openrail-m",
        "bigscience-openrail-m",
        "bigscience-bloom-rail-1.0",
        "llama2",
        "llama3",
        "llama3.1",
        "llama3.2",
        "llama3.3",
        "gemma",
        "gemma2",
        "gemma3",
    ];

    return openLicenses.some((openLicense) => license.toLowerCase().includes(openLicense.toLowerCase()));
};

/**
 * Determine input modalities based on tasks, model type, model name and tags
 */
function getInputModalities(tasks: any[], modelType: any[], modelName: string, tags: string[]): string[] {
    const name = modelName.toLowerCase();
    const tagString = tags.join(" ").toLowerCase();

    // Check model name for vision indicators
    if (name.includes("vision") || name.includes("vl") || name.includes("multimodal") || name.includes("image")) {
        return ["text", "image"];
    }

    // Check tags for vision indicators
    if (tagString.includes("vision") || tagString.includes("multimodal") || tagString.includes("image")) {
        return ["text", "image"];
    }

    // Check model type for vision indicators
    if (modelType && Array.isArray(modelType)) {
        for (const type of modelType) {
            if (type.toLowerCase().includes("vl") || type.toLowerCase().includes("vision")) {
                return ["text", "image"];
            }
        }
    }

    // Check tasks for vision-related tasks
    if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
            const taskName = task.Name?.toLowerCase() || "";

            if (taskName.includes("image") || taskName.includes("vision") || taskName.includes("multimodal")) {
                return ["text", "image"];
            }
        }
    }

    return ["text"];
}

/**
 * Determine output modalities based on tasks, model type, model name and tags
 */
const getOutputModalities = (tasks: any[], modelType: any[], modelName: string, tags: string[]): string[] => {
    const name = modelName.toLowerCase();
    const tagString = tags.join(" ").toLowerCase();

    // Check for image generation
    if (name.includes("image-gen") || name.includes("text-to-image") || name.includes("diffusion")) {
        return ["image"];
    }

    // Check tags for image generation
    if (tagString.includes("text-to-image") || tagString.includes("image-generation") || tagString.includes("diffusion")) {
        return ["image"];
    }

    // Check tasks for image generation
    if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
            const taskName = task.Name?.toLowerCase() || "";

            if (taskName.includes("text-to-image") || taskName.includes("image-generation")) {
                return ["image"];
            }
        }
    }

    return ["text"];
};

/**
 * Scrapes ModelScope documentation for model information.
 */
const scrapeModelScopeDocs = async (): Promise<Model[]> => {
    try {
        const response = await axios.get(MODELSCOPE_DOCS_URL);
        const $ = load(response.data);

        const models: Model[] = [];

        // Look for model tables or lists in the documentation
        $("table, .model-list, .models-table").each((index, element) => {
            const tableText = $(element).text().toLowerCase();

            // Check if this table contains model information
            if (tableText.includes("model") || tableText.includes("modelscope") || tableText.includes("qwen") || tableText.includes("chatglm")) {
                console.log(`[ModelScope] Found potential model table ${index + 1}`);

                $(element)
                    .find("tr, .model-item")
                    .each((_, row) => {
                        const cells = $(row)
                            .find("td, .model-cell")
                            .map((_, td) => $(td).text().trim())
                            .get();

                        if (cells.length >= 2 && cells[0] && !cells[0].includes("model")) {
                            const modelName = cells[0];

                            console.log(`[ModelScope] Found model: ${modelName}`);

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
                                    input: modelName.toLowerCase().includes("vl") || modelName.toLowerCase().includes("vision") ? ["text", "image"] : ["text"],
                                    output: ["text"],
                                },
                                name: modelName,
                                openWeights: true, // ModelScope models are typically open source
                                provider: "ModelScope",
                                providerDoc: MODELSCOPE_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["MODELSCOPE_API_KEY"],
                                providerModelsDevId: "modelscope",
                                providerNpm: "@ai-sdk/openai-compatible",
                                reasoning: false,
                                releaseDate: null,
                                streamingSupported: true,
                                temperature: true,
                                toolCall: false,
                                vision: modelName.toLowerCase().includes("vl") || modelName.toLowerCase().includes("vision"),
                            };

                            models.push(model);
                        }
                    });
            }
        });

        // If no tables found, try to extract from text content
        if (models.length === 0) {
            const bodyText = $("body").text();
            const modelMatches = bodyText.match(/([\w\-]+(?:modelscope|qwen|chatglm|baichuan|yi)[\w\-]*)/gi);

            if (modelMatches) {
                console.log(`[ModelScope] Found ${modelMatches.length} potential models in text`);

                for (const match of modelMatches.slice(0, 30)) {
                    // Limit to first 30 matches
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
                                input: modelName.toLowerCase().includes("vl") || modelName.toLowerCase().includes("vision") ? ["text", "image"] : ["text"],
                                output: ["text"],
                            },
                            name: modelName,
                            openWeights: true, // ModelScope models are typically open source
                            provider: "ModelScope",
                            providerDoc: MODELSCOPE_DOCS_URL,
                            // Provider metadata
                            providerEnv: ["MODELSCOPE_API_KEY"],
                            providerModelsDevId: "modelscope",
                            providerNpm: "@ai-sdk/openai-compatible",
                            reasoning: false,
                            releaseDate: null,
                            streamingSupported: true,
                            temperature: true,
                            toolCall: false,
                            vision: modelName.toLowerCase().includes("vl") || modelName.toLowerCase().includes("vision"),
                        };

                        models.push(model);
                    }
                }
            }
        }

        console.log(`[ModelScope] Scraped ${models.length} models from documentation`);

        return models;
    } catch (error) {
        console.error("[ModelScope] Error scraping documentation:", error instanceof Error ? error.message : String(error));

        return [];
    }
};

/**
 * Transforms ModelScope model data into the normalized structure.
 * @param rawData Raw data from ModelScope API
 * @returns Array of normalized model objects
 */
export const transformModelScopeModels = (rawData: any): Model[] => {
    const models: Model[] = [];

    // This function is kept for interface compatibility but the main logic is in fetchModelScopeModels
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
                id: kebabCase(modelData.id || modelData.name),
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
                openWeights: modelData.open_weights || true, // ModelScope models are typically open source
                provider: "ModelScope",
                providerDoc: MODELSCOPE_DOCS_URL,
                // Provider metadata
                providerEnv: ["MODELSCOPE_API_KEY"],
                providerModelsDevId: "modelscope",
                providerNpm: "@ai-sdk/openai-compatible",
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
 * Fetches ModelScope models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchModelScopeModels = async (): Promise<Model[]> => {
    console.log("[ModelScope] Fetching models from API and documentation...");

    try {
        const models: Model[] = [];

        // Try to fetch from their API first
        try {
            console.log("[ModelScope] Attempting to fetch from API:", MODELSCOPE_API_URL);

            // Fetch multiple pages to get more models
            const pageSize = 100;
            const maxPages = 10; // Limit to first 1000 models to avoid overwhelming the system

            for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
                console.log(`[ModelScope] Fetching page ${pageNumber}/${maxPages}...`);

                const apiResponse = await axios.put(
                    MODELSCOPE_API_URL,
                    {
                        Criterion: [],
                        PageNumber: pageNumber,
                        PageSize: pageSize,
                        SingleCriterion: [],
                        SortBy: "Default",
                        Target: "",
                    },
                    {
                        headers: {
                            Accept: "application/json, text/plain, */*",
                            "Accept-Language": "en-US,en;q=0.9",
                            "bx-v": "2.5.31",
                            "Content-Type": "application/json",
                            DNT: "1",
                            Origin: "https://modelscope.cn",
                            Referer: "https://modelscope.cn/models?page=1&sort=default&tabKey=task",
                            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
                            "x-modelscope-accept-language": "en_US",
                            "X-Modelscope-Trace-Id": "ea734432-7fe1-4701-8304-71a241954f90",
                        },
                    },
                );

                // Parse the response structure: Data.Model.Models
                if (apiResponse.data && apiResponse.data.Data && apiResponse.data.Data.Model && Array.isArray(apiResponse.data.Data.Model.Models)) {
                    const pageModels = apiResponse.data.Data.Model.Models;

                    console.log(`[ModelScope] Found ${pageModels.length} models on page ${pageNumber}`);

                    if (pageModels.length === 0) {
                        console.log(`[ModelScope] No more models found on page ${pageNumber}, stopping pagination`);
                        break;
                    }

                    for (const modelData of pageModels) {
                        // Extract model information from the API response
                        const modelName = modelData.Name || modelData.ModelName || modelData.Id;
                        const modelId = modelData.Id || modelData.Name;

                        if (modelName && modelId) {
                            console.log(`[ModelScope] Processing model: ${modelName}`);

                            // Convert timestamp to date string
                            const createdTime = modelData.CreatedTime ? new Date(modelData.CreatedTime * 1000).toISOString().split("T")[0] : null;
                            const updatedTime = modelData.LastUpdatedTime ? new Date(modelData.LastUpdatedTime * 1000).toISOString().split("T")[0] : null;

                            // Extract additional metadata for capability detection
                            const tags = modelData.Tags || [];
                            const tasks = modelData.Tasks || [];
                            const modelType = modelData.ModelType || [];

                            // Determine capabilities based on available data
                            const hasVision = hasVisionCapability(tasks, modelType, modelName, tags);
                            const hasToolCall = hasToolCallCapability(tasks, modelType, modelName, tags);
                            const hasReasoning = hasReasoningCapability(tasks, modelType, modelName, tags);
                            const hasExtendedThinking = hasExtendedThinkingCapability(tasks, modelType, modelName, tags);
                            const hasKnowledge = hasKnowledgeCapability(tasks, modelType, modelName, tags);
                            const hasAttachment = hasAttachmentCapability(tasks, modelType, modelName, tags);

                            // Determine streaming support
                            const streamingSupported
                                = modelData.SupportInference === "txt2txt"
                                    || modelData.SupportInference === "txt2img"
                                    || modelData.SupportInference === "img2txt"
                                    || true; // Most models support streaming

                            const model: Model = {
                                attachment: hasAttachment,
                                cost: {
                                    input: null,
                                    inputCacheHit: null,
                                    output: null,
                                },
                                extendedThinking: hasExtendedThinking,
                                id: kebabCase(modelId),
                                knowledge: hasKnowledge ? "Available" : null,
                                lastUpdated: updatedTime,
                                limit: {
                                    context: null, // Context length not available in this API response
                                    output: null,
                                },
                                modalities: {
                                    input: getInputModalities(tasks, modelType, modelName, tags),
                                    output: getOutputModalities(tasks, modelType, modelName, tags),
                                },
                                name: modelName,
                                openWeights: isOpenWeights(modelData.License),
                                provider: "ModelScope",
                                providerDoc: MODELSCOPE_DOCS_URL,
                                // Provider metadata
                                providerEnv: ["MODELSCOPE_API_KEY"],
                                providerModelsDevId: "modelscope",
                                providerNpm: "@ai-sdk/openai-compatible",
                                reasoning: hasReasoning,
                                releaseDate: createdTime,
                                streamingSupported,
                                temperature: true, // Most models support temperature
                                toolCall: hasToolCall,
                                vision: hasVision,
                            };

                            models.push(model);
                        }
                    }

                    // Add a small delay between requests to be respectful to the API
                    if (pageNumber < maxPages) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }
                } else {
                    console.log(`[ModelScope] API response structure not as expected on page ${pageNumber}`);
                    break;
                }
            }

            console.log(`[ModelScope] Total models fetched from API: ${models.length}`);
        } catch (apiError) {
            console.log("[ModelScope] API fetch failed, falling back to documentation scraping");
            console.error("[ModelScope] API Error:", apiError instanceof Error ? apiError.message : String(apiError));
        }

        // If API didn't work or returned no models, try scraping documentation
        if (models.length === 0) {
            console.log("[ModelScope] Scraping documentation for model information");
            const docsModels = await scrapeModelScopeDocs();

            models.push(...docsModels);
        }

        console.log(`[ModelScope] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[ModelScope] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
