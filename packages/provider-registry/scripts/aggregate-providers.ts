import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Model } from '../src/schema.js';
import { ModelSchema } from '../src/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROVIDERS_DIR = path.resolve(__dirname, '../data/providers');
const SCHEMA_PATH = path.join(__dirname, '../src/schema.ts');
const OUTPUT_JSON = path.join(__dirname, '../data/all-models.json');
const OUTPUT_TS = path.resolve(__dirname, '../src/models-data.ts');

/**
 * Maps provider names to their corresponding icon files
 * Uses lowercase provider names for consistency
 */
const PROVIDER_ICON_MAP: Record<string, string> = {
  // Primary providers with specific icons
  'anthropic': 'anthropic.svg',
  'azure': 'azureai-color.svg',
  'amazon': 'bedrock-color.svg',
  'amazon-bedrock': 'bedrock-color.svg',
  'claude': 'claude-color.svg',
  'deepseek': 'deepseek-color.svg',
  'fireworks': 'fireworks-color.svg',
  'fireworks-ai': 'fireworks-color.svg',
  'google': 'gemini-color.svg',
  'github': 'github.svg',
  'github copilot': 'githubcopilot.svg',
  'grok': 'grok.svg',
  'groq': 'groq.svg',
  'huggingface': 'huggingface-color.svg',
  'hf-inference': 'huggingface-color.svg',
  'inference': 'inference.svg',
  'meta': 'meta-color.svg',
  'meta-llama': 'meta-color.svg',
  'mistral': 'mistral-color.svg',
  'mistralai': 'mistral-color.svg',
  'mistral ai': 'mistral-color.svg',
  'morph': 'morph.svg',
  'ollama': 'ollama.svg',
  'openai': 'openai.svg',
  'openrouter': 'openrouter.svg',
  'requesty': 'requesty.svg',
  'upstage': 'upstage-color.svg',
  'v0': 'v0.svg',
  'venice': 'Venice.svg',
  'vercel': 'vercel.svg',
  'vertexai': 'vertexai-color.svg',
  
  'cohere': 'cohere.png',
  'microsoft': 'azureai-color.svg',
  'stability ai': 'stability-ai.png',
  'perplexity': 'perplexity.png',
  'together': 'together.svg',
  'nvidia': 'nvidia.jpg',
  'inflection': 'inflection.svg',
  'x-ai': 'x-ai.ico',
  'xai': 'x-ai.ico',
  'writer': 'writer.png',
  'luma': 'luma.ico',
  'rekaai': 'rekaai.jpg',
  'sambanova': 'sambanova.png',
  'cerebras': 'cerebras.svg',
  'eleutherai': 'eleutherai.jpg',
  'featherless': 'featherless.svg',
  'featherless-ai': 'featherless.svg',
  'hyperbolic': 'hyperbolic.ico',
  'infermatic': 'infermatic.png',
  'liquid': 'liquid.png',
  'minimax': 'minimaxi.png',
  'nebius': 'nebius.png',
  'nousresearch': 'nousresearch.png',
  'novita': 'novita.ico',
  'nscale': 'nscale.png',
  'opengvlab': 'opengvlab.svg',
  'qwen': 'qwen.ico',
  'sarvamai': 'sarvamai.png',
  'tencent': 'tencent.ico',
  'aion-labs': 'aion-labs.svg',
  'arcee-ai': 'arcee-ai.png',
  'baidu': 'baidu.ico',
  'z-ai': 'z-ai.svg',
  'zai': 'z-ai.svg',
  
  // Providers without icons (empty values)
  'moonshotai': '',
  'inception': '',
  'mancer': '',
  'miatral': '',
  'neversleep': '',
  'nothingiisreal': '',
  'pygmalionai': '',
  'raifle': '',
  'sao10k': '',
  'scb10x': '',
  'shisa-ai': '',
  'sophosympatheia': '',
  'switchpoint': '',
  'thedrummer': '',
  'thudm': '',
  'tngtech': '',
  'undi95': '',
  'agentica-org': '',
  'alfredpros': '',
  'alibaba': '',
  'alpindale': '',
  'anthracite-org': '',
  'arliai': '',
  'bytedance': '',
  'cognitivecomputations': '',
  'gryphe': '',
};

/**
 * Gets the icon filename for a given provider name
 * @param providerName - The provider name (case-insensitive)
 * @returns The icon filename or undefined if not found
 */
function getProviderIcon(providerName: string): string | undefined {
  const normalizedName = providerName.toLowerCase();
  
  return PROVIDER_ICON_MAP[normalizedName];
}

/**
 * Converts snake_case object keys to camelCase recursively
 * @param obj - The object to convert
 * @returns The object with camelCase keys
 */
function convertSnakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertSnakeToCamel);
  }
  
  const converted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    converted[camelKey] = convertSnakeToCamel(value);
  }
  
  return converted;
}

/**
 * Recursively finds all JSON files in a directory and its subdirectories
 * @param dir - The directory to search in
 * @returns Array of file paths to JSON files
 */
function getAllJsonFiles(dir: string): string[] {
  let results: string[] = [];
  
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsonFiles(filePath));
    } else if (file.endsWith('.json')) {
      results.push(filePath);
    }
  });

  return results;
}

/**
 * Aggregates and validates model data from all JSON files in the providers directory
 * @returns Promise resolving to an array of validated Model objects
 */
async function aggregateModels(): Promise<Model[]> {
  const allFiles = getAllJsonFiles(PROVIDERS_DIR);
  const models: Model[] = [];
  
  for (const file of allFiles) {
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(raw);
      
      // Convert snake_case keys to camelCase
      const convertedData = convertSnakeToCamel(data);
      
      // Add provider icon if provider is specified
      if (convertedData.provider) {
        const icon = getProviderIcon(convertedData.provider);
        
        if (icon) {
          convertedData.providerIcon = `icons/${icon}`;
        }
      }
      
      const parsed = ModelSchema.safeParse(convertedData);
  
      if (parsed.success) {
        models.push(parsed.data);
      } else {
        console.warn(`[WARN] Validation failed for ${file}:`, parsed.error.issues);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to process ${file}:`, (err as Error).message);
    }
  }
  
  return models;
}

/**
 * Main function that orchestrates the aggregation process
 * Reads all provider JSON files, validates them against the schema,
 * and generates both JSON and TypeScript output files
 */
async function main(): Promise<void> {
  try {
    // Aggregate and validate models
    const models = await aggregateModels();
  
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(models, null, 2));
  
    console.log(`[DONE] Aggregated ${models.length} models to ${OUTPUT_JSON}`);

    // Generate TypeScript data file for the package
    const tsContent = `// Auto-generated file - do not edit manually\n// Generated from aggregated provider data\n\nimport type { Model } from './schema';\n\nexport const allModels: Model[] = ${JSON.stringify(models, null, 2)} as Model[];\n`;
  
    fs.writeFileSync(OUTPUT_TS, tsContent);
  
    console.log(`[DONE] Generated ${OUTPUT_TS} with ${models.length} models`);
  } catch (error) {
    console.error('Error during aggregation:', error);
  
    process.exit(1);
  }
}

main(); 