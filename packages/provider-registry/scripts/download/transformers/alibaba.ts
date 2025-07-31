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
    
    // Look for the model comparison table
    $('table').each((i, table) => {
      const tableText = $(table).text();
      
      // Check if this table contains model information (look for deepseek-r1, deepseek-v3, etc.)
      if (tableText.includes('deepseek-r1') || tableText.includes('deepseek-v3') || tableText.includes('deepseek-r1-distill')) {
        console.log(`[Alibaba] Found DeepSeek model table ${i + 1}`);
        
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          
          // Filter for valid model rows (should have model name in first column)
          if (cells.length >= 6 && cells[0] && cells[0].includes('deepseek-')) {
            const modelName = cells[0];
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
    
    // Look for the model comparison table
    $('table').each((i, table) => {
      const tableText = $(table).text();
      
      // Check if this table contains Kimi model information
      if (tableText.includes('kimi') || tableText.includes('Kimi')) {
        console.log(`[Alibaba] Found Kimi model table ${i + 1}`);
        
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
          
          // Filter for valid model rows (should have model name in first column)
          if (cells.length >= 3 && cells[0] && cells[0].toLowerCase().includes('kimi')) {
            const modelName = cells[0];
            const contextLength = cells[1] || cells[2];
            const maxOutput = cells[2] || cells[3];
            const inputCost = cells[3] || cells[4];
            const outputCost = cells[4] || cells[5];
            
            console.log(`[Alibaba] Found Kimi model: ${modelName}`);
            
            const model: Model = {
              id: kebabCase(modelName),
              name: modelName,
              releaseDate: null,
              lastUpdated: null,
              attachment: false,
              reasoning: false, // Kimi models may support reasoning, but need to verify
              temperature: true, // Most models support temperature
              toolCall: false, // Need to verify Kimi tool calling support
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
                output: parseTokenLimit(maxOutput) 
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