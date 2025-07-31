import axios from 'axios';
import { kebabCase } from '@visulima/string';
import type { Model } from '../../../src/schema.js';

/**
 * Deep Infra model data from models.dev API
 */
interface DeepInfraModelData {
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
  };
  limit: {
    context: number;
    output: number;
  };
}

/**
 * Deep Infra provider data from models.dev API
 */
interface DeepInfraProviderData {
  id: string;
  env: string[];
  npm: string;
  name: string;
  doc: string;
  models: Record<string, DeepInfraModelData>;
}

/**
 * Transforms Deep Infra model data from models.dev API into the normalized structure.
 * 
 * @param providerData - The provider data from models.dev API
 * @returns Array of normalized model objects
 */
function transformDeepInfraModels(providerData: DeepInfraProviderData): Model[] {
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
        inputCacheHit: null, // Deep Infra doesn't have cache pricing in the API
      },
      limit: {
        context: modelData.limit.context,
        output: modelData.limit.output,
      },
      modalities: {
        input: inputModalities,
        output: outputModalities,
      },
      provider: 'Deep Infra',
      streamingSupported: true,
      vision: hasVision,
      extendedThinking: false, // Deep Infra models don't have extended thinking
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
 * Fetches Deep Infra models from models.dev API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchDeepInfraModels(): Promise<Model[]> {
  console.log('[Deep Infra] Fetching: https://models.dev/api.json');
  
  try {
    const response = await axios.get('https://models.dev/api.json');
    const apiData = response.data;
    
    // Extract Deep Infra provider data
    const deepInfraProviderData = apiData.deepinfra as DeepInfraProviderData;
    
    if (!deepInfraProviderData) {
      console.error('[Deep Infra] No Deep Infra provider data found in models.dev API');
      return [];
    }
    
    const models = transformDeepInfraModels(deepInfraProviderData);
    
    console.log(`[Deep Infra] Successfully transformed ${models.length} models`);
    return models;
    
  } catch (error) {
    console.error('[Deep Infra] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchDeepInfraModels,
  transformDeepInfraModels,
}; 