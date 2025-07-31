import axios from 'axios';
import * as cheerio from 'cheerio';
import { kebabCase } from '@visulima/string';
import type { Model } from '../../../src/schema.js';

const GOOGLE_VERTEX_ANTHROPIC_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GOOGLE_VERTEX_ANTHROPIC_DOCS_URL = 'https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude';

/**
 * Fetches Google Vertex Anthropic models from their API and documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchGoogleVertexAnthropicModels(): Promise<Model[]> {
  console.log('[Google Vertex Anthropic] Fetching models from API and documentation...');
  
  try {
    const models: Model[] = [];
    
    // Try to fetch from their API first
    try {
      console.log('[Google Vertex Anthropic] Attempting to fetch from API:', GOOGLE_VERTEX_ANTHROPIC_API_URL);
      const apiResponse = await axios.get(GOOGLE_VERTEX_ANTHROPIC_API_URL);
      
      if (apiResponse.data && Array.isArray(apiResponse.data.models)) {
        console.log(`[Google Vertex Anthropic] Found ${apiResponse.data.models.length} models via API`);
        
        for (const modelData of apiResponse.data.models) {
          // Filter for Anthropic/Claude models
          if (modelData.name?.toLowerCase().includes('claude') || modelData.displayName?.toLowerCase().includes('claude')) {
            const model: Model = {
              id: kebabCase(modelData.name || modelData.displayName),
              name: modelData.displayName || modelData.name,
              releaseDate: null,
              lastUpdated: null,
              attachment: false,
              reasoning: modelData.name?.toLowerCase().includes('opus') || modelData.name?.toLowerCase().includes('sonnet'),
              temperature: true,
              toolCall: modelData.supportedGenerationMethods?.includes('tool-calls') || false,
              openWeights: false,
              vision: modelData.supportedGenerationMethods?.includes('generate-content') || false,
              extendedThinking: modelData.name?.toLowerCase().includes('opus') || modelData.name?.toLowerCase().includes('sonnet'),
              knowledge: null,
              cost: { 
                input: null,
                output: null,
                inputCacheHit: null 
              },
              limit: { 
                context: modelData.inputTokenLimit || null,
                output: modelData.outputTokenLimit || null 
              },
              modalities: { 
                input: modelData.supportedGenerationMethods?.includes('generate-content') ? ['text', 'image'] : ['text'], 
                output: ['text'] 
              },
              provider: 'Google Vertex Anthropic',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['GOOGLE_VERTEX_PROJECT', 'GOOGLE_VERTEX_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS'],
              providerNpm: '@ai-sdk/google-vertex/anthropic',
              providerDoc: GOOGLE_VERTEX_ANTHROPIC_DOCS_URL,
              providerModelsDevId: 'google-vertex-anthropic',
            };
            models.push(model);
          }
        }
      }
    } catch (apiError) {
      console.log('[Google Vertex Anthropic] API fetch failed, falling back to documentation scraping');
    }
    
    // If API didn't work or returned no models, try scraping documentation
    if (models.length === 0) {
      console.log('[Google Vertex Anthropic] Scraping documentation for model information');
      const docsModels = await scrapeGoogleVertexAnthropicDocs();
      models.push(...docsModels);
    }
    
    console.log(`[Google Vertex Anthropic] Total models found: ${models.length}`);
    return models;
    
  } catch (error) {
    console.error('[Google Vertex Anthropic] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Scrapes Google Vertex Anthropic documentation for model information.
 */
