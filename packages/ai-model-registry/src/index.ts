// eslint-disable-next-line import/no-extraneous-dependencies
import { kebabCase } from "@visulima/string";

import type { Model } from "./schema";
import type { ProviderName } from "./types/providers";

interface ApiJsonResponse {
    metadata: {
        description: string;
        lastUpdated: string;
        provider?: ProviderName;
        totalModels: number;
        totalProviders?: number;
        version: string;
    };
    models: Model[];
}

interface ProvidersIndex {
    metadata: {
        description: string;
        lastUpdated: string;
        totalProviders: number;
        version: string;
    };
    providers: ProviderName[];
}

let allModelsCache: Model[] | null = null;
const modelsByProviderCache = new Map<ProviderName, Model[]>();
let providersListCache: ProviderName[] | null = null;

const loadProviderModels = async (provider: ProviderName): Promise<Model[] | null> => {
    const cached = modelsByProviderCache.get(provider);

    if (cached) {
        return cached;
    }

    try {
        const {
            default: { models },
        } = (await import(`../public/${kebabCase(provider)}.json`)) as { default: ApiJsonResponse };

        modelsByProviderCache.set(provider, models);

        return models;
    } catch {
        return null;
    }
};

const loadProvidersList = async (): Promise<ProviderName[]> => {
    if (providersListCache) {
        return providersListCache;
    }

    try {
        // @ts-ignore - File is generated at build time
        const {
            default: { providers },
        } = (await import("../public/providers.json")) as { default: ProvidersIndex };

        providersListCache = providers as ProviderName[];

        return providersListCache;
    } catch {
        return [];
    }
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

    return [...providers].sort();
};

/**
 * Retrieves all AI models for a specific provider.
 * First tries to load from provider-specific JSON file, falls back to filtering all models.
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
