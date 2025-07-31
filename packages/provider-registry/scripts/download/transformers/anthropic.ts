import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Model } from '../../../src/schema.js';

/**
 * Model details extracted from the features table
 */
interface ModelDetails {
  context_window?: string;
  max_output?: string;
  vision?: boolean;
  extended_thinking?: boolean;
  training_cutoff?: string;
}

/**
 * Pricing information extracted from the pricing table
 */
interface ModelPricing {
  input: number | null;
  output: number | null;
}

/**
 * Raw model data before transformation
 */
interface RawModelData {
  name: string;
  details: ModelDetails;
  pricing: ModelPricing;
}

/**
 * Model column information from the features table header
 */
interface ModelColumn {
  index: number;
  name: string;
}

/**
 * Parses a price string and extracts the numeric value
 * @param priceStr - Price string in format like "$15 / MTok"
 * @returns Parsed price as number or null if parsing fails
 * @example
 * parsePrice("$15 / MTok") // Returns 15
 * parsePrice("$0.75 / MTok") // Returns 0.75
 */
function parsePrice(priceStr: string): number | null {
  const match = priceStr.match(/\$([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Parses a token limit string and converts to number
 * @param limitStr - Limit string in format like "200K tokens"
 * @returns Parsed limit as number or null if parsing fails
 * @example
 * parseTokenLimit("200K tokens") // Returns 200000
 * parseTokenLimit("4K tokens") // Returns 4000
 */
function parseTokenLimit(limitStr: string): number | null {
  const match = limitStr.match(/(\d+(?:\.\d+)?)\s*[Kk]/);
  if (match) {
    return Math.round(parseFloat(match[1]) * 1000);
  }
  return null;
}

/**
 * Transforms Anthropic model data from their documentation page into the normalized structure.
 * 
 * @param htmlContent - The HTML content from the Anthropic models documentation page
 * @returns Array of normalized model objects
 */
function transformAnthropicModels(htmlContent: string): Model[] {
  const $ = cheerio.load(htmlContent);
  const models: Model[] = [];
  const modelDetails: Record<string, ModelDetails> = {};
  const modelPricing: Record<string, ModelPricing> = {};
  
  // First, extract pricing information from the pricing table
  $('table').each((tableIndex, tableElement) => {
    const $table = $(tableElement);
    const $rows = $table.find('tbody tr');
    
    // Check if this is the pricing table (has "Base Input Tokens" and "Output Tokens" in header)
    const $header = $table.find('thead tr th');
    if ($header.length >= 6 && 
        $header.eq(1).text().trim().includes('Base Input Tokens') && 
        $header.eq(5).text().trim().includes('Output Tokens')) {
      // This is the pricing table - extract pricing details
      $rows.each((rowIndex, rowElement) => {
        const $cells = $(rowElement).find('td');
        
        if ($cells.length >= 6) {
          const modelName = $cells.eq(0).text().trim();
          const baseInputPrice = $cells.eq(1).text().trim();
          const outputPrice = $cells.eq(5).text().trim();
          
          if (modelName && modelName.includes('Claude')) {
            modelPricing[modelName] = {
              input: parsePrice(baseInputPrice),
              output: parsePrice(outputPrice)
            };
          }
        }
      });
    }
  });
  
  // Second, extract model details from the third table (features table)
  $('table').each((tableIndex, tableElement) => {
    const $table = $(tableElement);
    const $rows = $table.find('tbody tr');
    
    // Check if this is the features table (has "Feature" in header and multiple model columns)
    const $header = $table.find('thead tr th');
    if ($header.length > 3 && $header.eq(0).text().trim().includes('Feature')) {
      // This is the features table - extract model details
      const modelColumns: ModelColumn[] = [];
      
      // Get model names from header (skip first column which is "Feature")
      $header.each((index, headerCell) => {
        if (index > 0) { // Skip the "Feature" column
          const modelName = $(headerCell).text().trim();
          if (modelName && modelName.includes('Claude')) {
            modelColumns.push({
              index: index,
              name: modelName
            });
          }
        }
      });
      
      // Extract details for each model
      $rows.each((rowIndex, rowElement) => {
        const $cells = $(rowElement).find('td');
        const featureName = $cells.eq(0).text().trim();
        
        modelColumns.forEach((modelCol) => {
          const cellIndex = modelCol.index;
          const cellValue = $cells.eq(cellIndex).text().trim();
          
          if (!modelDetails[modelCol.name]) {
            modelDetails[modelCol.name] = {};
          }
          
          // Map feature names to our schema
          if (featureName.includes('Context window')) {
            modelDetails[modelCol.name].context_window = cellValue;
          } else if (featureName.includes('Max output')) {
            modelDetails[modelCol.name].max_output = cellValue;
          } else if (featureName.includes('Vision')) {
            modelDetails[modelCol.name].vision = cellValue.toLowerCase() === 'yes';
          } else if (featureName.includes('Extended thinking')) {
            modelDetails[modelCol.name].extended_thinking = cellValue.toLowerCase() === 'yes';
          } else if (featureName.includes('Training data cut-off')) {
            modelDetails[modelCol.name].training_cutoff = cellValue;
          }
        });
      });
    }
  });
  
  // Create normalized model objects
  Object.keys(modelDetails).forEach(modelName => {
    const details = modelDetails[modelName];
    const pricing = modelPricing[modelName] || { input: null, output: null };
    
    // Parse context window (extract number from "200K tokens" format)
    const contextLimit = details.context_window ? parseTokenLimit(details.context_window) : null;
    
    // Parse max output (extract number from "4K tokens" format)
    const outputLimit = details.max_output ? parseTokenLimit(details.max_output) : null;
    
    // Determine input modalities
    const inputModalities = ['text'];
    if (details.vision) {
      inputModalities.push('image');
    }
    
    // Create model ID from name
    const modelId = modelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    models.push({
      id: modelId,
      name: modelName,
      releaseDate: null,
      lastUpdated: null,
      attachment: false,
      reasoning: details.extended_thinking || false,
      temperature: true,
      knowledge: details.training_cutoff || null,
      toolCall: true,
      openWeights: false, // Anthropic models are not open weights
      cost: {
        input: pricing.input,
        output: pricing.output,
        inputCacheHit: null,
      },
      limit: {
        context: contextLimit,
        output: outputLimit,
      },
      modalities: {
        input: inputModalities,
        output: ['text'],
      },
      provider: 'Anthropic',
      streamingSupported: true,
      vision: details.vision || false,
      extendedThinking: details.extended_thinking || false,
    });
  });
  
  return models;
}

/**
 * Fetches models from Anthropic documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchAnthropicModels(): Promise<Model[]> {
  console.log('[Anthropic] Fetching: https://docs.anthropic.com/en/docs/about-claude/models');
  
  try {
    const response = await axios.get('https://docs.anthropic.com/en/docs/about-claude/models');
    const htmlContent = response.data;
    
    const models = transformAnthropicModels(htmlContent);
    
    return models;
    
  } catch (error) {
    console.error('[Anthropic] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchAnthropicModels,
  transformAnthropicModels,
}; 