async function scrapeGoogleVertexAnthropicDocs(): Promise<Model[]> {
  try {
    const response = await axios.get(GOOGLE_VERTEX_ANTHROPIC_DOCS_URL);
    const $ = cheerio.load(response.data);
    
    const models: Model[] = [];
    
    // Look for model tables or lists in the documentation
    $('table, .model-list, .models-table').each((i, element) => {
      const tableText = $(element).text().toLowerCase();
      
      // Check if this table contains Claude model information
      if (tableText.includes('claude') || tableText.includes('anthropic')) {
        console.log(`[Google Vertex Anthropic] Found potential Claude model table ${i + 1}`);
        
        $(element).find('tr, .model-item').each((_, row) => {
          const cells = $(row).find('td, .model-cell').map((_, td) => $(td).text().trim()).get();
          
          if (cells.length >= 2 && cells[0] && cells[0].toLowerCase().includes('claude')) {
            const modelName = cells[0];
            console.log(`[Google Vertex Anthropic] Found Claude model: ${modelName}`);
            
            const model: Model = {
              id: kebabCase(modelName),
              name: modelName,
              releaseDate: null,
              lastUpdated: null,
              attachment: false,
              reasoning: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet'),
              temperature: true,
              toolCall: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet'),
              openWeights: false,
              vision: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet'),
              extendedThinking: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet'),
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
                input: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet') ? ['text', 'image'] : ['text'], 
                output: ['text'] 
              },
              provider: 'Google Vertex Anthropic',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['GOOGLE_VERTEX_PROJECT', 'GOOGLE_VERTEX_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS'],
              providerNpm: '@ai-sdk/google-vertex/anthropic',
              providerDoc: GOOGLE_VERTEX_ANTHROPIC_DOCS_URL,
              providerModelsDevId: 'google-vertex-anthropic',
            };
            models.push(model);
          }
        });
      }
    });
    
    // If no tables found, try to extract from text content
    if (models.length === 0) {
      const bodyText = $('body').text();
      const modelMatches = bodyText.match(/([a-zA-Z0-9\-_]+claude[a-zA-Z0-9\-_]*)/gi);
      
      if (modelMatches) {
        console.log(`[Google Vertex Anthropic] Found ${modelMatches.length} potential Claude models in text`);
        
        for (const match of modelMatches.slice(0, 10)) { // Limit to first 10 matches
          const modelName = match.trim();
          if (modelName.length > 3 && modelName.length < 50) {
            const model: Model = {
              id: kebabCase(modelName),
              name: modelName,
              releaseDate: null,
              lastUpdated: null,
              attachment: false,
              reasoning: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet'),
              temperature: true,
              toolCall: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet'),
              openWeights: false,
              vision: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet'),
              extendedThinking: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet'),
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
                input: modelName.toLowerCase().includes('opus') || modelName.toLowerCase().includes('sonnet') ? ['text', 'image'] : ['text'], 
                output: ['text'] 
              },
              provider: 'Google Vertex Anthropic',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['GOOGLE_VERTEX_PROJECT', 'GOOGLE_VERTEX_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS'],
              providerNpm: '@ai-sdk/google-vertex/anthropic',
              providerDoc: GOOGLE_VERTEX_ANTHROPIC_DOCS_URL,
              providerModelsDevId: 'google-vertex-anthropic',
            };
            models.push(model);
          }
        }
      }
    }
    
    console.log(`[Google Vertex Anthropic] Scraped ${models.length} models from documentation`);
    return models;
    
  } catch (error) {
    console.error('[Google Vertex Anthropic] Error scraping documentation:', error instanceof Error ? error.message : String(error));
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
 * Transforms Google Vertex Anthropic model data into the normalized structure.
 * @param rawData - Raw data from Google Vertex Anthropic API
 * @returns Array of normalized model objects
 */
export function transformGoogleVertexAnthropicModels(rawData: any): Model[] {
  const models: Model[] = [];

  // This function is kept for interface compatibility but the main logic is in fetchGoogleVertexAnthropicModels
  if (Array.isArray(rawData)) {
    for (const modelData of rawData) {
      // Filter for Anthropic/Claude models
      if (modelData.name?.toLowerCase().includes('claude') || modelData.displayName?.toLowerCase().includes('claude')) {
        const model: Model = {
          id: kebabCase(modelData.name || modelData.displayName),
          name: modelData.displayName || modelData.name,
          releaseDate: null,
          lastUpdated: null,
          attachment: false,
          reasoning: modelData.name?.toLowerCase().includes('opus') || modelData.name?.toLowerCase().includes('sonnet'),
          temperature: true,
          toolCall: modelData.supportedGenerationMethods?.includes('tool-calls') || false,
          openWeights: false,
          vision: modelData.supportedGenerationMethods?.includes('generate-content') || false,
          extendedThinking: modelData.name?.toLowerCase().includes('opus') || modelData.name?.toLowerCase().includes('sonnet'),
          knowledge: null,
          cost: { 
            input: null, 
            output: null, 
            inputCacheHit: null 
          },
          limit: { 
            context: modelData.inputTokenLimit || null,
            output: modelData.outputTokenLimit || null 
          },
          modalities: { 
            input: modelData.supportedGenerationMethods?.includes('generate-content') ? ['text', 'image'] : ['text'], 
            output: ['text'] 
          },
          provider: 'Google Vertex Anthropic',
          streamingSupported: true,
          // Provider metadata
          providerEnv: ['GOOGLE_VERTEX_PROJECT', 'GOOGLE_VERTEX_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS'],
          providerNpm: '@ai-sdk/google-vertex/anthropic',
          providerDoc: GOOGLE_VERTEX_ANTHROPIC_DOCS_URL,
          providerModelsDevId: 'google-vertex-anthropic',
        };
        models.push(model);
      }
    }
  }

  return models;
} 