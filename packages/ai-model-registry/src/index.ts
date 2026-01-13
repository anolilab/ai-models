/* eslint-disable import/no-namespace */

import * as alibabaProvider from "./providers/alibaba";
import * as amazonBedrockProvider from "./providers/amazon-bedrock";
import * as anthropicProvider from "./providers/anthropic";
import * as azureOpenAiProvider from "./providers/azure-open-ai";
import * as cerebrasProvider from "./providers/cerebras";
import * as chutesProvider from "./providers/chutes";
import * as cloudflareProvider from "./providers/cloudflare";
import * as deepInfraProvider from "./providers/deep-infra";
import * as deepSeekProvider from "./providers/deep-seek";
import * as fireworksAiProvider from "./providers/fireworks-ai";
import * as gitHubCopilotProvider from "./providers/git-hub-copilot";
import * as gitHubModelsProvider from "./providers/git-hub-models";
import * as googleProvider from "./providers/google";
import * as googlePartnerProvider from "./providers/google-partner";
import * as googleVertexProvider from "./providers/google-vertex";
import * as groqProvider from "./providers/groq";
import * as huggingFaceProvider from "./providers/hugging-face";
import * as inceptionProvider from "./providers/inception";
import * as inferenceProvider from "./providers/inference";
import * as metaProvider from "./providers/meta";
import * as mistralProvider from "./providers/mistral";
import * as modelScopeProvider from "./providers/model-scope";
import * as morphProvider from "./providers/morph";
import * as ollamaCloudProvider from "./providers/ollama-cloud";
import * as openAiProvider from "./providers/open-ai";
import * as openRouterProvider from "./providers/open-router";
import * as requestyProvider from "./providers/requesty";
import * as togetherAiProvider from "./providers/together-ai";
import * as upstageProvider from "./providers/upstage";
import * as v0Provider from "./providers/v0";
import * as veniceProvider from "./providers/venice";
import * as vercelProvider from "./providers/vercel";
import * as weightsBiasesProvider from "./providers/weights-&-biases";
import * as xaiProvider from "./providers/xai";
import type { Model } from "./schema";
import type { ProviderName } from "./types/providers";

// Map provider names to their provider modules
const providerMap = new Map<ProviderName, { getModels: () => Model[] }>([
    ["Alibaba", alibabaProvider],
    ["Amazon Bedrock", amazonBedrockProvider],
    ["Anthropic", anthropicProvider],
    ["Azure OpenAI", azureOpenAiProvider],
    ["cerebras", cerebrasProvider],
    ["chutes", chutesProvider],
    ["Cloudflare", cloudflareProvider],
    ["Deep Infra", deepInfraProvider],
    ["DeepSeek", deepSeekProvider],
    ["Fireworks AI", fireworksAiProvider],
    ["GitHub Copilot", gitHubCopilotProvider],
    ["GitHub Models", gitHubModelsProvider],
    ["Google", googleProvider],
    ["Google Partner", googlePartnerProvider],
    ["Google Vertex", googleVertexProvider],
    ["Groq", groqProvider],
    ["Hugging Face", huggingFaceProvider],
    ["inception", inceptionProvider],
    ["Inference", inferenceProvider],
    ["Meta", metaProvider],
    ["Mistral", mistralProvider],
    ["ModelScope", modelScopeProvider],
    ["Morph", morphProvider],
    ["Ollama Cloud", ollamaCloudProvider],
    ["OpenAI", openAiProvider],
    ["OpenRouter", openRouterProvider],
    ["Requesty", requestyProvider],
    ["Together AI", togetherAiProvider],
    ["Upstage", upstageProvider],
    ["V0", v0Provider],
    ["Venice", veniceProvider],
    ["Vercel", vercelProvider],
    ["Weights & Biases", weightsBiasesProvider],
    ["XAI", xaiProvider],
]);

let allModelsCache: Model[] | null = null;
const modelsByProviderCache = new Map<ProviderName, Model[]>();
let providersListCache: ProviderName[] | null = null;

const loadProviderModels = async (provider: ProviderName): Promise<Model[] | null> => {
    const cached = modelsByProviderCache.get(provider);

    if (cached) {
        return cached;
    }

    const providerModule = providerMap.get(provider);

    if (providerModule) {
        const models = providerModule.getModels();

        modelsByProviderCache.set(provider, models);

        return models;
    }

    return null;
};

const loadProvidersList = async (): Promise<ProviderName[]> => {
    if (providersListCache) {
        return providersListCache;
    }

    // Use all providers from the provider map (no dynamic imports needed)
    providersListCache = providerMap.keys().toSorted();

    return providersListCache;
};

const loadAllModels = async (): Promise<Model[]> => {
    if (allModelsCache) {
        return allModelsCache;
    }

    allModelsCache = (await Promise.all((await loadProvidersList()).map(async (provider) => await loadProviderModels(provider) ?? []))).flat();

    return allModelsCache;
};

