import axios from 'axios';
import * as cheerio from 'cheerio';
import { kebabCase } from '@visulima/string';
import type { Model } from '../../../src/schema.js';

const MORPH_API_URL = 'https://api.morph.ai/v1/models';
const MORPH_DOCS_URL = 'https://morph.ai/';

/**
 * Fetches Morph models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchMorphModels(): Promise<Model[]> {
  console.log('[Morph] Fetching models from API and documentation...');
  
  try {
    const models: Model[] = [];
    
    // Try to fetch from their API first
    try {
      console.log('[Morph] Attempting to fetch from API:', MORPH_API_URL);
      const apiResponse = await axios.get(MORPH_API_URL);
      
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        console.log(`[Morph] Found ${apiResponse.data.length} models via API`);
        
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
            provider: 'Morph',
            streamingSupported: true,
            // Provider metadata
            providerEnv: ['MORPH_API_KEY'],
            providerNpm: '@ai-sdk/morph',
            providerDoc: MORPH_DOCS_URL,
            providerModelsDevId: 'morph',
          };
          models.push(model);
        }
      }
    } catch (apiError) {
      console.log('[Morph] API fetch failed, falling back to documentation scraping');
    }
    
    // If API didn't work or returned no models, try scraping documentation
    if (models.length === 0) {
      console.log('[Morph] Scraping documentation for model information');
      const docsModels = await scrapeMorphDocs();
      models.push(...docsModels);
    }
    
    console.log(`[Morph] Total models found: ${models.length}`);
    return models;
    
  } catch (error) {
    console.error('[Morph] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Scrapes Morph documentation for model information.
 */
async function scrapeMorphDocs(): Promise<Model[]> {
  try {
    const response = await axios.get(MORPH_DOCS_URL);
    const $ = cheerio.load(response.data);
    
    const models: Model[] = [];
    
    // Look for model tables or lists in the documentation
    $('table, .model-list, .models-table').each((i, element) => {
      const tableText = $(element).text().toLowerCase();
      
      // Check if this table contains model information
      if (tableText.includes('model') || tableText.includes('morph') || tableText.includes('llama') || tableText.includes('mistral')) {
        console.log(`[Morph] Found potential model table ${i + 1}`);
        
        $(element).find('tr, .model-item').each((_, row) => {
          const cells = $(row).find('td, .model-cell').map((_, td) => $(td).text().trim()).get();
          
          if (cells.length >= 2 && cells[0] && !cells[0].includes('model')) {
            const modelName = cells[0];
            console.log(`[Morph] Found model: ${modelName}`);
            
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
              provider: 'Morph',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['MORPH_API_KEY'],
              providerNpm: '@ai-sdk/morph',
              providerDoc: MORPH_DOCS_URL,
              providerModelsDevId: 'morph',
            };
            models.push(model);
          }
        });
      }
    });
    
    // If no tables found, try to extract from text content
    if (models.length === 0) {
      const bodyText = $('body').text();
      const modelMatches = bodyText.match(/([a-zA-Z0-9\-_]+(?:morph|llama|mistral|gemma)[a-zA-Z0-9\-_]*)/gi);
      
      if (modelMatches) {
        console.log(`[Morph] Found ${modelMatches.length} potential models in text`);
        
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
              provider: 'Morph',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['MORPH_API_KEY'],
              providerNpm: '@ai-sdk/morph',
              providerDoc: MORPH_DOCS_URL,
              providerModelsDevId: 'morph',
            };
            models.push(model);
          }
        }
      }
    }
    
    console.log(`[Morph] Scraped ${models.length} models from documentation`);
    return models;
    
  } catch (error) {
    console.error('[Morph] Error scraping documentation:', error instanceof Error ? error.message : String(error));
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
 * Transforms Morph model data into the normalized structure.
 * @param rawData - Raw data from Morph API
 * @returns Array of normalized model objects
 */
export function transformMorphModels(rawData: any): Model[] {
  const models: Model[] = [];

  // This function is kept for interface compatibility but the main logic is in fetchMorphModels
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
        provider: 'Morph',
        streamingSupported: true,
        // Provider metadata
        providerEnv: ['MORPH_API_KEY'],
        providerNpm: '@ai-sdk/morph',
        providerDoc: MORPH_DOCS_URL,
        providerModelsDevId: 'morph',
      };
      models.push(model);
    }
  }

  return models;
} 