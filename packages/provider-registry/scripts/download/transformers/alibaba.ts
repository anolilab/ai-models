import axios from 'axios';
import * as cheerio from 'cheerio';
import { kebabCase } from '@visulima/string';
import type { Model } from '../../../src/schema.js';

const DEEPSEEK_DOCS_URL = 'https://help.aliyun.com/zh/model-studio/deepseek-api';
const KIMI_DOCS_URL = 'https://help.aliyun.com/zh/model-studio/kimi-api';

/**
 * Fetches Alibaba models (DeepSeek and Kimi) by scraping the documentation pages.
 * @returns Promise that resolves to an array of transformed models
 */
export async function fetchAlibabaModels(): Promise<Model[]> {
  const models: Model[] = [];
  
  // Fetch DeepSeek models
  const deepseekModels = await fetchDeepSeekModels();
  models.push(...deepseekModels);
  
  // Fetch Kimi models
  const kimiModels = await fetchKimiModels();
  models.push(...kimiModels);
  
  console.log(`[Alibaba] Total models extracted: ${models.length} (${deepseekModels.length} DeepSeek + ${kimiModels.length} Kimi)`);
  return models;
}

/**
 * Fetches DeepSeek models from the documentation page.
 */
async function fetchDeepSeekModels(): Promise<Model[]> {
  console.log(`[Alibaba] Fetching DeepSeek model list from: ${DEEPSEEK_DOCS_URL}`);
  try {
    const response = await axios.get(DEEPSEEK_DOCS_URL);
    const $ = cheerio.load(response.data);

    const models: Model[] = [];
    
    // Look for the model comparison table - specifically the one with model names
    $('table').each((i, table) => {
      const tableText = $(table).text();
      
      // Check if this table contains model information (look for deepseek-r1, deepseek-v3, etc.)
      if (tableText.includes('deepseek-r1') || tableText.includes('deepseek-v3') || tableText.includes('deepseek-r1-distill')) {
        console.log(`[Alibaba] Found DeepSeek model table ${i + 1}`);
        
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          
          // Filter for valid model rows - must have model name in first column and be a real model
          if (cells.length >= 6 && cells[0] && isValidDeepSeekModel(cells[0])) {
            const modelName = cleanDeepSeekModelName(cells[0]);
            const contextLength = cells[1];
            const maxInput = cells[2];
            const maxOutput = cells[4];
            const inputCost = cells[5];
            const outputCost = cells[6];
            
            console.log(`[Alibaba] Found DeepSeek model: ${modelName}`);
            
            const model: Model = {
              id: kebabCase(modelName),
              name: modelName,
              releaseDate: null,
              lastUpdated: null,
              attachment: false,
              reasoning: modelName.includes('r1'), // DeepSeek-R1 models support reasoning
              temperature: modelName.includes('v3'), // DeepSeek-V3 supports temperature
              toolCall: modelName.includes('r1') || modelName.includes('v3'), // Both support tool calling
              openWeights: false,
              vision: false,
              extendedThinking: modelName.includes('r1'), // DeepSeek-R1 has extended thinking
              knowledge: null,
              cost: { 
                input: parseCost(inputCost), 
                output: parseCost(outputCost), 
                inputCacheHit: null 
              },
              limit: { 
                context: parseTokenLimit(contextLength), 
                output: parseTokenLimit(maxOutput) 
              },
              modalities: { input: ['text'], output: ['text'] },
              provider: 'Alibaba',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['ALIBABA_API_KEY'],
              providerNpm: '@ai-sdk/openai-compatible',
              providerDoc: DEEPSEEK_DOCS_URL,
              providerModelsDevId: 'alibaba',
            };
            models.push(model);
          }
        });
      }
    });
    
    console.log(`[Alibaba] Extracted ${models.length} DeepSeek models from docs.`);
    return models;
  } catch (error) {
    console.error('[Alibaba] Error fetching DeepSeek models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Fetches Kimi models from the documentation page.
 */
async function fetchKimiModels(): Promise<Model[]> {
  console.log(`[Alibaba] Fetching Kimi model list from: ${KIMI_DOCS_URL}`);
  try {
    const response = await axios.get(KIMI_DOCS_URL);
    const $ = cheerio.load(response.data);

    const models: Model[] = [];
    
    // Look for the model comparison table - specifically the one with Kimi model information
    $('table').each((i, table) => {
      const tableText = $(table).text();
      
      // Check if this table contains Kimi model information
      if (tableText.includes('Moonshot-Kimi-K2-Instruct')) {
        console.log(`[Alibaba] Found Kimi model table ${i + 1}`);
        
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          
          // Filter for valid model rows - must have model name in first column and be a real model
          if (cells.length >= 3 && cells[0] && isValidKimiModel(cells[0])) {
            const modelName = cleanKimiModelName(cells[0]);
            const contextLength = cells[1];
            const inputCost = cells[2];
            const outputCost = cells[3];
            
            console.log(`[Alibaba] Found Kimi model: ${modelName}`);
            
            const model: Model = {
              id: kebabCase(modelName),
              name: modelName,
              releaseDate: null,
              lastUpdated: null,
              attachment: false,
              reasoning: false, // Kimi models don't support reasoning
              temperature: true, // Most models support temperature
              toolCall: false, // Kimi doesn't support tool calling
              openWeights: false,
              vision: false,
              extendedThinking: false,
              knowledge: null,
              cost: { 
                input: parseCost(inputCost), 
                output: parseCost(outputCost), 
                inputCacheHit: null 
              },
              limit: { 
                context: parseTokenLimit(contextLength), 
                output: null // Not specified in Kimi table
              },
              modalities: { input: ['text'], output: ['text'] },
              provider: 'Alibaba',
              streamingSupported: true,
              // Provider metadata
              providerEnv: ['ALIBABA_API_KEY'],
              providerNpm: '@ai-sdk/openai-compatible',
              providerDoc: KIMI_DOCS_URL,
              providerModelsDevId: 'alibaba',
            };
            models.push(model);
          }
        });
      }
    });
    
    console.log(`[Alibaba] Extracted ${models.length} Kimi models from docs.`);
    return models;
  } catch (error) {
    console.error('[Alibaba] Error fetching Kimi models:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Validates if a model name is a valid DeepSeek model (not documentation artifact)
 */
function isValidDeepSeekModel(modelName: string): boolean {
  // Must contain deepseek and be a real model name
  const validModels = [
    'deepseek-r1',
    'deepseek-r1-0528', 
    'deepseek-v3',
    'deepseek-r1-distill-qwen-1.5b',
    'deepseek-r1-distill-qwen-7b',
    'deepseek-r1-distill-qwen-14b',
    'deepseek-r1-distill-qwen-32b',
    'deepseek-r1-distill-llama-8b',
    'deepseek-r1-distill-llama-70b'
  ];
  
  return validModels.some(validModel => modelName.toLowerCase().includes(validModel.toLowerCase()));
}

/**
 * Cleans a DeepSeek model name to remove Chinese text and extract only the model identifier
 */
function cleanDeepSeekModelName(modelName: string): string {
  // Remove Chinese text and extract only the model identifier
  const cleanName = modelName
    .replace(/基于.*$/i, '') // Remove "基于..." (based on...)
    .replace(/参数量为.*$/i, '') // Remove "参数量为..." (parameter count is...)
    .replace(/满血版模型.*$/i, '') // Remove "满血版模型..." (full version model...)
    .replace(/当前能力等同于.*$/i, '') // Remove "当前能力等同于..." (current capability equivalent to...)
    .trim();
  
  // Map to standard names
  if (cleanName.includes('deepseek-r1-distill-qwen-1.5b')) {
    return 'deepseek-r1-distill-qwen-1.5b';
  }
  if (cleanName.includes('deepseek-r1-0528') || cleanName.includes('deepseek-r1-685b')) {
    return 'deepseek-r1-0528';
  }
  if (cleanName.includes('deepseek-v3-0324')) {
    return 'deepseek-v3-0324';
  }
  
  return cleanName;
}

/**
 * Validates if a model name is a valid Kimi model (not documentation artifact)
 */
function isValidKimiModel(modelName: string): boolean {
  // Must contain kimi and be a real model name
  const validModels = [
    'Moonshot-Kimi-K2-Instruct'
  ];
  
  return validModels.some(validModel => modelName.toLowerCase().includes(validModel.toLowerCase()));
}

/**
 * Cleans a Kimi model name to extract only the model identifier
 */
function cleanKimiModelName(modelName: string): string {
  // Map to standard names
  if (modelName.includes('Moonshot-Kimi-K2-Instruct')) {
    return 'Moonshot-Kimi-K2-Instruct';
  }
  if (modelName.includes('Kimi-K2-Instruct')) {
    return 'Kimi-K2-Instruct';
  }
  
  return modelName;
}

/**
 * Parse cost string to number (e.g., "0.004元" -> 0.004)
 */
function parseCost(costStr: string): number | null {
  if (!costStr || costStr === '限时免费体验') return null;
  const match = costStr.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Parse token limit string to number (e.g., "131,072" -> 131072)
 */
function parseTokenLimit(limitStr: string): number | null {
  if (!limitStr) return null;
  const match = limitStr.replace(/,/g, '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function transformAlibabaModels(rawData: any): Model[] {
  // Not used in scraping version, but kept for interface compatibility
  return [];
} 