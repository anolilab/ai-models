import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Transforms Anthropic model data from their documentation page into the normalized structure.
 * 
 * @param {string} htmlContent - The HTML content from the Anthropic models documentation page.
 * @returns {Array} Array of normalized model objects.
 */
const transformAnthropicModels = (htmlContent) => {
  const $ = cheerio.load(htmlContent);
  const models = [];
  const modelDetails = {};
  const modelPricing = {};
  
  // First, extract pricing information from the pricing table
  $('table').each((tableIndex, tableElement) => {
    const $table = $(tableElement);
    const $rows = $table.find('tbody tr');
    
    // Check if this is the pricing table (has "Base Input Tokens" and "Output Tokens" in header)
    const $header = $table.find('thead tr th');
    if ($header.length >= 6 && $header.eq(1).text().trim().includes('Base Input Tokens') && $header.eq(5).text().trim().includes('Output Tokens')) {
      // This is the pricing table - extract pricing details
      $rows.each((rowIndex, rowElement) => {
        const $cells = $(rowElement).find('td');
        
        if ($cells.length >= 6) {
          const modelName = $cells.eq(0).text().trim();
          const baseInputPrice = $cells.eq(1).text().trim();
          const outputPrice = $cells.eq(5).text().trim();
          
          if (modelName && modelName.includes('Claude')) {
            // Parse pricing (extract number from "$15 / MTok" format)
            const parsePrice = (priceStr) => {
              const match = priceStr.match(/\$([\d.]+)/);
              return match ? parseFloat(match[1]) : null;
            };
            
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
      const modelColumns = [];
      
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
        
        modelColumns.forEach((modelCol, colIndex) => {
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
    const pricing = modelPricing[modelName] || {};
    
    // Parse context window (extract number from "200K tokens" format)
    let contextLimit = null;
    if (details.context_window) {
      const contextMatch = details.context_window.match(/(\d+(?:\.\d+)?)\s*[Kk]/);
      if (contextMatch) {
        contextLimit = Math.round(parseFloat(contextMatch[1]) * 1000);
      }
    }
    
    // Parse max output (extract number from "4K tokens" format)
    let outputLimit = null;
    if (details.max_output) {
      const outputMatch = details.max_output.match(/(\d+(?:\.\d+)?)\s*[Kk]/);
      if (outputMatch) {
        outputLimit = Math.round(parseFloat(outputMatch[1]) * 1000);
      }
    }
    
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
      release_date: null,
      last_updated: null,
      attachment: false,
      reasoning: details.extended_thinking || false,
      temperature: true,
      knowledge: details.training_cutoff || null,
      tool_call: true,
      open_weights: false, // Anthropic models are not open weights
      cost: {
        input: pricing.input,
        output: pricing.output,
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
      streaming_supported: true,
      vision: details.vision || false,
      extended_thinking: details.extended_thinking || false,
    });
  });
  
  return models;
};

/**
 * Fetches models from Anthropic documentation and transforms them.
 * @returns {Array} Array of transformed models.
 */
async function fetchAnthropicModels() {
  console.log('[Anthropic] Fetching: https://docs.anthropic.com/en/docs/about-claude/models');
  
  try {
    const response = await axios.get('https://docs.anthropic.com/en/docs/about-claude/models');
    const htmlContent = response.data;
    
    const models = transformAnthropicModels(htmlContent);
    
    console.log(`[Anthropic] Done. Models processed: ${models.length}, saved: ${models.length}, errors: 0`);
    return models;
    
  } catch (error) {
    console.error('[Anthropic] Error fetching models:', error.message);
    return [];
  }
}

export {
  fetchAnthropicModels,
  transformAnthropicModels,
}; 