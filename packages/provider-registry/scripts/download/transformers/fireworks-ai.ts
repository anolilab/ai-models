import axios from 'axios';
import * as cheerio from 'cheerio';
import { kebabCase } from '@visulima/string';
import type { Model } from '../../../src/schema.js';

const FIREWORKS_MODELS_URL = 'https://app.fireworks.ai/models?filter=All%20Models';
const FIREWORKS_DOCS_URL = 'https://readme.fireworks.ai/';

/**
 * Fetches Fireworks AI models from their models page.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchFireworksAIModels(): Promise<Model[]> {
  console.log('[Fireworks AI] Fetching models from models page...');
  
  try {
    const models = await scrapeFireworksModelsPage();
    console.log(`[Fireworks AI] Total models found: ${models.length}`);
    return models;
    
  } catch (error) {
    console.error('[Fireworks AI] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Scrapes Fireworks AI models page for model information.
 */
async function scrapeFireworksModelsPage(): Promise<Model[]> {
  try {
    console.log('[Fireworks AI] Scraping models page:', FIREWORKS_MODELS_URL);
    const response = await axios.get(FIREWORKS_MODELS_URL);
    const $ = cheerio.load(response.data);
    
    const models: Model[] = [];
    
    // Find all model rows using the data-testid attribute
    $('[data-testid="model-row"]').each((i, element) => {
      const $row = $(element);
      
      // Extract model name
      const modelName = $row.find('p.font-bold').first().text().trim();
      if (!modelName) return;
      
      console.log(`[Fireworks AI] Found model: ${modelName}`);
      
      // Extract pricing information
      const pricingText = $row.find('.text-muted-foreground\\/60').text().trim();
      const cost = parsePricing(pricingText);
      
      // Extract context length
      const contextMatch = pricingText.match(/(\d+)k\s+Context/);
      const contextLength = contextMatch ? parseInt(contextMatch[1]) * 1024 : null;
      
      // Extract model type/capabilities from badges
      const badges = $row.find('.gap-1 .bg-white').map((_, badge) => $(badge).text().trim()).get();
      const isVision = badges.some(badge => badge.toLowerCase().includes('vision'));
      const isLLM = badges.some(badge => badge.toLowerCase().includes('llm'));
      const isServerless = badges.some(badge => badge.toLowerCase().includes('serverless'));
      
      // Extract provider icon to determine the original provider
      const providerIcon = $row.find('img[src*="logos"]').attr('src');
      const originalProvider = extractProviderFromIcon(providerIcon);
      
      const model: Model = {
        id: kebabCase(modelName).replace('accounts-fireworks-models-', 'accounts/fireworks/models/'),
        name: modelName,
        releaseDate: null,
        lastUpdated: null,
        attachment: false,
        reasoning: modelName.toLowerCase().includes('thinking'),
        temperature: true, // Most models support temperature
        toolCall: false, // Need to check documentation for this
        openWeights: false,
        vision: isVision,
        extendedThinking: modelName.toLowerCase().includes('thinking'),
        knowledge: null,
        cost: cost,
        limit: { 
          context: contextLength,
          output: null 
        },
        modalities: { 
          input: isVision ? ['text', 'image'] : ['text'], 
          output: ['text'] 
        },
        provider: 'Fireworks AI',
        streamingSupported: true,
        // Provider metadata
        providerEnv: ['FIREWORKS_API_KEY'],
        providerNpm: '@ai-sdk/fireworks',
        providerDoc: FIREWORKS_DOCS_URL,
        providerModelsDevId: 'fireworks-ai',
      };
      
      models.push(model);
    });
    
    console.log(`[Fireworks AI] Scraped ${models.length} models from models page`);
    return models;
    
  } catch (error) {
    console.error('[Fireworks AI] Error scraping models page:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Parse pricing information from text (e.g., "$0.22/M Input • $0.88/M Output")
 */
function parsePricing(pricingText: string): { input: number | null; output: number | null; inputCacheHit: number | null } {
  let input: number | null = null;
  let output: number | null = null;
  const inputCacheHit: number | null = null;
  
  if (!pricingText) return { input, output, inputCacheHit };
  
  // Extract input cost
  const inputMatch = pricingText.match(/\$([\d.]+)\/M\s+Input/);
  if (inputMatch) {
    const parsed = parseFloat(inputMatch[1]);
    input = isNaN(parsed) ? null : parsed;
  }
  
  // Extract output cost
  const outputMatch = pricingText.match(/\$([\d.]+)\/M\s+Output/);
  if (outputMatch) {
    const parsed = parseFloat(outputMatch[1]);
    output = isNaN(parsed) ? null : parsed;
  }
  
  return { input, output, inputCacheHit };
}

/**
 * Extract original provider from icon URL
 */
function extractProviderFromIcon(iconUrl: string | undefined): string {
  if (!iconUrl) return 'Unknown';
  
  // Extract provider name from icon path
  const match = iconUrl.match(/logos\/([^\/]+)-icon/);
  if (match) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  }
  
  return 'Unknown';
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
 * Transforms Fireworks AI model data into the normalized structure.
 * @param rawData - Raw data from Fireworks AI API
 * @returns Array of normalized model objects
 */
export function transformFireworksAIModels(rawData: any): Model[] {
  const models: Model[] = [];

  // This function is kept for interface compatibility but the main logic is in fetchFireworksAIModels
  if (Array.isArray(rawData)) {
    for (const modelData of rawData) {
      const model: Model = {
        id: kebabCase(modelData.id || modelData.name).replace('accounts-fireworks-models-', 'accounts/fireworks/models/'),
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
        provider: 'Fireworks AI',
        streamingSupported: true,
        // Provider metadata
        providerEnv: ['FIREWORKS_API_KEY'],
        providerNpm: '@ai-sdk/fireworks',
        providerDoc: FIREWORKS_DOCS_URL,
        providerModelsDevId: 'fireworks-ai',
      };
      models.push(model);
    }
  }

  return models;
} 