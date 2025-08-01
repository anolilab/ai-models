import { allModels } from "./models-data";
import type { Model } from "./schema";

/**
 * Retrieves all available AI model providers from the registry.
 * @returns An array of provider names sorted alphabetically.
 */
export const getProviders = (): string[] => {
    const providers = new Set<string>();

    allModels.forEach((model) => {
        if (model.provider) {
            providers.add(model.provider);
        }
    });

    return [...providers].sort();
};

/**
 * Retrieves all AI models for a specific provider.
 * @param provider The name of the provider to filter by.
 * @returns An array of models belonging to the specified provider.
 */
export const getModelsByProvider = (provider: string): Model[] => allModels.filter((model) => model.provider === provider);

/**
 * Retrieves a specific AI model by its unique identifier.
 * @param id The unique identifier of the model to retrieve.
 * @returns The model if found, undefined otherwise.
 */
export const getModelById = (id: string): Model | undefined => {
    // Return undefined for empty IDs
    if (!id || id.trim() === "") {
        return undefined;
    }

    return allModels.find((model) => model.id === id);
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
 * @returns An array of models that match the specified criteria.
 */
export const searchModels = (criteria: {
    context_max?: number;
    context_min?: number;
    modalities?: {
        input?: string[];
        output?: string[];
    };
    preview?: boolean;
    provider?: string;
    reasoning?: boolean;
    streaming_supported?: boolean;
    tool_call?: boolean;
    vision?: boolean;
}): Model[] =>
    allModels.filter((model) => {
        // Vision capability
        if (criteria.vision !== undefined && model.vision !== criteria.vision) {
            return false;
        }

        // Reasoning capability
        if (criteria.reasoning !== undefined && model.reasoning !== criteria.reasoning) {
            return false;
        }

        // Tool call capability
        if (criteria.tool_call !== undefined && model.toolCall !== criteria.tool_call) {
            return false;
        }

        // Streaming support
        if (criteria.streaming_supported !== undefined && model.streamingSupported !== criteria.streaming_supported) {
            return false;
        }

        // Provider filter
        if (criteria.provider && model.provider !== criteria.provider) {
            return false;
        }

        // Preview status
        if (criteria.preview !== undefined && model.preview !== criteria.preview) {
            return false;
        }

        // Input modalities
        if (criteria.modalities?.input) {
            const hasAllInputModalities = criteria.modalities.input.every((modality) => model.modalities.input.includes(modality));

            if (!hasAllInputModalities) {
                return false;
            }
        }

        // Output modalities
        if (criteria.modalities?.output) {
            const hasAllOutputModalities = criteria.modalities.output.every((modality) => model.modalities.output.includes(modality));

            if (!hasAllOutputModalities) {
                return false;
            }
        }

        // Context window range
        if (criteria.context_min !== undefined && (!model.limit.context || model.limit.context < criteria.context_min)) {
            return false;
        }

        if (criteria.context_max !== undefined && (!model.limit.context || model.limit.context > criteria.context_max)) {
            return false;
        }

        return true;
    });

/**
 * Retrieves all AI models from the registry for advanced filtering and processing.
 * @returns A copy of all models in the registry.
 */
export const getAllModels = (): Model[] => [...allModels];

/**
 * Retrieves statistics about AI model providers including their model counts.
 * @returns An object mapping provider names to their model counts.
 */
export const getProviderStats = (): Record<string, number> => {
    const stats: Record<string, number> = {};

    allModels.forEach((model) => {
        if (model.provider) {
            stats[model.provider] = (stats[model.provider] || 0) + 1;
        }
    });

    return stats;
};

// Re-export icons for convenience
export * from "./icons-sprite";
export { type Model, ModelSchema } from "./schema";
