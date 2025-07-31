import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Model } from '../../../src/schema.js';

/**
 * Parses a token limit string and converts to number
 * @param limitStr - Limit string in format like "131,072" or "8,192"
 * @returns Parsed limit as number or null if parsing fails
 * @example
 * parseTokenLimit("131,072") // Returns 131072
 * parseTokenLimit("8,192") // Returns 8192
 */
function parseTokenLimit(limitStr: string): number | null {
  if (!limitStr || limitStr === '-' || limitStr === '') {
    return null;
  }
  
  // Remove commas and parse
  const cleanStr = limitStr.replace(/,/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parses a file size string and converts to number (in MB)
 * @param fileSizeStr - File size string in format like "20 MB" or "100 MB"
 * @returns Parsed size as number (in MB) or null if parsing fails
 * @example
 * parseFileSize("20 MB") // Returns 20
 * parseFileSize("100 MB") // Returns 100
 */
function parseFileSize(fileSizeStr: string): number | null {
  if (!fileSizeStr || fileSizeStr === '-' || fileSizeStr === '') {
    return null;
  }
  
  const match = fileSizeStr.match(/(\d+)\s*MB/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Determines if a model supports vision based on its name or characteristics
 * @param modelId - The model ID
 * @returns True if the model supports vision
 */
function supportsVision(modelId: string): boolean {
  // Currently, Groq doesn't have vision models in their standard offering
  // This would need to be updated if they add vision models
  return false;
}

/**
 * Determines if a model supports audio based on its name or characteristics
 * @param modelId - The model ID
 * @returns True if the model supports audio
 */
function supportsAudio(modelId: string): boolean {
  // Whisper models support audio transcription
  return modelId.includes('whisper');
}

/**
 * Determines if a model supports text-to-speech based on its name or characteristics
 * @param modelId - The model ID
 * @returns True if the model supports text-to-speech
 */
function supportsTextToSpeech(modelId: string): boolean {
  // PlayAI models support text-to-speech
  return modelId.includes('playai-tts');
}

/**
 * Determines if a model supports compound/tool use based on its name or characteristics
 * @param modelId - The model ID
 * @returns True if the model supports compound/tool use
 */
function supportsCompound(modelId: string): boolean {
  // Compound models support tool use
  return modelId.includes('compound');
}

/**
 * Determines if a model is a preview/beta model
 * @param modelId - The model ID
 * @returns True if the model is a preview/beta model
 */
function isPreviewModel(modelId: string): boolean {
  return modelId.includes('beta') || modelId.includes('preview');
}

/**
 * Determines input modalities for a model
 * @param modelId - The model ID
 * @param developer - The developer name
 * @returns Array of input modalities
 */
function getInputModalities(modelId: string, developer: string): string[] {
  const modalities: string[] = ['text'];
  
  if (supportsVision(modelId)) {
    modalities.push('image');
  }
  
  if (supportsAudio(modelId)) {
    modalities.push('audio');
  }
  
  return modalities;
}

/**
 * Determines output modalities for a model
 * @param modelId - The model ID
 * @param developer - The developer name
 * @returns Array of output modalities
 */
function getOutputModalities(modelId: string, developer: string): string[] {
  const modalities: string[] = ['text'];
  
  if (supportsTextToSpeech(modelId)) {
    modalities.push('audio');
  }
  
  return modalities;
}

/**
 * Transforms Groq model data from their documentation into the normalized structure.
 * 
 * @param htmlContent - The HTML content from the Groq documentation
 * @returns Array of normalized model objects
 */
function transformGroqModels(htmlContent: string): Model[] {
  const $ = cheerio.load(htmlContent);
  const models: Model[] = [];
  
  // Find all CopyableDocsTable components which contain the model data
  // The tables are rendered as React components with specific structure
  $('div').each((divIndex, divElement) => {
    const $div = $(divElement);
    
    // Look for divs that contain table-like structures with model data
    // The actual table structure is in the React component data
    const $rows = $div.find('tr');
    
    if ($rows.length > 0) {
      $rows.each((rowIndex, rowElement) => {
        const $cells = $(rowElement).find('td');
        
        if ($cells.length >= 5) {
          const modelId = $cells.eq(0).text().trim();
          const developer = $cells.eq(1).text().trim();
          const contextWindow = $cells.eq(2).text().trim();
          const maxCompletionTokens = $cells.eq(3).text().trim();
          const maxFileSize = $cells.eq(4).text().trim();
          
          // Skip if no model ID or if it's a header row
          if (!modelId || modelId === '' || modelId === 'MODEL ID') {
            return;
          }
          
          // Parse context window and completion tokens
          const contextLimit = parseTokenLimit(contextWindow);
          const outputLimit = parseTokenLimit(maxCompletionTokens);
          const fileSizeLimit = parseFileSize(maxFileSize);
          
          // Create the normalized model object
          const model: Model = {
            id: modelId,
            name: modelId,
            provider: developer,
            releaseDate: null,
            lastUpdated: null,
            attachment: false,
            reasoning: false,
            temperature: true,
            toolCall: supportsCompound(modelId),
            openWeights: false,
            vision: supportsVision(modelId),
            extendedThinking: false,
            preview: isPreviewModel(modelId),
            knowledge: null,
            cost: {
              input: null, // Pricing not available in the documentation
              output: null,
              inputCacheHit: null,
            },
            limit: {
              context: contextLimit,
              output: outputLimit,
            },
            modalities: {
              input: getInputModalities(modelId, developer),
              output: getOutputModalities(modelId, developer),
            },
            streamingSupported: true,
            deploymentType: 'cloud',
            cacheRead: false,
            codeExecution: false,
            searchGrounding: false,
            structuredOutputs: false,
            batchMode: false,
            audioGeneration: supportsTextToSpeech(modelId),
            imageGeneration: false,
            compoundSystem: supportsCompound(modelId),
          };
          
          models.push(model);
        }
      });
    }
  });
  
  return models;
}

/**
 * Fetches models from Groq documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchGroqModels(): Promise<Model[]> {
  console.log('[Groq] Fetching: https://console.groq.com/docs/models');
  
  try {
    const response = await axios.get('https://console.groq.com/docs/models');
    const htmlContent = response.data;
    
    const models = transformGroqModels(htmlContent);
    
    console.log(`[Groq] Successfully transformed ${models.length} models`);
    return models;
    
  } catch (error) {
    console.error('[Groq] Error fetching models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export {
  fetchGroqModels,
  transformGroqModels,
}; 