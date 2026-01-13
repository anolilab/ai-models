import { kebabCase } from "@visulima/string";
import axios from "axios";

import type { Model } from "../../../src/schema.js";

/* eslint-disable no-secrets/no-secrets */
const FIREWORKS_SANITY_API_URL =
    "https://pv37i0yn.apicdn.sanity.io/v2024-07-09/data/query/production?query=*%5B_type+%3D%3D+%22model%22%5D%5BmodelName+match+%24search+%7C%7C+count%28modelType%5B_type+%3D%3D+%22reference%22+%26%26+%40-%3Ename+match+%24search%5D%29+%3E+0%5D%5Bpublic+%3D%3D+true%5D+%7B+_id%2C+modelName%2C+new%2C+%22provider%22%3A+provider-%3E+%7B+%22company%22%3A+company-%3E+%7B+name%2C+%22lightLogo%22%3A+lightLogo+%7B+%22asset%22%3A+asset-%3E%2C+alt%2C+caption+%7D%2C+%22darkLogo%22%3A+darkLogo+%7B+%22asset%22%3A+asset-%3E%2C+alt%2C+caption+%7D%2C+%22mark%22%3A+mark+%7B+%22asset%22%3A+asset-%3E%2C+alt%2C+caption+%7D+%7D+%7D%2C+%22modelType%22%3A+modelType%5B%5D-%3E+%7B+_id%2C+name%2C+iconColor%2C+icon+%7D%2C+contextLength%2C+pricingInput%2C+pricingOutput%2C+pricingUnit%2C+collapsePricing%2C+%22slug%22%3A+seo.slug.current+%7D&%24search=%22*%22&returnQuery=false&perspective=published";
/* eslint-enable no-secrets/no-secrets */
const FIREWORKS_DOCS_URL = "https://readme.fireworks.ai/";

/**
 * Sanity API response model structure
 */
interface SanityModel {
    _id: string;
    collapsePricing: boolean | null;
    contextLength: string | null;
    modelName: string;
    modelType: {
        _id: string;
        icon: string;
        iconColor: {
            label: string;
            value: string;
        };
        name: string;
    }[];
    new: boolean;
    pricingInput: number | null;
    pricingOutput: number | null;
    pricingUnit: string | null;
    provider: {
        company: {
            name: string;
        };
    };
    slug: string;
}

interface SanityApiResponse {
    result: SanityModel[];
}

/**
 * Determines if a model has vision capabilities based on name and model type.
 */
const hasVisionCapability = (modelName: string, modelTypes: SanityModel["modelType"]): boolean => {
    const nameLower = modelName.toLowerCase();

    if (nameLower.includes("vision") || nameLower.includes("vl") || nameLower.includes("multimodal") || nameLower.includes("image")) {
        return true;
    }

    return modelTypes.some((type) => {
        const typeName = type.name.toLowerCase();

        return typeName.includes("vision") || typeName.includes("multimodal") || typeName.includes("image");
    });
};

/**
 * Converts pricing from Sanity API format to our cost format.
 * Pricing values are per unit (million tokens by default).
 */
const convertPricing = (
    pricingInput: number | null,
    pricingOutput: number | null,
    _pricingUnit: string | null,
): { input: number | null; inputCacheHit: number | null; output: number | null } => {
    let input: number | null = null;
    let output: number | null = null;
    const inputCacheHit: number | null = null;

    if (pricingInput !== null && !Number.isNaN(pricingInput)) {
        input = pricingInput;
    }

    if (pricingOutput !== null && !Number.isNaN(pricingOutput)) {
        output = pricingOutput;
    }

    return { input, inputCacheHit, output };
};

/**
 * Transforms a single Sanity model into our Model format.
 */
const transformSingleModel = (modelData: SanityModel): Model | null => {
    /* Filter for Fireworks AI models - check if slug starts with "fireworks/" */
    if (!modelData.slug || !modelData.slug.startsWith("fireworks/")) {
        return null;
    }

    if (!modelData.modelName) {
        return null;
    }

    const { contextLength: contextLengthStr, modelName, modelType, pricingInput, pricingOutput, pricingUnit, slug } = modelData;
    const isVision = hasVisionCapability(modelName, modelType);
    const isThinking = modelName.toLowerCase().includes("thinking");

    /* Convert context length from string to number */
    let contextLength: number | null = null;

    if (contextLengthStr) {
        const parsed = Number.parseInt(contextLengthStr, 10);

        contextLength = Number.isNaN(parsed) ? null : parsed;
    }

    /* Convert pricing */
    const cost = convertPricing(pricingInput, pricingOutput, pricingUnit);

    /* Generate model ID from slug or model name */
    const modelId =
        slug.replace("fireworks/", "accounts/fireworks/models/") || kebabCase(modelName).replace("accounts-fireworks-models-", "accounts/fireworks/models/");

    return {
        attachment: false,
        cost,
        extendedThinking: isThinking,
        id: modelId,
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
        /* Provider metadata */
        providerEnv: ["FIREWORKS_API_KEY"],
        providerModelsDevId: "fireworks-ai",
        providerNpm: "@ai-sdk/fireworks",
        reasoning: isThinking,
        releaseDate: null,
        streamingSupported: true,
        temperature: true,
        toolCall: false,
        vision: isVision,
    };
};

/**
 * Transforms Fireworks AI model data from Sanity API into the normalized structure.
 * @param rawData Raw data from Sanity API
 * @returns Array of normalized model objects
 */
export const transformFireworksAIModels = (rawData: SanityApiResponse | unknown): Model[] => {
    const models: Model[] = [];

    if (!rawData || typeof rawData !== "object" || !("result" in rawData) || !Array.isArray(rawData.result)) {
        return models;
    }

    const apiResponse = rawData as SanityApiResponse;

    for (const modelData of apiResponse.result) {
        const model = transformSingleModel(modelData);

        if (model) {
            models.push(model);
        }
    }

    return models;
};

/**
 * Fetches Fireworks AI models from Sanity API.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchFireworksAIModels = async (): Promise<Model[]> => {
    console.log("[Fireworks AI] Fetching models from Sanity API...");

    try {
        console.log("[Fireworks AI] Fetching from:", FIREWORKS_SANITY_API_URL);
        const response = await axios.get<SanityApiResponse>(FIREWORKS_SANITY_API_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Model-Registry/1.0)",
            },
            timeout: 30_000,
        });

        if (!response.data || !response.data.result) {
            console.error("[Fireworks AI] Invalid API response structure");

            return [];
        }

        const models = transformFireworksAIModels(response.data);

        console.log(`[Fireworks AI] Total models found: ${models.length}`);

        return models;
    } catch (error) {
        console.error("[Fireworks AI] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
