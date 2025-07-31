import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Model } from '../../../src/schema.js';

/**
 * Raw model data extracted from Bedrock documentation table
 */
interface BedrockModelData {
  provider: string;
  modelName: string;
  modelId: string;
  regions: string[];
  launchDate: string;
  inputModalities: string[];
  outputModalities: string[];
}

/**
 * Parses input modalities from text description
 * @param modalitiesText - Text describing input modalities
 * @returns Array of parsed input modalities
 * @example
 * parseInputModalities("Text, Image") // Returns ['text', 'image']
 */
function parseInputModalities(modalitiesText: string): string[] {
  const inputMods: string[] = [];
  const text = modalitiesText.toLowerCase();
  
  if (text.includes('text')) inputMods.push('text');
  if (text.includes('image')) inputMods.push('image');
  if (text.includes('audio')) inputMods.push('audio');
  if (text.includes('video')) inputMods.push('video');
  
  return inputMods;
}

/**
 * Parses output modalities from text description
 * @param modalitiesText - Text describing output modalities
 * @returns Array of parsed output modalities
 * @example
 * parseOutputModalities("Text, Image") // Returns ['text', 'image']
 */
function parseOutputModalities(modalitiesText: string): string[] {
  const outputMods: string[] = [];
  const text = modalitiesText.toLowerCase();
  
  if (text.includes('text')) outputMods.push('text');
  if (text.includes('chat')) outputMods.push('text'); // Chat is text output
  if (text.includes('image')) outputMods.push('image');
  if (text.includes('video')) outputMods.push('video');
  if (text.includes('embedding')) outputMods.push('embedding');
  
  return outputMods;
}

/**
 * Parses regions from HTML cell content
 * @param regionsCell - Cheerio element containing regions data
 * @returns Array of parsed regions
 */
function parseRegions(regionsCell: cheerio.Cheerio<cheerio.Element>): string[] {
  const regionsArray: string[] = [];
  
  if (regionsCell.length > 0) {
    // Check if there are list items (multiple regions)
    const listItems = regionsCell.find('li');
    if (listItems.length > 0) {
      // Multiple regions in list format
      listItems.each((index, item) => {
        const region = regionsCell.find(item).text().trim();
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
  return [...new Set(regionsArray)];
}

/**
 * Parses launch date from text format
 * @param launchDate - Date string in format like "9/23/2024"
 * @returns ISO formatted date string or null if parsing fails
 * @example
 * parseLaunchDate("9/23/2024") // Returns "2024-09-23"
 */
function parseLaunchDate(launchDate: string): string | null {
  if (!launchDate || launchDate === '-' || launchDate === '') {
    return null;
  }
  
  // Convert date format like "9/23/2024" to ISO format
  const dateMatch = launchDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const [, month, day, year] = dateMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

/**
 * Formats model ID by converting dots to slashes
 * @param modelId - Original model ID
 * @returns Formatted model ID
 * @example
 * formatModelId("ai21.jamba-1-5-large-v1:0") // Returns "ai21/jamba-1-5-large-v1:0"
 */
function formatModelId(modelId: string): string {
  return modelId.replace(/\./g, '/');
}

/**
 * Transforms Amazon Bedrock model data from their model lifecycle documentation page into the normalized structure.
 * 
 * @param htmlContent - The HTML content from the Amazon Bedrock model lifecycle page
 * @returns Array of normalized model objects
 */
function transformBedrockModels(htmlContent: string): Model[] {
  const $ = cheerio.load(htmlContent);
  const models: Model[] = [];

  // Parse the Active versions table (first table with Provider, Model name, Model ID, etc.)
  $('table').each((tableIndex, tableElement) => {
    const $table = $(tableElement);
    const $rows = $table.find('tbody tr');
    
    // Check if this is the active versions table (has "Provider" and "Model name" in header)
    const $header = $table.find('thead tr th');
    if ($header.length >= 7 && 
        $header.eq(0).text().trim() === 'Provider' && 
        $header.eq(1).text().trim() === 'Model name') {
      
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
            const inputMods = parseInputModalities(inputModalities);
            
            // Parse output modalities
            const outputMods = parseOutputModalities(outputModalities);
            
            // Convert model ID format from dots to slashes
            const formattedModelId = formatModelId(modelId);
            
            // Parse regions into array
            const regionsArray = parseRegions(regionsCell);
            
            // Parse launch date
            const releaseDate = parseLaunchDate(launchDate);
            
            models.push({
              id: formattedModelId,
              name: modelName,
              releaseDate: releaseDate,
              lastUpdated: releaseDate, // Use launch date as last updated for now
              attachment: false,
              reasoning: false,
              temperature: true,
              knowledge: null,
              toolCall: true,
              openWeights: true,
              cost: {
                input: null,
                output: null,
                inputCacheHit: null,
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
              regions: regionsArray.length > 0 ? regionsArray : undefined,
              streamingSupported: null, // Not available in this table
              launchDate: launchDate,
            });
          }
        }
      });
    }
  });

  return models;
}

/**
 * Fetches models from Amazon Bedrock documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchBedrockModels(): Promise<Model[]> {
  console.log('[Amazon Bedrock] Fetching: https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html');
  
  try {
    const response = await axios.get('https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html');
    const htmlContent = response.data;
    
    const models = transformBedrockModels(htmlContent);
    
    return models;
    
  } catch (error) {
    console.error('[Amazon Bedrock] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchBedrockModels,
  transformBedrockModels,
}; 