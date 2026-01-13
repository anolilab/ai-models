import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";
import { parseContextLength } from "../utils/index.js";

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
 * Fetches models from Hugging Face endpoints API.
 */
const fetchHuggingFaceEndpoints = async (): Promise<Model[]> => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
    };

    const endpoints = [
        `${HF_API_URL}?sort=downloads&direction=-1&limit=100`,
        `${HF_API_URL}?search=text-generation&sort=downloads&direction=-1&limit=100`,
        `${HF_API_URL}?search=llm&sort=downloads&direction=-1&limit=100`,
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`[Hugging Face] Trying endpoint: ${endpoint}`);
            const response = await axios.get(endpoint, {
                headers,
                timeout: 15_000,
            });

            if (response.data && Array.isArray(response.data)) {
                const models = transformHuggingFaceModels(response.data);

                console.log(`[Hugging Face] Found ${models.length} models via API`);

                return models;
            }
        } catch (endpointError) {
            console.log(`[Hugging Face] Endpoint failed: ${endpointError instanceof Error ? endpointError.message : String(endpointError)}`);
            continue;
        }
    }

    throw new Error("All Hugging Face API endpoints failed");
};

/**
 * Fetches models from Hugging Face documentation.
 */
const fetchHuggingFaceDocs = async (): Promise<Model[]> => scrapeHuggingFaceDocs();

/**
 * Scrapes HuggingFace documentation for model information.
 */
const scrapeHuggingFaceDocs = async (): Promise<Model[]> => {
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
};

/**
 * Fetches models from Hugging Face and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchHuggingFaceModels = async (): Promise<Model[]> => {
    console.log("[Hugging Face] Fetching models from multiple sources...");

    const models: Model[] = [];

    // Try to fetch from endpoints API
    try {
        const endpointModels = await fetchHuggingFaceEndpoints();

        models.push(...endpointModels);
    } catch (endpointError) {
        console.warn("[Hugging Face] Endpoints API fetch failed");
    }

    // Try to fetch from documentation
    try {
        const docsModels = await fetchHuggingFaceDocs();

        models.push(...docsModels);
    } catch (docsError) {
        console.warn("[Hugging Face] Documentation fetch failed");
    }

    console.log(`[Hugging Face] Total models found: ${models.length}`);

    return models;
};

/**
 * Transforms HuggingFace model data from their API into the normalized structure.
 * @param modelsData The raw model data from HuggingFace API
 * @returns Array of normalized model objects
 */
export const transformHuggingFaceModels = (modelsData: HuggingFaceModel[]): Model[] => {
    const models: Model[] = [];

    // Filter for popular open models
    const popularModels = modelsData
        .filter((model) => !model.private && !model.gated)
        .filter((model) => {
            const tags = model.tags || [];

            return tags.some(
                (tag) =>
                    tag.includes("text-generation") ||
                    tag.includes("text2text-generation") ||
                    tag.includes("conversational") ||
                    tag.includes("chat") ||
                    tag.includes("llm"),
            );
        })
        .slice(0, 50); // Limit to top 50 models

    for (const modelData of popularModels) {
        const modelName = modelData.name || modelData.id;
        const tags = modelData.tags || [];

        // Determine capabilities based on tags
        const hasVision = tags.some((tag) => tag.includes("vision") || tag.includes("image"));
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
};
