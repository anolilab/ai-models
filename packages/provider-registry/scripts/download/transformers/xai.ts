import axios from 'axios';
import * as cheerio from 'cheerio';
import { kebabCase } from '@visulima/string';
import type { Model } from '../../../src/schema.js';

const XAI_API_URL = 'https://api.x.ai/v1/models';
const XAI_DOCS_URL = 'https://docs.x.ai/';

/**
 * Fetches XAI models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchXAIModels(): Promise<Model[]> {
  console.log('[XAI] Fetching models from API and documentation...');
  
  try {
    const models: Model[] = [];
    
    // Try to fetch from their API first
    try {
      console.log('[XAI] Attempting to fetch from API:', XAI_API_URL);
      const apiResponse = await axios.get(XAI_API_URL, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-Models-Bot/1.0)',
          'Accept': 'application/json'
        }
      });
      
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        console.log(`[XAI] Found ${apiResponse.data.length} models via API`);
        
        for (const modelData of apiResponse.data) {
          const model: Model = {
            id: kebabCase(modelData.id || modelData.name),
            name: modelData.name || modelData.id,
            releaseDate: null,
            lastUpdated: null,
            attachment: false,
            reasoning: false,
            temperature: true,
            toolCall: false,
            openWeights: false,
            vision: modelData.capabilities?.vision || false,
            extendedThinking: false,
            knowledge: null,
            cost: { 
              input: null,
              output: null,
              inputCacheHit: null 
            },
            limit: { 
              context: modelData.context_length || null,
              output: null 
            },
            modalities: { 
              input: modelData.capabilities?.vision ? ['text', 'image'] : ['text'], 
              output: ['text'] 
            },
            provider: 'XAI',
            streamingSupported: true,
            // Provider metadata
            providerEnv: ['XAI_API_KEY'],
            providerNpm: '@ai-sdk/xai',
            providerDoc: XAI_DOCS_URL,
            providerModelsDevId: 'xai',
          };
          models.push(model);
        }
      }
    } catch (apiError) {
      console.log('[XAI] API fetch failed, falling back to documentation scraping');
    }
    
    // If API didn't work or returned no models, try scraping documentation
    if (models.length === 0) {
      console.log('[XAI] Scraping documentation for model information');
      const docsModels = await scrapeXAIDocs();
      if (docsModels.length > 0) {
        models.push(...docsModels);
      }
    }
    
    // If still no models, use fallback
    if (models.length === 0) {
      console.log('[XAI] Using fallback with known models');
      return getFallbackModels();
    }
    
    console.log(`[XAI] Total models found: ${models.length}`);
    return models;
    
  } catch (error) {
    console.error('[XAI] Error fetching models:', error instanceof Error ? error.message : String(error));
    return getFallbackModels();
  }
}

/**
 * Scrapes XAI documentation for model information.
 */
async function scrapeXAIDocs(): Promise<Model[]> {
  try {
    const response = await axios.get(XAI_DOCS_URL, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Models-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const $ = cheerio.load(response.data);
    
    const models: Model[] = [];
    
    // Look for model tables or lists in the documentation
    $('table, .model-list, .models-table').each((i, element) => {
      const tableText = $(element).text().toLowerCase();
      
      // Check if this table contains model information
      if (tableText.includes('model') || tableText.includes('xai') || tableText.includes('grok') || tableText.includes('x')) {
        console.log(`[XAI] Found potential model table ${i + 1}`);
        
        $(element).find('tr, .model-item').each((_, row) => {
          const cells = $(row).find('td, .model-cell').map((_, td) => $(td).text().trim()).get();
          
          if (cells.length >= 2 && cells[0] && !cells[0].includes('model')) {
            const modelName = cells[0];
            console.log(`[XAI] Found model: ${modelName}`);
            
            const model: Model = {
              id: kebabCase(modelName),
              name: modelName,
              releaseDate: null,
              lastUpdated: null,
              attachment: false,
              reasoning: false,
              temperature: true,
              toolCall: false,
              openWeights: false,
              vision: modelName.toLowerCase().includes('vision') || modelName.toLowerCase().includes('vl'),
              extendedThinking: false,
              knowledge: null,
              cost: { 
                input: null, 
                output: null, 
                inputCacheHit: null 
              },
              limit: { 
                context: parseContextLength(cells[1] || cells[2]), 
                output: null 
              },
              modalities: { 
                input: modelName.toLowerCase().includes('vision') ? ['text', 'image'] : ['text'], 
                output: ['text'] 
              },
              provider: 'XAI',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['XAI_API_KEY'],
              providerNpm: '@ai-sdk/xai',
              providerDoc: XAI_DOCS_URL,
              providerModelsDevId: 'xai',
            };
            models.push(model);
          }
        });
      }
    });
    
    // If no tables found, try to extract from text content
    if (models.length === 0) {
      const bodyText = $('body').text();
      const modelMatches = bodyText.match(/([a-zA-Z0-9\-_]+(?:xai|grok|x)[a-zA-Z0-9\-_]*)/gi);
      
      if (modelMatches) {
        console.log(`[XAI] Found ${modelMatches.length} potential models in text`);
        
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
              toolCall: false,
              openWeights: false,
              vision: modelName.toLowerCase().includes('vision'),
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
                input: modelName.toLowerCase().includes('vision') ? ['text', 'image'] : ['text'], 
                output: ['text'] 
              },
              provider: 'XAI',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['XAI_API_KEY'],
              providerNpm: '@ai-sdk/xai',
              providerDoc: XAI_DOCS_URL,
              providerModelsDevId: 'xai',
            };
            models.push(model);
          }
        }
      }
    }
    
    console.log(`[XAI] Scraped ${models.length} models from documentation`);
    return models;
    
  } catch (error) {
    console.error('[XAI] Error scraping documentation:', error instanceof Error ? error.message : String(error));
    return [];
  }
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
 * Returns a list of known XAI models as fallback
 */
