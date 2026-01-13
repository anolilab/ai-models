import axios from "axios";

import type { Model } from "../../../src/schema.js";
import { toNumber } from "../utils/index.js";

/**
 * Raw model data from AIHubMix API
 */
interface AIHubMixModel {
    model_id: string;
    developer_id: number;
    desc: string;
    pricing: {
        cache_read?: number;
        cache_write?: number;
        input: number;
        output: number;
    };
    types: string;
    features?: string;
    input_modalities?: string;
    max_output: number;
    context_length: number;
}

/**
 * AIHubMix API response structure
 */
interface AIHubMixResponse {
    data: AIHubMixModel[];
    message?: string;
    success?: boolean;
}

/**
 * Parses comma-separated features string into boolean flags
 */
const parseFeatures = (
    features?: string,
): {
    reasoning: boolean;
    toolCall: boolean;
    vision: boolean;
    streamingSupported: boolean;
    imageGeneration: boolean;
    videoGeneration: boolean;
} => {
    if (!features) {
        return {
            imageGeneration: false,
            reasoning: false,
            streamingSupported: true,
            toolCall: false,
            videoGeneration: false,
            vision: false,
        };
    }

    const featureList = features
        .toLowerCase()
        .split(",")
        .map((f) => f.trim());

    return {
        imageGeneration: featureList.some((f) => f.includes("image") || f.includes("generation")),
        reasoning: featureList.includes("thinking") || featureList.includes("reasoning"),
        streamingSupported: true, // Most providers support streaming
        toolCall: featureList.includes("tools") || featureList.includes("function_calling"),
        videoGeneration: featureList.some((f) => f.includes("video") || f.includes("generation")),
        vision: featureList.includes("vision") || featureList.includes("image"),
    };
};

/**
 * Parses comma-separated modalities string into array
 */
const parseModalities = (modalities?: string): string[] => {
    if (!modalities) {
        return ["text"];
    }

    return modalities.split(",").map((m) => m.trim().toLowerCase());
};

/**
 * Determines model type from types field (can be comma-separated like "llm,search")
 */
const getModelType = (
    types?: string,
): {
    imageGeneration: boolean;
    videoGeneration: boolean;
    embedding: boolean;
    rerank: boolean;
    ocr: boolean;
    tts: boolean;
    stt: boolean;
} => {
    if (!types) {
        return {
            embedding: false,
            imageGeneration: false,
            ocr: false,
            rerank: false,
            stt: false,
            tts: false,
            videoGeneration: false,
        };
    }

    // Handle comma-separated types (e.g., "llm,search")
    const typeList = types
        .toLowerCase()
        .split(",")
        .map((t) => t.trim());

    return {
        embedding: typeList.includes("embedding"),
        imageGeneration: typeList.includes("image_generation") || typeList.some((t) => t.includes("image")),
        ocr: typeList.includes("ocr"),
        rerank: typeList.includes("rerank"),
        stt: typeList.includes("stt"),
        tts: typeList.includes("tts"),
        videoGeneration: typeList.includes("video") || typeList.some((t) => t.includes("video")),
    };
};

/**
 * Transforms an AIHubMix model object into the normalized structure.
 * @param model The raw model object from AIHubMix API
 * @returns The normalized model structure
 */
export const transformAIHubMixModel = (model: AIHubMixModel): Model => {
    const features = parseFeatures(model.features);
    const modelType = getModelType(model.types);
    const inputModalities = parseModalities(model.input_modalities);

    // Determine if it's a preview model (check model_id for preview indicators)
    const isPreview = model.model_id.toLowerCase().includes("preview") || model.model_id.toLowerCase().includes("exp");

    // Determine if it's open weights (check model_id for open source indicators)
    const isOpenWeights = model.model_id.toLowerCase().includes("open") || model.model_id.toLowerCase().includes("oss");

    return {
        attachment: false,
        cost: {
            imageGeneration: modelType.imageGeneration ? toNumber(model.pricing.input) : null,
            input: toNumber(model.pricing.input),
            inputCacheHit: toNumber(model.pricing.cache_read),
            output: toNumber(model.pricing.output),
            videoGeneration: modelType.videoGeneration ? toNumber(model.pricing.input) : null,
        },
        description: model.desc && model.desc.trim() ? model.desc : undefined,
        extendedThinking: features.reasoning,
        id: model.model_id,
        imageGeneration: modelType.imageGeneration,
        knowledge: null,
        lastUpdated: null,
        limit: {
            context: model.context_length && model.context_length > 0 ? model.context_length : null,
            output: model.max_output && model.max_output > 0 ? model.max_output : null,
        },
        modalities: {
            input: inputModalities.length > 0 ? inputModalities : ["text"],
            output: modelType.videoGeneration
                ? ["video"]
                : modelType.imageGeneration
                  ? ["image"]
                  : modelType.embedding
                    ? ["embedding"]
                    : modelType.rerank
                      ? ["score"]
                      : modelType.tts
                        ? ["audio"]
                        : modelType.stt
                          ? ["text"]
                          : modelType.ocr
                            ? ["text"]
                            : ["text"],
        },
        name: model.model_id,
        openWeights: isOpenWeights,
        preview: isPreview,
        provider: "AIHubMix",
        providerDoc: "https://docs.aihubmix.com",
        providerEnv: ["AIHUBMIX_API_KEY"],
        providerNpm: "@aihubmix/ai-sdk-provider",
        reasoning: features.reasoning,
        releaseDate: null,
        streamingSupported: features.streamingSupported,
        temperature: true,
        toolCall: features.toolCall,
        vision: features.vision || inputModalities.includes("image"),
    };
};

/**
 * Fetches models from AIHubMix API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchAIHubMixModels = async (): Promise<Model[]> => {
    console.log("[AIHubMix] Fetching: https://aihubmix.com/api/v1/models");

    const response = await axios.get<AIHubMixResponse>("https://aihubmix.com/api/v1/models");
    const { data } = response.data;

    const models = Array.isArray(data) ? data : [];
    const transformedModels = models.map(transformAIHubMixModel);

    console.log(`[AIHubMix] Found ${transformedModels.length} models`);

    return transformedModels;
};
