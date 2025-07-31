import { ModelSchema } from './schema';
import type { Model } from './schema';
import { allModels } from './models-data';

/**
 * Get all available providers
 */
export function getProviders(): string[] {
  const providers = new Set<string>();
  allModels.forEach(model => {
    if (model.provider) {
      providers.add(model.provider);
    }
  });
  return Array.from(providers).sort();
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(provider: string): Model[] {
  return allModels.filter(model => model.provider === provider);
}

/**
 * Get a specific model by ID
 */
export function getModelById(id: string): Model | undefined {
  // Return undefined for empty IDs
  if (!id || id.trim() === '') {
    return undefined;
  }
  return allModels.find(model => model.id === id);
}

/**
 * Search models by various criteria
 */
export function searchModels(criteria: {
  vision?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  streaming_supported?: boolean;
  provider?: string;
  preview?: boolean;
  modalities?: {
    input?: string[];
    output?: string[];
  };
  context_min?: number;
  context_max?: number;
}): Model[] {
  return allModels.filter(model => {
    // Vision capability
    if (criteria.vision !== undefined && model.vision !== criteria.vision) {
      return false;
    }
    
    // Reasoning capability
    if (criteria.reasoning !== undefined && model.reasoning !== criteria.reasoning) {
      return false;
    }
    
    // Tool call capability
    if (criteria.tool_call !== undefined && model.tool_call !== criteria.tool_call) {
      return false;
    }
    
    // Streaming support
    if (criteria.streaming_supported !== undefined && model.streaming_supported !== criteria.streaming_supported) {
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
      const hasAllInputModalities = criteria.modalities.input.every(modality =>
        model.modalities.input.includes(modality)
      );
      if (!hasAllInputModalities) {
        return false;
      }
    }
    
    // Output modalities
    if (criteria.modalities?.output) {
      const hasAllOutputModalities = criteria.modalities.output.every(modality =>
        model.modalities.output.includes(modality)
      );
      if (!hasAllOutputModalities) {
        return false;
      }
    }
    
    // Context window range
    if (criteria.context_min && model.limit.context && model.limit.context < criteria.context_min) {
      return false;
    }
    
    if (criteria.context_max && model.limit.context && model.limit.context > criteria.context_max) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get all models (useful for advanced filtering)
 */
export function getAllModels(): Model[] {
  return [...allModels];
}

/**
 * Get unique providers with their model counts
 */
export function getProviderStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  allModels.forEach(model => {
    if (model.provider) {
      stats[model.provider] = (stats[model.provider] || 0) + 1;
    }
  });
  return stats;
}

export type { Model };
export { ModelSchema };

// Re-export icons for convenience
export * from './icons-sprite'; 