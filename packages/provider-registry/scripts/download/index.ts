#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModelSchema, type Model } from '../../src/schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Command line arguments interface
 */
interface CliArgs {
  configPath: string;
  outputPath: string;
  providerName: string | null;
}

/**
 * Provider configuration interface
 */
interface ProviderConfig {
  name: string;
  transformer: string;
  output: string;
}

/**
 * Processing result interface
 */
interface ProcessingResult {
  name: string;
  models?: number;
  saved?: number;
  errors?: number;
  output?: string;
  error?: string;
}

/**
 * Configuration file interface
 */
interface Config {
  providers: ProviderConfig[];
}

/**
 * Transformer module interface
 */
interface TransformerModule {
  fetchAzureModels?: () => Promise<Model[]>;
  fetchOpenRouterModels?: () => Promise<Model[]>;
  fetchVercelModels?: () => Promise<Model[]>;
  fetchBedrockModels?: () => Promise<Model[]>;
  fetchAnthropicModels?: () => Promise<Model[]>;
  fetchDeepSeekModels?: () => Promise<Model[]>;
  fetchGitHubCopilotModels?: () => Promise<Model[]>;
  fetchGoogleModels?: () => Promise<Model[]>;
  fetchGroqModels?: () => Promise<Model[]>;
  fetchHuggingFaceModels?: () => Promise<Model[]>;
  fetchLlamaModels?: () => Promise<Model[]>;
  default?: () => Promise<Model[]>;
}

/**
 * Parses command line arguments and returns configuration
 * @returns Parsed CLI arguments
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let configPath = path.join(__dirname, 'config.json');
  const outputPath = path.join(__dirname, '../../data/providers');
  let providerName: string | null = null;

  // Parse --config argument
  const configIndex = args.indexOf('--config');
  if (configIndex !== -1 && configIndex + 1 < args.length) {
    configPath = args[configIndex + 1];
  }

  // Parse --provider argument
  const providerIndex = args.indexOf('--provider');
  if (providerIndex !== -1 && providerIndex + 1 < args.length) {
    providerName = args[providerIndex + 1];
  }

  return { configPath, outputPath, providerName };
}

/**
 * Shows help information and exits
 */
