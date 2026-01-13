import axios from "axios";

import type { Model } from "../../../src/schema.js";
import { toNumber } from "../utils/index.js";

const OLLAMA_API_URL = "https://ollama.com/api/tags";
const OLLAMA_DOCS_URL = "https://docs.ollama.com/cloud";

/**
 * Raw model data from Ollama API
 */
interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details?: {
        format?: string;
        family?: string;
        families?: string[];
        parameter_size?: string;
        quantization_level?: string;
        parent_model?: string;
    };
}

/**
 * Ollama API response structure
 */
interface OllamaResponse {
    models: OllamaModel[];
}

/**
 * Transforms an Ollama model object into the normalized structure.
 * @param model The raw model object from Ollama API
 * @returns The normalized model structure
 */
export const transformOllamaModel = (model: OllamaModel): Model => {
    // Extract model name (may include tag like "gemma3:4b")
    const modelName = model.name;
    const modelId = `ollama/${modelName}`;

    // Determine if vision is supported based on model name or details
    // Most vision models have "vision" or "vl" in the name
    const hasVision = modelName.toLowerCase().includes("vision") || modelName.toLowerCase().includes("vl") || modelName.toLowerCase().includes("multimodal");

    // Determine input modalities
    const inputModalities = hasVision ? ["text", "image"] : ["text"];

    // Try to extract context length from parameter size if available
    // This is a rough estimate - actual context lengths vary
    let contextLength: number | null = null;
    if (model.details?.parameter_size) {
        // Parameter size like "4.3B" doesn't directly give context, but we can estimate
        // Most modern models have 128k-1M context windows
        // We'll set a default based on model size
        const paramSize = model.details.parameter_size.toLowerCase();
        if (paramSize.includes("b")) {
            const sizeNum = parseFloat(paramSize);
            // Larger models typically have larger context windows
            if (sizeNum >= 100) {
                contextLength = 1_000_000; // 1M for very large models
            } else if (sizeNum >= 50) {
                contextLength = 500_000; // 500k for large models
            } else if (sizeNum >= 10) {
                contextLength = 200_000; // 200k for medium models
            } else {
                contextLength = 128_000; // 128k for smaller models
            }
        }
    }

    return {
        attachment: false,
        cost: {
            input: null,
            inputCacheHit: null,
            output: null,
        },
        extendedThinking: false,
        id: modelId,
        knowledge: null,
        lastUpdated: model.modified_at ? new Date(model.modified_at).toISOString().split("T")[0] : null,
        limit: {
            context: contextLength,
            output: null,
        },
        modalities: {
            input: inputModalities,
            output: ["text"],
        },
        name: modelName,
        openWeights: true, // Ollama typically hosts open-weight models
        provider: "Ollama Cloud",
        providerDoc: OLLAMA_DOCS_URL,
        // Provider metadata
        providerEnv: ["OLLAMA_API_KEY"],
        providerModelsDevId: "ollama",
        providerNpm: "@ai-sdk/openai-compatible",
        reasoning: false,
        releaseDate: model.modified_at ? new Date(model.modified_at).toISOString().split("T")[0] : null,
        streamingSupported: true,
        temperature: true,
        toolCall: false, // Most Ollama models don't support tool calling by default
        vision: hasVision,
    };
};

/**
 * Fetches models from Ollama API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchOllamaModels = async (): Promise<Model[]> => {
    console.log("[Ollama] Fetching models from API...");

    try {
        const response = await axios.get<OllamaResponse>(OLLAMA_API_URL, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.data || !Array.isArray(response.data.models)) {
            console.warn("[Ollama] Invalid API response structure");
            return [];
        }

        console.log(`[Ollama] Found ${response.data.models.length} models`);

        const models = response.data.models.map((model) => transformOllamaModel(model));

        return models;
    } catch (error) {
        console.error("[Ollama] Error fetching models:", error instanceof Error ? error.message : String(error));
        throw error;
    }
};
