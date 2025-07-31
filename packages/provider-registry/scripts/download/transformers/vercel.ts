import axios from 'axios';
import type { Model } from '../../../src/schema.js';

/**
 * Raw model data from Vercel Gateway API
 */
interface VercelModel {
  id: string;
  name: string;
  created: number;
  owned_by?: string;
  author?: string;
  knowledge?: string;
  pricing?: {
    input?: string | number;
    output?: string | number;
  };
  context_window?: number;
  max_tokens?: number;
  input_modalities?: string[];
  output_modalities?: string[];
}

/**
 * Vercel Gateway API response structure
 */
interface VercelResponse {
  data: VercelModel[];
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
 * Transforms a Vercel Gateway model object into the normalized structure.
 * 
 * @param model - The raw model object from Vercel Gateway API
 * @returns The normalized model structure
 */
function transformVercelModel(model: VercelModel): Model {
  return {
    id: get(model, 'id', 'unknown'),
    name: get(model, 'name', null),
    releaseDate: get(model, 'created', null) ? new Date(model.created * 1000).toISOString().slice(0, 10) : null,
    lastUpdated: get(model, 'created', null) ? new Date(model.created * 1000).toISOString().slice(0, 10) : null,
    attachment: false,
    reasoning: false,
    temperature: true,
    knowledge: get(model, 'knowledge', null),
    toolCall: true,
    openWeights: true,
    cost: {
      input: get(model, 'pricing', {}).input ? Number(model.pricing!.input) : null,
      output: get(model, 'pricing', {}).output ? Number(model.pricing!.output) : null,
      inputCacheHit: null,
    },
    limit: {
      context: get(model, 'context_window', null),
      output: get(model, 'max_tokens', null),
    },
    modalities: {
      input: get(model, 'input_modalities', null) || ['text'],
      output: get(model, 'output_modalities', null) || ['text'],
    },
    provider: model.owned_by || model.author || (model.id && model.id.split('/')[0]) || 'unknown',
  };
}

/**
 * Fetches models from Vercel Gateway API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchVercelModels(): Promise<Model[]> {
  console.log('[VercelGateway] Fetching: https://ai-gateway.vercel.sh/v1/models');
  
  try {
    const response = await axios.get<VercelResponse>('https://ai-gateway.vercel.sh/v1/models');
    const data = response.data;
    
    const models = Array.isArray(data.data) ? data.data : [];
    const transformedModels = models.map(transformVercelModel);
    
    return transformedModels;
    
  } catch (error) {
    console.error('[VercelGateway] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchVercelModels,
  transformVercelModel,
}; 