function showHelp(): never {
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
 * @param dir - The directory path to ensure exists
 */
function ensureDirSync(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Extracts the provider name from a model object, sanitizing it for filesystem use.
 * If owned_by/author are missing, uses the first segment of model.id (before '/')
 * @param model - The model object containing provider information
 * @returns The sanitized provider name
 * @example
 * const provider = getProvider({ id: 'openai/gpt-4' }); // Returns 'openai'
 * const provider = getProvider({ owned_by: 'anthropic' }); // Returns 'anthropic'
 * const provider = getProvider({ provider: 'AI21 Labs' }); // Returns 'AI21_Labs'
 */
function getProvider(model: Model): string {
  if (model.owned_by) return model.owned_by.replace(/[^a-zA-Z0-9._-]/g, '_');
  if ('author' in model && model.author) return model.author.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (model.provider) return model.provider.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (model.id && typeof model.id === 'string' && model.id.includes('/')) {
    return model.id.split('/')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
  }
  return 'unknown';
}

/**
 * Extracts and sanitizes the model ID for use as a filename.
 * @param model - The model object containing ID information
 * @returns The sanitized model ID
 * @example
 * const modelId = getModelId({ id: 'gpt-4' }); // Returns 'gpt-4'
 * const modelId = getModelId({ name: 'Claude 3.5' }); // Returns 'Claude_3_5'
 */
function getModelId(model: Model): string {
  return (model.id || model.name || 'unknown-model').replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Gets the fetch function from a transformer module
 * @param transformerModule - The imported transformer module
 * @returns The fetch function or null if not found
 */
function getFetchFunction(transformerModule: TransformerModule): (() => Promise<Model[]>) | null {
  return transformerModule.fetchAzureModels || 
         transformerModule.fetchOpenRouterModels || 
         transformerModule.fetchVercelModels || 
         transformerModule.fetchBedrockModels || 
         transformerModule.fetchAnthropicModels ||
         transformerModule.fetchDeepSeekModels ||
         transformerModule.fetchGitHubCopilotModels ||
         transformerModule.fetchGoogleModels ||
         transformerModule.fetchGroqModels ||
         transformerModule.fetchHuggingFaceModels ||
         transformerModule.fetchLlamaModels ||
         transformerModule.default ||
         null;
}

/**
 * Processes a single provider: fetches data, transforms models, and saves them.
 * @param providerConfig - Configuration object for the provider
 * @param outputPath - Base output directory path
 * @returns Result object containing processing statistics
 */
async function processProvider(providerConfig: ProviderConfig, outputPath: string): Promise<ProcessingResult> {
  const { name, transformer, output } = providerConfig;
  
  // Validate provider name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error(`Invalid provider name: "${name}". Provider name must be a non-empty string.`);
  }
  
  // Validate transformer path
  if (!transformer || typeof transformer !== 'string' || transformer.trim() === '') {
    throw new Error(`Invalid transformer path for provider "${name}": "${transformer}". Transformer path must be a non-empty string.`);
  }
  
  // Validate output path
  if (!output || typeof output !== 'string' || output.trim() === '') {
    throw new Error(`Invalid output path for provider "${name}": "${output}". Output path must be a non-empty string.`);
  }
  
  const transformerPath = path.resolve(__dirname, transformer);
  
  let transformerModule: TransformerModule;
  
  try {
    transformerModule = await import(transformerPath);
  } catch (e) {
    const error = new Error(`Could not load transformer '${transformer}' for provider "${name}": ${e instanceof Error ? e.message : String(e)}`);
    console.error(`[${name}] ERROR: ${error.message}`);
    return { name, error: error.message };
  }

  // Get the fetch function from the transformer
  const fetchFunction = getFetchFunction(transformerModule);

  if (!fetchFunction) {
    console.error(`[${name}] ERROR: No fetch function found in transformer`);
    return { name, error: 'No fetch function found' };
  }

  let models: Model[] = [];
  
  try {
    models = await fetchFunction();
  } catch (e) {
    console.error(`[${name}] ERROR: Fetch failed:`, e instanceof Error ? e.message : String(e));
    return { name, error: e instanceof Error ? e.message : String(e) };
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
      const outDir = path.join(outputPath, output, provider);

      ensureDirSync(outDir);
      
      const outPath = path.join(outDir, `${modelId}.json`);
      
      fs.writeFileSync(outPath, JSON.stringify(model, null, 2));
      
      saved++;
    } catch (e) {
      errors++;
      console.error(`[${name}] ERROR: Failed to save model:`, e instanceof Error ? e.message : String(e));
    }
  }
  
  console.log(`[${name}] Done. Models processed: ${models.length}, saved: ${saved}, errors: ${errors}`);
  
  return { name, models: models.length, saved, errors, output };
}

/**
 * Validates the configuration object
 * @param config - The configuration object to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: unknown): asserts config is Config {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object');
  }
  
  const configObj = config as Record<string, unknown>;
  
  if (!configObj.providers || !Array.isArray(configObj.providers)) {
    throw new Error('Config must have a "providers" array.');
  }
  
  // Validate each provider in the config
  for (let i = 0; i < configObj.providers.length; i++) {
    const provider = configObj.providers[i];
    if (!provider || typeof provider !== 'object') {
      throw new Error(`Provider at index ${i} is invalid: must be an object`);
    }
    
    const providerObj = provider as Record<string, unknown>;
    
    if (!providerObj.name || typeof providerObj.name !== 'string' || providerObj.name.trim() === '') {
      throw new Error(`Provider at index ${i} has invalid name: "${providerObj.name}". Name must be a non-empty string.`);
    }
    if (!providerObj.transformer || typeof providerObj.transformer !== 'string' || providerObj.transformer.trim() === '') {
      throw new Error(`Provider "${providerObj.name}" has invalid transformer path: "${providerObj.transformer}". Transformer path must be a non-empty string.`);
    }
    if (!providerObj.output || typeof providerObj.output !== 'string' || providerObj.output.trim() === '') {
      throw new Error(`Provider "${providerObj.output}" has invalid output path: "${providerObj.output}". Output path must be a non-empty string.`);
    }
  }
}

/**
 * Main function that reads the configuration and processes all providers.
 */
async function main(): Promise<void> {
  const args = parseArgs();
  
  // Show help if --help is provided
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
  }
  
  let config: Config;
  
  try {
    const configContent = fs.readFileSync(args.configPath, 'utf8');
    const parsedConfig = JSON.parse(configContent);
    validateConfig(parsedConfig);
    config = parsedConfig;
  } catch (e) {
    console.error('ERROR: Failed to read config:', e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
  
  // Filter providers if a specific provider name is provided
  let providersToProcess = config.providers;
  if (args.providerName) {
    // Validate that the provided provider name is correct
    if (!args.providerName || typeof args.providerName !== 'string' || args.providerName.trim() === '') {
      throw new Error(`Invalid provider name: "${args.providerName}". Provider name must be a non-empty string.`);
    }
    
    providersToProcess = config.providers.filter(p => p.name.toLowerCase() === args.providerName!.toLowerCase());
    if (providersToProcess.length === 0) {
      const availableProviders = config.providers.map(p => p.name.toLowerCase()).join(', ');
      throw new Error(`Provider "${args.providerName}" not found in config. Available providers: ${availableProviders}`);
    }
    console.log(`Processing provider: ${args.providerName}`);
  } else {
    console.log(`Processing all ${config.providers.length} providers...`);
  }
  
  const results: ProcessingResult[] = [];
  
  for (const providerConfig of providersToProcess) {
    // eslint-disable-next-line no-await-in-loop
    const result = await processProvider(providerConfig, args.outputPath);
    results.push(result);
  }
  
  // Print summary
  const summaryTitle = args.providerName ? `=== ${args.providerName} Summary ===` : '=== Batch Summary ===';
  console.log(`\n${summaryTitle}`);
  
  for (const r of results) {
    if (r.error) {
      console.log(`[${r.name}] ERROR: ${r.error}`);
    } else {
      console.log(`[${r.name}] Models: ${r.models}, Saved: ${r.saved}, Errors: ${r.errors}, Output: ${r.output}`);
    }
  }
}

// Wrap main function call in try-catch to handle thrown errors
try {
  main().catch((error) => {
    console.error('ERROR:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
} catch (error) {
  console.error('ERROR:', error instanceof Error ? error.message : String(error));
  process.exit(1);
} 