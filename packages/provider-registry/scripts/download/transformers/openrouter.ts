import axios from 'axios';
import type { Model } from '../../../src/schema.js';

/**
 * Raw model data from OpenRouter API
 */
interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  owned_by?: string;
  author?: string;
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
  };
  context_length?: number;
}

/**
 * OpenRouter API response structure
 */
interface OpenRouterResponse {
  data: OpenRouterModel[];
}

/**
 * Safely gets a value from an object with a default fallback
 * @param obj - The object to get the value from
 * @param key - The key to look for
 * @param def - Default value if key doesn't exist or is undefined
 * @returns The value or default
 * @example
 * const value = get(someObj, 'someKey', 'default');
 */
function get<T>(obj: unknown, key: string, def: T): T {
  return (obj && typeof obj === 'object' && key in obj && obj[key as keyof typeof obj] !== undefined) 
    ? obj[key as keyof typeof obj] as T 
    : def;
}

/**
 * Transforms an OpenRouter model object (new API structure) into the normalized structure.
 * 
 * @param model - The raw model object from OpenRouter API
 * @returns The normalized model structure
 */
function transformOpenRouterModel(model: OpenRouterModel): Model {
  const topProvider = get(model, 'top_provider', {});
  const architecture = get(model, 'architecture', {});
  const pricing = get(model, 'pricing', {});

  return {
    id: get(model, 'id', 'unknown'),
    name: get(model, 'name', null),
    releaseDate: get(model, 'created', null) ? new Date(model.created * 1000).toISOString().slice(0, 10) : null,
    lastUpdated: get(model, 'created', null) ? new Date(model.created * 1000).toISOString().slice(0, 10) : null,
    attachment: false,
    reasoning: false,
    temperature: true,
    knowledge: null,
    toolCall: true,
    openWeights: true,
    cost: {
      input: pricing.prompt ? Number(pricing.prompt) : null,
      output: pricing.completion ? Number(pricing.completion) : null,
      inputCacheHit: null,
    },
    limit: {
      context: topProvider.context_length ?? model.context_length ?? null,
      output: topProvider.max_completion_tokens ?? null,
    },
    modalities: {
      input: architecture.input_modalities || ['text'],
      output: architecture.output_modalities || ['text'],
    },
    provider: model.owned_by || model.author || (model.id && model.id.split('/')[0]) || 'unknown',
  };
}

/**
 * Fetches models from OpenRouter API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchOpenRouterModels(): Promise<Model[]> {
  console.log('[OpenRouter] Fetching: https://openrouter.ai/api/v1/models');
  
  try {
    const response = await axios.get<OpenRouterResponse>('https://openrouter.ai/api/v1/models');
    const data = response.data;
    
    const models = Array.isArray(data.data) ? data.data : [];
    const transformedModels = models.map(transformOpenRouterModel);
    
    return transformedModels;
    
  } catch (error) {
    console.error('[OpenRouter] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchOpenRouterModels,
  transformOpenRouterModel,
}; 