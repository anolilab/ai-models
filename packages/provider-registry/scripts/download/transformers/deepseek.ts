import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Model } from '../../../src/schema.js';

/**
 * Model mapping from API names to actual model names
 */
interface ModelMappings {
  [key: string]: string;
}

/**
 * Release dates for models
 */
interface ReleaseDates {
  [key: string]: string;
}

/**
 * Pricing data for a model
 */
interface PricingData {
  input?: number;
  output?: number;
  input_cache_hit?: number;
}

/**
 * API model configuration
 */
interface ApiModelConfig {
  id: string;
  reasoning: boolean;
  outputLimit: number;
}

/**
 * Transforms DeepSeek model data from their pricing documentation page into the normalized structure.
 * 
 * @param htmlContent - The HTML content from the DeepSeek pricing page
 * @returns Array of normalized model objects
 */
function transformDeepSeekModels(htmlContent: string): Model[] {
  const $ = cheerio.load(htmlContent);
  const models: Model[] = [];

  // First, extract model mappings from the info section
  const modelMappings: ModelMappings = {};
  
  // Look for the specific structure: "model points to" followed by <strong> tags
  $('li').each((index, element) => {
    const $li = $(element);
    const text = $li.text();
    
    if (text.includes('model points to')) {
      // Split the text by dots to separate different model mappings
      const sentences = text.split('.');
      
      sentences.forEach(sentence => {
        if (sentence.includes('model points to')) {
          // Find all <strong> tags in this sentence
          const $strongs = $li.find('strong');
          
          if ($strongs.length > 0) {
            // Extract each model name from the strong tags
            $strongs.each((strongIndex, strongElement) => {
              const modelName = $(strongElement).text().trim();
              
              // Determine which model this maps to based on the sentence content
              if (sentence.includes('deepseek-chat') && modelName.includes('V3')) {
                modelMappings['deepseek-chat'] = modelName;
              } else if (sentence.includes('deepseek-reasoner') && modelName.includes('R1')) {
                modelMappings['deepseek-reasoner'] = modelName;
              }
            });
          }
        }
      });
    }
  });

  // Extract release dates from the sidebar menu
  const releaseDates: ReleaseDates = {};
  
  // Look for the sidebar menu with release information
  $('ul.menu__list li').each((index, element) => {
    const $li = $(element);
    const $link = $li.find('a.menu__link');
    
    if ($link.length > 0) {
      const linkText = $link.text().trim();
      
      // Look for specific model releases
      if (linkText.includes('DeepSeek-V3-0324')) {
        const dateMatch = linkText.match(/(\d{4}\/\d{2}\/\d{2})/);
        if (dateMatch) {
          releaseDates['DeepSeek-V3-0324'] = dateMatch[1];
        }
      } else if (linkText.includes('DeepSeek-R1-0528')) {
        const dateMatch = linkText.match(/(\d{4}\/\d{2}\/\d{2})/);
        if (dateMatch) {
          releaseDates['DeepSeek-R1-0528'] = dateMatch[1];
        }
      }
    }
  });

  // Parse the pricing table - look for the specific table with pricing information
  $('table').each((tableIndex, tableElement) => {
    const $table = $(tableElement);
    const $rows = $table.find('tr');
    
    // Check if this table contains the pricing information
    const tableText = $table.text();
    if (!tableText.includes('deepseek-chat') || !tableText.includes('deepseek-reasoner')) {
      return; // Skip tables that don't contain our target models
    }
    
    let modelNames: string[] = [];
    let pricingData: Record<string, PricingData> = {};
    let inStandardPriceSection = false;
    
    $rows.each((rowIndex, rowElement) => {
      const $cells = $(rowElement).find('td, th');
      const rowText = $(rowElement).text().trim();
      
      // Check if this is the header row with model names
      if ($cells.length >= 3 && $cells.eq(0).text().trim().includes('MODEL')) {
        
        // Extract model names using regex - look for both the API names and the actual model names
        const modelMatches = rowText.match(/deepseek-chat|deepseek-reasoner|DeepSeek-V3-0324|DeepSeek-R1-0528/g);
        if (modelMatches) {
          modelNames = modelMatches;
        }
      }
      
      // Check if we're entering the STANDARD PRICE section
      if (rowText.includes('STANDARD PRICE')) {
        inStandardPriceSection = true;
        
        // Check if this row also contains INPUT CACHE HIT pricing
        if (rowText.includes('INPUT') && rowText.includes('CACHE HIT') && modelNames.length > 0) {
          const prices = rowText.match(/\$[\d.]+/g);
          if (prices && prices.length >= modelNames.length) {
            for (let i = 0; i < modelNames.length; i++) {
              const price = parseFloat(prices[i].replace('$', ''));
              if (!isNaN(price)) {
                if (!pricingData[modelNames[i]]) pricingData[modelNames[i]] = {};
                pricingData[modelNames[i]].input_cache_hit = price;
              }
            }
          }
        }
        return;
      }
      
      // Check if we're entering the DISCOUNT PRICE section (stop processing)
      if (rowText.includes('DISCOUNT PRICE')) {
        inStandardPriceSection = false;
        return;
      }
      
      // Parse pricing rows - only in STANDARD PRICE section
      if (inStandardPriceSection && modelNames.length > 0 && $cells.length >= 3) {
        
        // Look for input pricing (cache hit)
        if (rowText.includes('INPUT') && rowText.includes('CACHE HIT')) {
          const prices = rowText.match(/\$[\d.]+/g);
          if (prices && prices.length >= modelNames.length) {
            for (let i = 0; i < modelNames.length; i++) {
              const price = parseFloat(prices[i].replace('$', ''));
              if (!isNaN(price)) {
                if (!pricingData[modelNames[i]]) pricingData[modelNames[i]] = {};
                pricingData[modelNames[i]].input_cache_hit = price;
              }
            }
          }
        } 
        // Look for input pricing (cache miss) - this maps to 'input' field
        else if (rowText.includes('INPUT') && rowText.includes('CACHE MISS')) {
          const prices = rowText.match(/\$[\d.]+/g);
          if (prices && prices.length >= modelNames.length) {
            for (let i = 0; i < modelNames.length; i++) {
              const price = parseFloat(prices[i].replace('$', ''));
              if (!isNaN(price)) {
                if (!pricingData[modelNames[i]]) pricingData[modelNames[i]] = {};
                pricingData[modelNames[i]].input = price; // Map to 'input' field
              }
            }
          }
        } 
        // Look for output pricing
        else if (rowText.includes('OUTPUT')) {
          const prices = rowText.match(/\$[\d.]+/g);
          if (prices && prices.length >= modelNames.length) {
            for (let i = 0; i < modelNames.length; i++) {
              const price = parseFloat(prices[i].replace('$', ''));
              if (!isNaN(price)) {
                if (!pricingData[modelNames[i]]) pricingData[modelNames[i]] = {};
                pricingData[modelNames[i]].output = price;
              }
            }
          }
        }
      }
    });
    
    // Create model objects from the parsed data
    // We'll create separate models for each API endpoint
    const apiModels: ApiModelConfig[] = [
      { id: 'deepseek-chat', reasoning: false, outputLimit: 8192 },
      { id: 'deepseek-reasoner', reasoning: true, outputLimit: 64000 }
    ];
    
    apiModels.forEach(apiModel => {
      // Find pricing data for this model (could be from API name or actual model name)
      let pricing: PricingData | null = null;
      
      // First try to find by API name
      if (pricingData[apiModel.id]) {
        pricing = pricingData[apiModel.id];
      } else {
        // Try to find by actual model name
        const actualModelName = modelMappings[apiModel.id];
        if (actualModelName && pricingData[actualModelName]) {
          pricing = pricingData[actualModelName];
        }
      }
      
      // If we found pricing data, create the model
      if (pricing) {
        const actualModelName = modelMappings[apiModel.id] || apiModel.id;
        const releaseDate = releaseDates[actualModelName] || null;
        
        const model: Model = {
          id: apiModel.id,
          name: actualModelName,
          releaseDate: releaseDate,
          lastUpdated: null,
          attachment: false,
          reasoning: apiModel.reasoning,
          temperature: true,
          knowledge: null,
          toolCall: true,
          openWeights: false,
          cost: {
            input: pricing.input || null,
            output: pricing.output || null,
            inputCacheHit: pricing.input_cache_hit || null,
          },
          limit: {
            context: 64000, // Default context length for DeepSeek models
            output: apiModel.outputLimit,
          },
          modalities: {
            input: ['text'],
            output: ['text'],
          },
          provider: 'DeepSeek',
          cacheRead: true, // DeepSeek supports context caching
        };
        
        models.push(model);
      }
    });
  });

  return models;
}

/**
 * Fetches models from DeepSeek pricing documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchDeepSeekModels(): Promise<Model[]> {
  console.log('[DeepSeek] Fetching: https://api-docs.deepseek.com/quick_start/pricing');
  
  try {
    const response = await axios.get('https://api-docs.deepseek.com/quick_start/pricing');
    const htmlContent = response.data;
    
    const models = transformDeepSeekModels(htmlContent);
    
    return models;
    
  } catch (error) {
    console.error('[DeepSeek] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchDeepSeekModels,
  transformDeepSeekModels,
}; 