import axios from 'axios';
import * as cheerio from 'cheerio';
import { kebabCase } from '@visulima/string';
import type { Model } from '../../../src/schema.js';

const UPSTAGE_API_URL = 'https://api.upstage.ai/v1/models';
const UPSTAGE_DOCS_URL = 'https://docs.upstage.ai/';

/**
 * Fetches Upstage models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchUpstageModels(): Promise<Model[]> {
  console.log('[Upstage] Fetching models from API and documentation...');
  
  try {
    const models: Model[] = [];
    
    // Try to fetch from their API first
    try {
      console.log('[Upstage] Attempting to fetch from API:', UPSTAGE_API_URL);
      const apiResponse = await axios.get(UPSTAGE_API_URL);
      
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        console.log(`[Upstage] Found ${apiResponse.data.length} models via API`);
        
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
            provider: 'Upstage',
            streamingSupported: true,
            // Provider metadata
            providerEnv: ['UPSTAGE_API_KEY'],
            providerNpm: '@ai-sdk/upstage',
            providerDoc: UPSTAGE_DOCS_URL,
            providerModelsDevId: 'upstage',
          };
          models.push(model);
        }
      }
    } catch (apiError) {
      console.log('[Upstage] API fetch failed, falling back to documentation scraping');
    }
    
    // If API didn't work or returned no models, try scraping documentation
    if (models.length === 0) {
      console.log('[Upstage] Scraping documentation for model information');
      const docsModels = await scrapeUpstageDocs();
      models.push(...docsModels);
    }
    
    console.log(`[Upstage] Total models found: ${models.length}`);
    return models;
    
  } catch (error) {
    console.error('[Upstage] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Scrapes Upstage documentation for model information.
 */
async function scrapeUpstageDocs(): Promise<Model[]> {
  try {
    const response = await axios.get(UPSTAGE_DOCS_URL);
    const $ = cheerio.load(response.data);
    
    const models: Model[] = [];
    
    // Look for model tables or lists in the documentation
    $('table, .model-list, .models-table').each((i, element) => {
      const tableText = $(element).text().toLowerCase();
      
      // Check if this table contains model information
      if (tableText.includes('model') || tableText.includes('upstage') || tableText.includes('solar') || tableText.includes('llama')) {
        console.log(`[Upstage] Found potential model table ${i + 1}`);
        
        $(element).find('tr, .model-item').each((_, row) => {
          const cells = $(row).find('td, .model-cell').map((_, td) => $(td).text().trim()).get();
          
          if (cells.length >= 2 && cells[0] && !cells[0].includes('model')) {
            const modelName = cells[0];
            console.log(`[Upstage] Found model: ${modelName}`);
            
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
              provider: 'Upstage',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['UPSTAGE_API_KEY'],
              providerNpm: '@ai-sdk/upstage',
              providerDoc: UPSTAGE_DOCS_URL,
              providerModelsDevId: 'upstage',
            };
            models.push(model);
          }
        });
      }
    });
    
    // If no tables found, try to extract from text content
    if (models.length === 0) {
      const bodyText = $('body').text();
      const modelMatches = bodyText.match(/([a-zA-Z0-9\-_]+(?:upstage|solar|llama|mistral)[a-zA-Z0-9\-_]*)/gi);
      
      if (modelMatches) {
        console.log(`[Upstage] Found ${modelMatches.length} potential models in text`);
        
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
              provider: 'Upstage',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['UPSTAGE_API_KEY'],
              providerNpm: '@ai-sdk/upstage',
              providerDoc: UPSTAGE_DOCS_URL,
              providerModelsDevId: 'upstage',
            };
            models.push(model);
          }
        }
      }
    }
    
    console.log(`[Upstage] Scraped ${models.length} models from documentation`);
    return models;
    
  } catch (error) {
    console.error('[Upstage] Error scraping documentation:', error instanceof Error ? error.message : String(error));
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
 * Transforms Upstage model data into the normalized structure.
 * @param rawData - Raw data from Upstage API
 * @returns Array of normalized model objects
 */
export function transformUpstageModels(rawData: any): Model[] {
  const models: Model[] = [];

  // This function is kept for interface compatibility but the main logic is in fetchUpstageModels
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
        provider: 'Upstage',
        streamingSupported: true,
        // Provider metadata
        providerEnv: ['UPSTAGE_API_KEY'],
        providerNpm: '@ai-sdk/upstage',
        providerDoc: UPSTAGE_DOCS_URL,
        providerModelsDevId: 'upstage',
      };
      models.push(model);
    }
  }

  return models;
} 