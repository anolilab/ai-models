import axios from 'axios';
import { kebabCase } from '@visulima/string';
import type { Model } from '../../../src/schema.js';

/**
 * OpenAI model data from models.dev API
 */
interface OpenAIModelData {
  id: string;
  name: string;
  attachment: boolean;
  reasoning: boolean;
  temperature: boolean;
  tool_call: boolean;
  knowledge: string;
  release_date: string;
  last_updated: string;
  modalities: {
    input: string[];
    output: string[];
  };
  open_weights: boolean;
  cost: {
    input: number;
    output: number;
    cache_read?: number;
  };
  limit: {
    context: number;
    output: number;
  };
}

/**
 * OpenAI provider data from models.dev API
 */
interface OpenAIProviderData {
  id: string;
  env: string[];
  npm: string;
  name: string;
  doc: string;
  models: Record<string, OpenAIModelData>;
}

/**
 * Transforms OpenAI model data from models.dev API into the normalized structure.
 * 
 * @param providerData - The provider data from models.dev API
 * @returns Array of normalized model objects
 */
function transformOpenAIModels(providerData: OpenAIProviderData): Model[] {
  const models: Model[] = [];
  
  Object.values(providerData.models).forEach((modelData) => {
    // Create model ID from name using kebabCase
    const modelId = kebabCase(modelData.id);
    
    // Determine input modalities
    const inputModalities = modelData.modalities.input || ['text'];
    
    // Determine output modalities
    const outputModalities = modelData.modalities.output || ['text'];
    
    // Check for vision capability
    const hasVision = inputModalities.includes('image');
    
    models.push({
      id: modelId,
      name: modelData.name,
      releaseDate: modelData.release_date || null,
      lastUpdated: modelData.last_updated || null,
      attachment: modelData.attachment,
      reasoning: modelData.reasoning,
      temperature: modelData.temperature,
      knowledge: modelData.knowledge || null,
      toolCall: modelData.tool_call,
      openWeights: modelData.open_weights,
      cost: {
        input: modelData.cost.input,
        output: modelData.cost.output,
        inputCacheHit: modelData.cost.cache_read || null,
      },
      limit: {
        context: modelData.limit.context,
        output: modelData.limit.output,
      },
      modalities: {
        input: inputModalities,
        output: outputModalities,
      },
      provider: 'OpenAI',
      streamingSupported: true,
      vision: hasVision,
      extendedThinking: false, // OpenAI models don't have extended thinking
      // Provider metadata
      providerEnv: providerData.env,
      providerNpm: providerData.npm,
      providerDoc: providerData.doc,
      providerModelsDevId: providerData.id,
    });
  });
  
  return models;
}

/**
 * Fetches OpenAI models from models.dev API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchOpenAIModels(): Promise<Model[]> {
  console.log('[OpenAI] Fetching: https://models.dev/api.json');
  
  try {
    const response = await axios.get('https://models.dev/api.json');
    const apiData = response.data;
    
    // Extract OpenAI provider data
    const openAIProviderData = apiData.openai as OpenAIProviderData;
    
    if (!openAIProviderData) {
      console.error('[OpenAI] No OpenAI provider data found in models.dev API');
      return [];
    }
    
    const models = transformOpenAIModels(openAIProviderData);
    
    console.log(`[OpenAI] Successfully transformed ${models.length} models`);
    return models;
    
  } catch (error) {
    console.error('[OpenAI] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchOpenAIModels,
  transformOpenAIModels,
}; 