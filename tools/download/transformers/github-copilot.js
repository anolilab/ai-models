import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Transforms GitHub Copilot model data from their documentation page into the normalized structure.
 * 
 * @param {string} htmlContent - The HTML content from the GitHub Copilot models page.
 * @returns {Array} Array of normalized model objects.
 */
const transformGitHubCopilotModels = (htmlContent) => {
  const $ = cheerio.load(htmlContent);
  const models = [];

  // Parse the models table - look for the first table with model information
  $('table').each((tableIndex, tableElement) => {
    const $table = $(tableElement);
    const $rows = $table.find('tr');
    
    // Check if this table contains model information
    const tableText = $table.text();
    if (!tableText.includes('Model name') || !tableText.includes('Provider')) {
      return; // Skip tables that don't contain model information
    }
    
    let headers = [];
    let modelData = [];
    
    $rows.each((rowIndex, rowElement) => {
      const $cells = $(rowElement).find('td, th');
      const rowData = [];
      
      $cells.each((cellIndex, cellElement) => {
        rowData.push($(cellElement).text().trim());
      });
      
      if (rowIndex === 0) {
        // This is the header row
        headers = rowData;
      } else if (rowData.length > 0) {
        // This is a data row
        modelData.push(rowData);
      }
    });
    
    // Process the model data
    modelData.forEach(row => {
      if (row.length >= headers.length) {
        const modelInfo = {};
        
        headers.forEach((header, index) => {
          modelInfo[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
        });
        
        // Create model object
        if (modelInfo.model_name) {
          const model = {
            id: modelInfo.model_name.toLowerCase().replace(/\s+/g, '-'),
            name: modelInfo.model_name,
            release_date: null, // GitHub Copilot doesn't provide release dates in the table
            last_updated: null,
            attachment: false,
            reasoning: false, // GitHub Copilot models don't support reasoning
            temperature: true,
            knowledge: null,
            tool_call: false, // GitHub Copilot doesn't support tool calls
            open_weights: false,
            cost: {
              input: null, // Pricing not provided in the table
              output: null,
              input_cache_hit: null,
            },
            limit: {
              context: null,
              output: null,
            },
            modalities: {
              input: ['text'],
              output: ['text'],
            },
            provider: 'GitHub Copilot',
            cache_read: false, // GitHub Copilot doesn't support context caching
          };
          
          models.push(model);
        }
      }
    });
  });

  return models;
};

/**
 * Fetches models from GitHub Copilot documentation and transforms them.
 * @returns {Array} Array of transformed models.
 */
async function fetchGitHubCopilotModels() {
  console.log('[GitHub Copilot] Fetching: https://docs.github.com/en/copilot/reference/ai-models/supported-models');
  
  try {
    const response = await axios.get('https://docs.github.com/en/copilot/reference/ai-models/supported-models');
    const htmlContent = response.data;
    
    const models = transformGitHubCopilotModels(htmlContent);
    
    return models;
    
  } catch (error) {
    console.error('[GitHub Copilot] Error fetching models:', error.message);
    return [];
  }
}

export {
  fetchGitHubCopilotModels,
  transformGitHubCopilotModels,
}; 