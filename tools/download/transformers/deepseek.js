import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Transforms DeepSeek model data from their pricing documentation page into the normalized structure.
 * 
 * @param {string} htmlContent - The HTML content from the DeepSeek pricing page.
 * @returns {Array} Array of normalized model objects.
 */
const transformDeepSeekModels = (htmlContent) => {
  const $ = cheerio.load(htmlContent);
  const models = [];

  // First, extract model mappings from the info section
  const modelMappings = {};
  
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

  // Parse the pricing table - look for the specific table with pricing information
  $('table').each((tableIndex, tableElement) => {
    const $table = $(tableElement);
    const $rows = $table.find('tr');
    
    // Check if this table contains the pricing information
    const tableText = $table.text();
    if (!tableText.includes('deepseek-chat') || !tableText.includes('deepseek-reasoner')) {
      return; // Skip tables that don't contain our target models
    }
    
    let modelNames = [];
    let pricingData = {};
    
    $rows.each((rowIndex, rowElement) => {
      const $cells = $(rowElement).find('td, th');
      
      // Check if this is the header row with model names
      if ($cells.length >= 3 && $cells.eq(0).text().trim().includes('MODEL')) {
        
        // Handle colspan in the first cell - extract all text content from the row
        const rowText = $(rowElement).text().trim();
        
        // Extract model names using regex - look for both the API names and the actual model names
        const modelMatches = rowText.match(/deepseek-chat|deepseek-reasoner|DeepSeek-V3-0324|DeepSeek-R1-0528/g);
        if (modelMatches) {
          modelNames = modelMatches;
        }
      }
      
      // Parse pricing rows
      if (modelNames.length > 0 && $cells.length >= 3) {
        const rowText = $(rowElement).text().trim();
        
        if (rowText.includes('1M TOKENS INPUT (CACHE HIT)')) {
          // Extract all prices from the row using regex
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
        } else if (rowText.includes('1M TOKENS INPUT (CACHE MISS)')) {
          // Extract all prices from the row using regex
          const prices = rowText.match(/\$[\d.]+/g);
          if (prices && prices.length >= modelNames.length) {
            for (let i = 0; i < modelNames.length; i++) {
              const price = parseFloat(prices[i].replace('$', ''));
              if (!isNaN(price)) {
                if (!pricingData[modelNames[i]]) pricingData[modelNames[i]] = {};
                pricingData[modelNames[i]].input_cache_miss = price;
              }
            }
          }
        } else if (rowText.includes('1M TOKENS OUTPUT')) {
          // Extract all prices from the row using regex
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
    const apiModels = [
      { id: 'deepseek-chat', reasoning: false, outputLimit: 8192 },
      { id: 'deepseek-reasoner', reasoning: true, outputLimit: 64000 }
    ];
    
    apiModels.forEach(apiModel => {
      // Find pricing data for this model (could be from API name or actual model name)
      let pricing = null;
      
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
        models.push({
          id: apiModel.id,
          name: modelMappings[apiModel.id] || apiModel.id,
          release_date: null,
          last_updated: null,
          attachment: false,
          reasoning: apiModel.reasoning,
          temperature: true,
          knowledge: null,
          tool_call: true,
          open_weights: true,
          cost: {
            input: pricing.input_cache_hit || null,
            output: pricing.output || null,
            input_cache_hit: pricing.input_cache_hit || null,
            input_cache_miss: pricing.input_cache_miss || null,
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
          cache_read: true, // DeepSeek supports context caching
        });
      }
    });
  });

  return models;
};

/**
 * Fetches models from DeepSeek pricing documentation and transforms them.
 * @returns {Array} Array of transformed models.
 */
async function fetchDeepSeekModels() {
  console.log('[DeepSeek] Fetching: https://api-docs.deepseek.com/quick_start/pricing');
  
  try {
    const response = await axios.get('https://api-docs.deepseek.com/quick_start/pricing');
    const htmlContent = response.data;
    
    const models = transformDeepSeekModels(htmlContent);
    
    return models;
    
  } catch (error) {
    console.error('[DeepSeek] Error fetching models:', error.message);
    return [];
  }
}

export {
  fetchDeepSeekModels,
  transformDeepSeekModels,
}; 