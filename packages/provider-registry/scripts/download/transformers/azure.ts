import axios from 'axios';
import * as cheerio from 'cheerio';
import { kebabCase } from '@visulima/string';
import type { Model } from '../../../src/schema.js';

const AZURE_DOCS_URL = 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models';

/**
 * Transforms Azure OpenAI model data from their documentation into the normalized structure.
 * 
 * @param htmlContent - The HTML content from the Azure OpenAI documentation
 * @returns Array of normalized model objects
 */
function transformAzureModels(htmlContent: string): Model[] {
  const $ = cheerio.load(htmlContent);
  const models: Model[] = [];
  
  // Look for model tables in the documentation
  $('table').each((i, table) => {
    const tableText = $(table).text().toLowerCase();
    
    // Check if this table contains model information
    if (tableText.includes('model') || tableText.includes('gpt') || tableText.includes('claude') || tableText.includes('dall-e')) {
      console.log(`[Azure OpenAI] Found potential model table ${i + 1}`);
      
      $(table).find('tbody tr').each((_, row) => {
        const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
        
        if (cells.length >= 2 && cells[0] && !cells[0].includes('model') && !cells[0].includes('name')) {
          const modelName = cells[0];
          console.log(`[Azure OpenAI] Found model: ${modelName}`);
          
          // Parse context length from the table
          const contextLength = parseContextLength(cells[1] || cells[2] || '');
          
          const model: Model = {
            id: kebabCase(modelName),
            name: modelName,
            releaseDate: null,
            lastUpdated: null,
            attachment: false,
            reasoning: false,
            temperature: true,
            toolCall: modelName.toLowerCase().includes('gpt-4') || modelName.toLowerCase().includes('claude'),
            openWeights: false,
            vision: modelName.toLowerCase().includes('vision') || modelName.toLowerCase().includes('gpt-4v'),
            extendedThinking: false,
            knowledge: null,
            cost: { 
              input: null, 
              output: null, 
              inputCacheHit: null 
            },
            limit: { 
              context: contextLength, 
              output: null 
            },
            modalities: { 
              input: modelName.toLowerCase().includes('vision') || modelName.toLowerCase().includes('gpt-4v') ? ['text', 'image'] : ['text'], 
              output: modelName.toLowerCase().includes('dall-e') ? ['image'] : ['text'] 
            },
            provider: 'Azure OpenAI',
            streamingSupported: true,
            // Provider metadata
            providerEnv: ['AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT'],
            providerNpm: '@ai-sdk/azure-openai',
            providerDoc: AZURE_DOCS_URL,
            providerModelsDevId: 'azure-openai',
          };
          models.push(model);
        }
      });
    }
  });
  
  // If no tables found, try to extract from text content
  if (models.length === 0) {
    const bodyText = $('body').text();
    const modelMatches = bodyText.match(/([a-zA-Z0-9\-_]+(?:gpt|claude|dall-e|whisper)[a-zA-Z0-9\-_]*)/gi);
    
    if (modelMatches) {
      console.log(`[Azure OpenAI] Found ${modelMatches.length} potential models in text`);
      
      for (const match of modelMatches.slice(0, 20)) { // Limit to first 20 matches
        const modelName = match.trim();
        if (modelName.length > 3 && modelName.length < 50) {
          const model: Model = {
            id: kebabCase(modelName),
            name: modelName,
            releaseDate: null,
            lastUpdated: null,
            attachment: false,
            reasoning: false,
            temperature: true,
            toolCall: modelName.toLowerCase().includes('gpt-4') || modelName.toLowerCase().includes('claude'),
            openWeights: false,
            vision: modelName.toLowerCase().includes('vision') || modelName.toLowerCase().includes('gpt-4v'),
            extendedThinking: false,
            knowledge: null,
            cost: { 
              input: null, 
              output: null, 
              inputCacheHit: null 
            },
            limit: { 
              context: null, 
              output: null 
            },
            modalities: { 
              input: modelName.toLowerCase().includes('vision') || modelName.toLowerCase().includes('gpt-4v') ? ['text', 'image'] : ['text'], 
              output: modelName.toLowerCase().includes('dall-e') ? ['image'] : ['text'] 
            },
            provider: 'Azure OpenAI',
            streamingSupported: true,
            // Provider metadata
            providerEnv: ['AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT'],
            providerNpm: '@ai-sdk/azure-openai',
            providerDoc: AZURE_DOCS_URL,
            providerModelsDevId: 'azure-openai',
          };
          models.push(model);
        }
      }
    }
  }
  
  return models;
}

/**
 * Parse context length from string (e.g., "32k" -> 32768)
 */
function parseContextLength(lengthStr: string): number | null {
  if (!lengthStr) return null;
  
  const match = lengthStr.toLowerCase().match(/(\d+)([km])?/);
  if (!match) return null;
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  if (unit === 'k') return value * 1024;
  if (unit === 'm') return value * 1024 * 1024;
  return value;
}

/**
 * Fetches models from Azure OpenAI documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchAzureModels(): Promise<Model[]> {
  console.log('[Azure OpenAI] Fetching:', AZURE_DOCS_URL);
  
  try {
    const response = await axios.get(AZURE_DOCS_URL, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Models-Bot/1.0)'
      }
    });
    const htmlContent = response.data;
    
    const models = transformAzureModels(htmlContent);
    console.log(`[Azure OpenAI] Found ${models.length} models`);
    
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