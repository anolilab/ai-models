import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Model } from '../../../src/schema.js';

/**
 * Transforms Azure OpenAI model data from their documentation into the normalized structure.
 * This is a placeholder implementation - the actual Azure transformer is quite complex.
 * 
 * @param htmlContent - The HTML content from the Azure OpenAI documentation
 * @returns Array of normalized model objects
 */
function transformAzureModels(htmlContent: string): Model[] {
  // This is a simplified placeholder - the actual Azure transformer is very complex
  // and would need to be converted from the original JavaScript implementation
  const models: Model[] = [];
  
  // TODO: Implement the full Azure model transformation logic
  // The original JavaScript file contains extensive parsing logic for:
  // - Model sections
  // - Region availability
  // - Fine-tune models
  // - Reasoning models
  // - Pricing data
  
  return models;
}

/**
 * Fetches models from Azure OpenAI documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchAzureModels(): Promise<Model[]> {
  console.log('[Azure OpenAI] Fetching: https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models');
  
  try {
    const response = await axios.get('https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models');
    const htmlContent = response.data;
    
    const models = transformAzureModels(htmlContent);
    
    return models;
    
  } catch (error) {
    console.error('[Azure OpenAI] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchAzureModels,
  transformAzureModels,
}; 