/**
 * Retrieves all available AI model providers from the registry.
 * @returns Promise that resolves to an array of provider names sorted alphabetically.
 */
export const getProviders = async (): Promise<ProviderName[]> => {
    const providersList = await loadProvidersList();

    if (providersList.length > 0) {
        return providersList;
    }

    const providers = new Set<ProviderName>();

    (await loadAllModels()).forEach((model) => {
        if (model.provider) {
            providers.add(model.provider as ProviderName);
        }
    });

    return providers.toSorted();
};

/**
 * Retrieves all AI models for a specific provider.
 * First tries to load from provider-specific module, falls back to filtering all models.
 * @param provider The name of the provider to filter by.
 * @returns Promise that resolves to an array of models belonging to the specified provider.
 */
export const getModelsByProvider = async (provider: ProviderName): Promise<Model[]> => {
    const providerModels = await loadProviderModels(provider);

    return providerModels ?? (await loadAllModels()).filter((model) => model.provider === provider);
};

/**
 * Retrieves a specific AI model by its unique identifier.
 * @param id The unique identifier of the model to retrieve.
 * @returns Promise that resolves to the model if found, undefined otherwise.
 */
export const getModelById = async (id: string): Promise<Model | undefined> => {
    if (!id?.trim()) {
        return undefined;
    }

    return (await loadAllModels()).find((model) => model.id === id);
};

/**
 * Searches and filters AI models based on various criteria such as capabilities, provider, and context window.
 * @param criteria The search criteria to filter models by.
 * @param criteria.context_min Minimum context window size (excludes models with null/undefined context).
 * @param criteria.context_max Maximum context window size (excludes models with null/undefined context).
 * @param criteria.modalities Input/output modalities to filter by.
 * @param criteria.modalities.input Array of input modalities to filter by.
 * @param criteria.modalities.output Array of output modalities to filter by.
 * @param criteria.preview Whether to filter by preview status.
 * @param criteria.provider Provider name to filter by.
 * @param criteria.reasoning Whether to filter by reasoning capability.
 * @param criteria.streaming_supported Whether to filter by streaming support.
 * @param criteria.tool_call Whether to filter by tool calling capability.
 * @param criteria.vision Whether to filter by vision capability.
 * @returns Promise that resolves to an array of models that match the specified criteria.
 */
export const searchModels = async (criteria: {
    context_max?: number;
    context_min?: number;
    modalities?: {
        input?: string[];
        output?: string[];
    };
    preview?: boolean;
    provider?: ProviderName;
    reasoning?: boolean;
    streaming_supported?: boolean;
    tool_call?: boolean;
    vision?: boolean;
}): Promise<Model[]> => {
    const modelsToSearch = criteria.provider ? await loadProviderModels(criteria.provider) ?? await loadAllModels() : await loadAllModels();

    // eslint-disable-next-line sonarjs/cognitive-complexity
    return modelsToSearch.filter((model) => {
        if (criteria.vision !== undefined && model.vision !== criteria.vision) {
            return false;
        }

        if (criteria.reasoning !== undefined && model.reasoning !== criteria.reasoning) {
            return false;
        }

        if (criteria.tool_call !== undefined && model.toolCall !== criteria.tool_call) {
            return false;
        }

        if (criteria.streaming_supported !== undefined && model.streamingSupported !== criteria.streaming_supported) {
            return false;
        }

        if (criteria.provider && model.provider !== criteria.provider) {
            return false;
        }

        if (criteria.preview !== undefined && model.preview !== criteria.preview) {
            return false;
        }

        if (criteria.modalities?.input && !criteria.modalities.input.every((modality) => model.modalities.input.includes(modality))) {
            return false;
        }

        if (criteria.modalities?.output && !criteria.modalities.output.every((modality) => model.modalities.output.includes(modality))) {
            return false;
        }

        if (criteria.context_min !== undefined && (!model.limit.context || model.limit.context < criteria.context_min)) {
            return false;
        }

        if (criteria.context_max !== undefined && (!model.limit.context || model.limit.context > criteria.context_max)) {
            return false;
        }

        return true;
    });
};

/**
 * Retrieves all AI models from the registry for advanced filtering and processing.
 * @returns Promise that resolves to a copy of all models in the registry.
 */
export const getAllModels = async (): Promise<Model[]> => [...await loadAllModels()];

/**
 * Retrieves statistics about AI model providers including their model counts.
 * @returns Promise that resolves to an object mapping provider names to their model counts.
 */
export const getProviderStats = async (): Promise<Record<ProviderName, number>> => {
    const stats: Record<string, number> = {};

    (await loadAllModels()).forEach((model) => {
        if (model.provider) {
            stats[model.provider] = (stats[model.provider] || 0) + 1;
        }
    });

    return stats;
};
