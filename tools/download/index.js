#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetch } from 'node-fetch-native';
import { ModelSchema } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = process.argv.includes('--config')
  ? process.argv[process.argv.indexOf('--config') + 1]
  : './config.json';

/**
 * Ensures a directory exists, creating it recursively if necessary.
 * @param {string} dir - The directory path to ensure exists.
 */
const ensureDirSync = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Extracts the provider name from a model object, sanitizing it for filesystem use.
 * If owned_by/author are missing, uses the first segment of model.id (before '/')
 * @param {Object} model - The model object containing provider information.
 * @returns {string} The sanitized provider name.
 * @example
 * const provider = getProvider({ id: 'openai/gpt-4' }); // Returns 'openai'
 * const provider = getProvider({ owned_by: 'anthropic' }); // Returns 'anthropic'
 */
const getProvider = (model) => {
  if (model.owned_by) return model.owned_by.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (model.author) return model.author.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (model.id && typeof model.id === 'string' && model.id.includes('/')) {
    return model.id.split('/')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
  }
  return 'unknown';
};

/**
 * Extracts and sanitizes the model ID for use as a filename.
 * @param {Object} model - The model object containing ID information.
 * @returns {string} The sanitized model ID.
 * @example
 * const modelId = getModelId({ id: 'gpt-4' }); // Returns 'gpt-4'
 * const modelId = getModelId({ name: 'Claude 3.5' }); // Returns 'Claude_3_5'
 */
const getModelId = (model) => {
  return (model.id || model.name || 'unknown-model').replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Processes a single API endpoint: fetches data, transforms models, and saves them.
 * @param {Object} apiConfig - Configuration object for the API.
 * @param {string} apiConfig.name - Human-readable name for the API (used in logging).
 * @param {string} apiConfig.url - The URL to fetch model data from.
 * @param {string} apiConfig.output - Output directory path for transformed models.
 * @param {string} apiConfig.transform - Name of the transformer module to use.
 * @returns {Object} Result object containing processing statistics.
 * @example
 * const result = await processApi({
 *   name: 'OpenRouter',
 *   url: 'https://openrouter.ai/api/frontend/models',
 *   output: 'providers-openrouter',
 *   transform: 'openrouter'
 * });
 */
const processApi = async (apiConfig) => {
  const { name, url, output, transform } = apiConfig;
  const transformerPath = path.join(__dirname, './transformers', `${transform}.js`);
  
  let transformer;
  
  try {
    const transformerModule = await import(transformerPath);

    transformer = transformerModule.default;
  } catch (e) {
    console.error(`[${name}] ERROR: Could not load transformer '${transform}':`, e.message);

    return { name, error: e.message };
  }

  console.log(`\n[${name}] Fetching: ${url}`);

  let data;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    data = await response.json();
  } catch (e) {
    console.error(`[${name}] ERROR: Fetch failed:`, e.message);

    return { name, error: e.message };
  }

  const models = Array.isArray(data.data) ? data.data : (Array.isArray(data.models) ? data.models : []);

  if (!models.length) {
    console.warn(`[${name}] WARNING: No models found in response.`);
    return { name, models: 0, saved: 0 };
  }

  let saved = 0, errors = 0;

  for (const model of models) {
    try {
      const transformed = transformer(model);
      // Validate with Zod
      const parseResult = ModelSchema.safeParse(transformed);
      
      if (!parseResult.success) {
        errors++;
        console.error(`[${name}] ERROR: Model validation failed for id=${model.id}:`, parseResult.error.issues);
        continue;
      }

      const provider = getProvider(model);
      const modelId = getModelId(model);
      const outDir = path.join(__dirname, output, provider);
  
      ensureDirSync(outDir);
  
      const outPath = path.join(outDir, `${modelId}.json`);
  
      fs.writeFileSync(outPath, JSON.stringify(transformed, null, 2));
  
      saved++;
    } catch (e) {
      errors++;
  
      console.error(`[${name}] ERROR: Failed to transform/save model:`, e.message);
    }
  }
  
  console.log(`[${name}] Done. Models processed: ${models.length}, saved: ${saved}, errors: ${errors}`);
  
  return { name, models: models.length, saved, errors, output };
};

/**
 * Main function that reads the batch configuration and processes all APIs.
 * 
 * @example
 * // Run with default config file (batch-config.json)
 * node scripts/fetch-and-transform-batch.js
 * 
 * // Run with custom config file
 * node scripts/fetch-and-transform-batch.js --config my-config.json
 * 
 * // Example batch-config.json:
 * [
 *   {
 *     "name": "OpenRouter",
 *     "url": "https://openrouter.ai/api/frontend/models",
 *     "output": "providers-openrouter",
 *     "transform": "openrouter"
 *   },
 *   {
 *     "name": "VercelGateway",
 *     "url": "https://ai-gateway.vercel.sh/v1/models",
 *     "output": "providers-vercel",
 *     "transform": "vercel"
 *   }
 * ]
 */
const main = async () => {
  let config;
  
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.error('ERROR: Failed to read config:', e.message);
  
    process.exit(1);
  }
  
  if (!Array.isArray(config)) {
    console.error('ERROR: Config must be an array of API configs.');
  
    process.exit(1);
  }
  
  const results = [];
  
  for (const apiConfig of config) {
    // eslint-disable-next-line no-await-in-loop
    const result = await processApi(apiConfig);
  
    results.push(result);
  }
  
  // Print summary
  console.log('\n=== Batch Summary ===');
  
  for (const r of results) {
    if (r.error) {
      console.log(`[${r.name}] ERROR: ${r.error}`);
    } else {
      console.log(`[${r.name}] Models: ${r.models}, Saved: ${r.saved}, Errors: ${r.errors}, Output: ${r.output}`);
    }
  }
};

main(); 