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
 * const provider = getProvider({ provider: 'AI21 Labs' }); // Returns 'AI21_Labs'
 */
const getProvider = (model) => {
  if (model.owned_by) return model.owned_by.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (model.author) return model.author.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (model.provider) return model.provider.replace(/[^a-zA-Z0-9._-]/g, '_');
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
 * Processes a single provider: fetches data, transforms models, and saves them.
 * @param {Object} providerConfig - Configuration object for the provider.
 * @param {string} providerConfig.name - Human-readable name for the provider (used in logging).
 * @param {string} providerConfig.transformer - Path to the transformer module to use.
 * @param {string} providerConfig.output - Output directory path for transformed models.
 * @returns {Object} Result object containing processing statistics.
 */
const processProvider = async (providerConfig) => {
  const { name, transformer, output } = providerConfig;
  const transformerPath = path.resolve(__dirname, transformer);
  
  let transformerModule;
  
  try {
    transformerModule = await import(transformerPath);
  } catch (e) {
    console.error(`[${name}] ERROR: Could not load transformer '${transformer}':`, e.message);
    return { name, error: e.message };
  }

  // Get the fetch function from the transformer
  const fetchFunction = transformerModule.fetchAzureModels || 
                       transformerModule.fetchOpenRouterModels || 
                       transformerModule.fetchVercelModels || 
                       transformerModule.fetchBedrockModels || 
                       transformerModule.fetchAnthropicModels ||
                       transformerModule.default;

  if (!fetchFunction) {
    console.error(`[${name}] ERROR: No fetch function found in transformer`);
    return { name, error: 'No fetch function found' };
  }

  let models = [];
  
  try {
    models = await fetchFunction();
  } catch (e) {
    console.error(`[${name}] ERROR: Fetch failed:`, e.message);
    return { name, error: e.message };
  }

  if (!models.length) {
    console.warn(`[${name}] WARNING: No models found.`);
    return { name, models: 0, saved: 0 };
  }

  let saved = 0, errors = 0;

  for (const model of models) {
    try {
      // Validate with Zod
      const parseResult = ModelSchema.safeParse(model);
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
      fs.writeFileSync(outPath, JSON.stringify(model, null, 2));
      saved++;
    } catch (e) {
      errors++;
      console.error(`[${name}] ERROR: Failed to save model:`, e.message);
    }
  }
  
  console.log(`[${name}] Done. Models processed: ${models.length}, saved: ${saved}, errors: ${errors}`);
  
  return { name, models: models.length, saved, errors, output };
};

/**
 * Main function that reads the configuration and processes all providers.
 */
const main = async () => {
  let config;
  
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.error('ERROR: Failed to read config:', e.message);
    process.exit(1);
  }
  
  if (!config.providers || !Array.isArray(config.providers)) {
    console.error('ERROR: Config must have a "providers" array.');
    process.exit(1);
  }
  
  const results = [];
  
  for (const providerConfig of config.providers) {
    // eslint-disable-next-line no-await-in-loop
    const result = await processProvider(providerConfig);
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