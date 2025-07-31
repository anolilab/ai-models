import axios from 'axios';
import type { Model } from '../../../src/schema.js';

/**
 * Raw model data from HuggingFace API
 */
interface HuggingFaceModel {
  id: string;
  name?: string;
  author?: string;
  created?: string;
  lastModified?: string;
  tags?: string[];
  cardData?: {
    model_type?: string;
    license?: string;
    language?: string[];
  };
  siblings?: Array<{
    rfilename: string;
  }>;
  private?: boolean;
  gated?: boolean;
}

/**
 * HuggingFace API response structure
 */
interface HuggingFaceResponse {
  models: HuggingFaceModel[];
}

/**
 * Transforms HuggingFace model data from their API into the normalized structure.
 * This is a placeholder implementation - the actual HuggingFace transformer is quite complex.
 * 
 * @param modelsData - The raw model data from HuggingFace API
 * @returns Array of normalized model objects
 */
function transformHuggingFaceModels(modelsData: HuggingFaceModel[]): Model[] {
  // This is a simplified placeholder - the actual HuggingFace transformer is very complex
  // and would need to be converted from the original JavaScript implementation
  const models: Model[] = [];
  
  // TODO: Implement the full HuggingFace model transformation logic
  // The original JavaScript file contains extensive parsing logic for:
  // - Model normalization by provider
  // - Provider-specific model creation
  // - Capability analysis
  // - Pricing extraction
  // - Open weights determination
  
  return models;
}

/**
 * Fetches models from HuggingFace API and transforms them.
 * @param apiKey - Optional HuggingFace API key for authenticated requests
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchHuggingFaceModels(apiKey?: string): Promise<Model[]> {
  console.log('[HuggingFace] Fetching models from API...');
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await axios.get<HuggingFaceResponse>('https://huggingface.co/api/models', {
      headers,
      params: {
        sort: 'downloads',
        direction: '-1',
        limit: 1000
      }
    });
    
    const models = transformHuggingFaceModels(response.data.models);
    
    return models;
    
  } catch (error) {
    console.error('[HuggingFace] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchHuggingFaceModels,
  transformHuggingFaceModels,
}; 