import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Transforms Amazon Bedrock model data from their model lifecycle documentation page into the normalized structure.
 * 
 * @param {string} htmlContent - The HTML content from the Amazon Bedrock model lifecycle page.
 * @returns {Array} Array of normalized model objects.
 */
const transformBedrockModels = (htmlContent) => {
  const $ = cheerio.load(htmlContent);
  const models = [];

  // Parse the Active versions table (first table with Provider, Model name, Model ID, etc.)
  $('table').each((tableIndex, tableElement) => {
    const $table = $(tableElement);
    const $rows = $table.find('tbody tr');
    
    // Check if this is the active versions table (has "Provider" and "Model name" in header)
    const $header = $table.find('thead tr th');
    if ($header.length >= 7 && $header.eq(0).text().trim() === 'Provider' && $header.eq(1).text().trim() === 'Model name') {
      
      $rows.each((rowIndex, rowElement) => {
        const $cells = $(rowElement).find('td');
        
        // Expected columns: Provider, Model name, Model ID, Regions supported, Launch date, Input modalities, Output modalities
        if ($cells.length >= 7) {
          const provider = $cells.eq(0).text().trim();
          const modelName = $cells.eq(1).text().trim();
          const modelId = $cells.eq(2).text().trim();
          const regionsCell = $cells.eq(3);
          const launchDate = $cells.eq(4).text().trim();
          const inputModalities = $cells.eq(5).text().trim();
          const outputModalities = $cells.eq(6).text().trim();
          
          if (modelName && modelId) {
            // Parse input modalities
            const inputMods = [];
            if (inputModalities.toLowerCase().includes('text')) inputMods.push('text');
            if (inputModalities.toLowerCase().includes('image')) inputMods.push('image');
            if (inputModalities.toLowerCase().includes('audio')) inputMods.push('audio');
            if (inputModalities.toLowerCase().includes('video')) inputMods.push('video');
            
            // Parse output modalities
            const outputMods = [];
            if (outputModalities.toLowerCase().includes('text')) outputMods.push('text');
            if (outputModalities.toLowerCase().includes('chat')) outputMods.push('text'); // Chat is text output
            if (outputModalities.toLowerCase().includes('image')) outputMods.push('image');
            if (outputModalities.toLowerCase().includes('video')) outputMods.push('video');
            if (outputModalities.toLowerCase().includes('embedding')) outputMods.push('embedding');
            
            // Convert model ID format from dots to slashes (e.g., 'ai21.jamba-1-5-large-v1:0' -> 'ai21/jamba-1-5-large-v1:0')
            const formattedModelId = modelId.replace(/\./g, '/');
            
            // Parse regions into array - handle complex HTML structure
            const regionsArray = [];
            if (regionsCell.length > 0) {
              // Check if there are list items (multiple regions)
              const listItems = regionsCell.find('li');
              if (listItems.length > 0) {
                // Multiple regions in list format
                listItems.each((index, item) => {
                  const region = $(item).text().trim();
                  if (region && region !== '-' && region !== '') {
                    regionsArray.push(region);
                  }
                });
              } else {
                // Single region or comma-separated
                const regionsText = regionsCell.text().trim();
                if (regionsText && regionsText !== '-' && regionsText !== '') {
                  const regionList = regionsText
                    .split(/[,\n\s]+/)
                    .map(r => r.trim())
                    .filter(r => r && r !== '-' && r !== '' && r.length > 0);
                  regionsArray.push(...regionList);
                }
              }
            }
            
            // Remove duplicates
            const uniqueRegions = [...new Set(regionsArray)];
            
            // Parse launch date
            let releaseDate = null;
            if (launchDate && launchDate !== '-' && launchDate !== '') {
              // Convert date format like "9/23/2024" to ISO format
              const dateMatch = launchDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
              if (dateMatch) {
                const [, month, day, year] = dateMatch;
                releaseDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
            }
            
            models.push({
              id: formattedModelId,
              name: modelName,
              release_date: releaseDate,
              last_updated: releaseDate, // Use launch date as last updated for now
              attachment: false,
              reasoning: false,
              temperature: true,
              knowledge: null,
              tool_call: true,
              open_weights: true,
              cost: {
                input: null,
                output: null,
              },
              limit: {
                context: null,
                output: null,
              },
              modalities: {
                input: inputMods.length > 0 ? inputMods : ['text'],
                output: outputMods.length > 0 ? outputMods : ['text'],
              },
              // Additional metadata from the table
              provider: provider,
              regions: uniqueRegions.length > 0 ? uniqueRegions : undefined,
              streaming_supported: null, // Not available in this table
              launch_date: launchDate,
            });
          }
        }
      });
    }
  });

  return models;
};

/**
 * Fetches models from Amazon Bedrock documentation and transforms them.
 * @returns {Array} Array of transformed models.
 */
async function fetchBedrockModels() {
  console.log('[Amazon Bedrock] Fetching: https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html');
  
  try {
    const response = await axios.get('https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html');
    const htmlContent = response.data;
    
    const models = transformBedrockModels(htmlContent);
    
    console.log(`[Amazon Bedrock] Done. Models processed: ${models.length}, saved: ${models.length}, errors: 0`);
    return models;
    
  } catch (error) {
    console.error('[Amazon Bedrock] Error fetching models:', error.message);
    return [];
  }
}

export {
  fetchBedrockModels,
  transformBedrockModels,
};