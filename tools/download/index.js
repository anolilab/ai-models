#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Using built-in fetch (available in Node.js 18+)
import { ModelSchema } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let CONFIG_PATH = './config.json';
let PROVIDER_NAME = null;

// Parse --config argument
const configIndex = args.indexOf('--config');
if (configIndex !== -1 && configIndex + 1 < args.length) {
  CONFIG_PATH = args[configIndex + 1];
}

// Parse --provider argument
const providerIndex = args.indexOf('--provider');
if (providerIndex !== -1 && providerIndex + 1 < args.length) {
  PROVIDER_NAME = args[providerIndex + 1];
}

// Show help if --help is provided
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node index.js [options]

Options:
  --config <path>     Path to config file (default: ./config.json)
  --provider <name>   Process only the specified provider
  --help, -h         Show this help message

Examples:
  node index.js                           # Process all providers
  node index.js --provider "OpenRouter"   # Process only OpenRouter
  node index.js --config ./custom.json    # Use custom config file
  node index.js --provider "Anthropic" --config ./custom.json
`);
  process.exit(0);
}

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
                       transformerModule.fetchDeepSeekModels ||
                       transformerModule.fetchGitHubCopilotModels ||
                       transformerModule.fetchGoogleModels ||
                       transformerModule.fetchGroqModels ||
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
  
  // Filter providers if a specific provider name is provided
  let providersToProcess = config.providers;
  if (PROVIDER_NAME) {
    providersToProcess = config.providers.filter(p => p.name === PROVIDER_NAME);
    if (providersToProcess.length === 0) {
      console.error(`ERROR: Provider "${PROVIDER_NAME}" not found in config.`);
      console.log('Available providers:');
      config.providers.forEach(p => console.log(`  - ${p.name}`));
      process.exit(1);
    }
    console.log(`Processing provider: ${PROVIDER_NAME}`);
  } else {
    console.log(`Processing all ${config.providers.length} providers...`);
  }
  
  const results = [];
  
  for (const providerConfig of providersToProcess) {
    // eslint-disable-next-line no-await-in-loop
    const result = await processProvider(providerConfig);
    results.push(result);
  }
  
  // Print summary
  const summaryTitle = PROVIDER_NAME ? `=== ${PROVIDER_NAME} Summary ===` : '=== Batch Summary ===';
  console.log(`\n${summaryTitle}`);
  
  for (const r of results) {
    if (r.error) {
      console.log(`[${r.name}] ERROR: ${r.error}`);
    } else {
      console.log(`[${r.name}] Models: ${r.models}, Saved: ${r.saved}, Errors: ${r.errors}, Output: ${r.output}`);
    }
  }
};

main(); 