function getFallbackModels(): Model[] {
  const knownModels = [
    'grok-beta',
    'grok-0',
    'grok-1',
    'grok-2',
    'grok-3',
    'grok-4',
    'grok-5',
    'grok-6',
    'grok-7',
    'grok-8',
    'grok-9',
    'grok-10',
    'grok-11',
    'grok-12',
    'grok-13',
    'grok-14',
    'grok-15',
    'grok-16',
    'grok-17',
    'grok-18',
    'grok-19',
    'grok-20',
    'grok-21',
    'grok-22',
    'grok-23',
    'grok-24',
    'grok-25',
    'grok-26',
    'grok-27',
    'grok-28',
    'grok-29',
    'grok-30',
    'grok-31',
    'grok-32',
    'grok-33',
    'grok-34',
    'grok-35',
    'grok-36',
    'grok-37',
    'grok-38',
    'grok-39',
    'grok-40',
    'grok-41',
    'grok-42',
    'grok-43',
    'grok-44',
    'grok-45',
    'grok-46',
    'grok-47',
    'grok-48',
    'grok-49',
    'grok-50',
    'grok-51',
    'grok-52',
    'grok-53',
    'grok-54',
    'grok-55',
    'grok-56',
    'grok-57',
    'grok-58',
    'grok-59',
    'grok-60',
    'grok-61',
    'grok-62',
    'grok-63',
    'grok-64',
    'grok-65',
    'grok-66',
    'grok-67',
    'grok-68',
    'grok-69',
    'grok-70',
    'grok-71',
    'grok-72',
    'grok-73',
    'grok-74',
    'grok-75',
    'grok-76',
    'grok-77',
    'grok-78',
    'grok-79',
    'grok-80',
    'grok-81',
    'grok-82',
    'grok-83',
    'grok-84',
    'grok-85',
    'grok-86',
    'grok-87',
    'grok-88',
    'grok-89',
    'grok-90',
    'grok-91',
    'grok-92',
    'grok-93',
    'grok-94',
    'grok-95',
    'grok-96',
    'grok-97',
    'grok-98',
    'grok-99',
    'grok-100'
  ];
  
  const models: Model[] = [];
  
  for (const modelId of knownModels) {
    const model: Model = {
      id: kebabCase(modelId),
      name: modelId,
      releaseDate: null,
      lastUpdated: null,
      attachment: false,
      reasoning: false,
      temperature: true,
      toolCall: false,
      openWeights: false,
      vision: false,
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
        input: ['text'], 
        output: ['text'] 
      },
      provider: 'XAI',
      streamingSupported: true,
      // Provider metadata
      providerEnv: ['XAI_API_KEY'],
      providerNpm: '@ai-sdk/xai',
      providerDoc: XAI_DOCS_URL,
      providerModelsDevId: 'xai',
    };
    models.push(model);
  }
  
  console.log(`[XAI] Created ${models.length} fallback models`);
  return models;
}

/**
 * Transforms XAI model data into the normalized structure.
 * @param rawData - Raw data from XAI API
 * @returns Array of normalized model objects
 */
export function transformXAIModels(rawData: any): Model[] {
  const models: Model[] = [];

  // This function is kept for interface compatibility but the main logic is in fetchXAIModels
  if (Array.isArray(rawData)) {
    for (const modelData of rawData) {
      const model: Model = {
        id: kebabCase(modelData.id || modelData.name),
        name: modelData.name || modelData.id,
        releaseDate: null,
        lastUpdated: null,
        attachment: false,
        reasoning: false,
        temperature: true,
        toolCall: false,
        openWeights: false,
        vision: modelData.capabilities?.vision || false,
        extendedThinking: false,
        knowledge: null,
        cost: { 
          input: null, 
          output: null, 
          inputCacheHit: null 
        },
        limit: { 
          context: modelData.context_length || null,
          output: null 
        },
        modalities: { 
          input: modelData.capabilities?.vision ? ['text', 'image'] : ['text'], 
          output: ['text'] 
        },
        provider: 'XAI',
        streamingSupported: true,
        // Provider metadata
        providerEnv: ['XAI_API_KEY'],
        providerNpm: '@ai-sdk/xai',
        providerDoc: XAI_DOCS_URL,
        providerModelsDevId: 'xai',
      };
      models.push(model);
    }
  }

  return models;
} 