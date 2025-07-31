import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kebabCase } from '@visulima/string';
import type { Model } from '../src/schema.js';
import { ModelSchema } from '../src/schema.js';
import { BRAND_NAME_MAP } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROVIDERS_DIR = path.resolve(__dirname, '../data/providers');
const OPENROUTER_DIR = path.resolve(__dirname, '../data/providers/openrouter');
const OUTPUT_JSON = path.join(__dirname, '../data/all-models.json');
const OUTPUT_TS = path.resolve(__dirname, '../src/models-data.ts');

/**
 * Maps directory names to proper brand names
 * @param directoryName - The directory name from the file path
 * @returns The proper brand name
 */
const getBrandName = (directoryName: string): string => {
  return BRAND_NAME_MAP[directoryName] || directoryName;
};

/**
 * Extracts the main provider name from the file path
 * @param filePath - The path to the JSON file
 * @returns The main provider name or empty string if not found
 */
const getMainProviderFromPath = (filePath: string): string => {
  // Path format: .../data/providers/{mainProvider}/{subProvider}/model.json
  const pathParts = filePath.split(path.sep);
  const providersIndex = pathParts.findIndex(part => part === 'providers');
  
  if (providersIndex === -1 || providersIndex + 1 >= pathParts.length) {
    return '';
  }
  
  const directoryName = pathParts[providersIndex + 1];
  return getBrandName(directoryName);
};

/**
 * Generates a normalized provider ID from the file path and provider field
 * @param filePath - The path to the JSON file
 * @param provider - The provider field from the model data
 * @returns The normalized provider ID
 */
const generateProviderId = (filePath: string, provider?: string): string => {
  // Extract the main provider from the file path
  const mainProvider = getMainProviderFromPath(filePath);
  const pathParts = filePath.split(path.sep);
  const providersIndex = pathParts.findIndex(part => part === 'providers');
  
  if (providersIndex === -1 || providersIndex + 1 >= pathParts.length) {
    return '';
  }
  
  const subProvider = pathParts[providersIndex + 2];
  
  // Normalize the main provider name using kebabCase
  const normalizedMainProvider = kebabCase(mainProvider);
  
  // If there's no sub-provider or it's the same as main provider, return just the main provider
  if (!subProvider || subProvider === mainProvider) {
    return normalizedMainProvider;
  }
  
  // If there's a provider field, use it to determine the sub-provider
  let subProviderName = subProvider;
  if (provider) {
    // Extract sub-provider from the provider field (e.g., "DeepSeek / Meta" -> "DeepSeek / Meta")
    subProviderName = provider;
  }
  
  // Normalize the sub-provider name using kebabCase
  const normalizedSubProvider = kebabCase(subProviderName);
  
  // If main and sub provider are the same after normalization, return just the main provider
  if (normalizedMainProvider === normalizedSubProvider) {
    return normalizedMainProvider;
  }
  
  return `${normalizedMainProvider}/${normalizedSubProvider}`;
};

/**
 * Converts snake_case object keys to camelCase recursively
 * @param obj - The object to convert
 * @returns The object with camelCase keys
 */
const convertSnakeToCamel = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertSnakeToCamel);
  }
  
  const converted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    converted[camelKey] = convertSnakeToCamel(value);
  }
  
  return converted;
};

/**
 * Recursively finds all JSON files in a directory and its subdirectories
 * @param dir - The directory to search in
 * @returns Array of file paths to JSON files
 */
const getAllJsonFiles = (dir: string): string[] => {
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
};

/**
 * Normalizes a model name for comparison
 * @param name - The model name to normalize
 * @returns The normalized name
 */
const normalizeModelName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .replace(/\s+/g, ''); // Remove spaces
};

/**
 * Loads OpenRouter data as a reference for filling missing fields
 * @returns Map of normalized model names to OpenRouter model data
 */
const loadOpenRouterReference = (): Map<string, any> => {
  const referenceMap = new Map<string, any>();
  
  if (!fs.existsSync(OPENROUTER_DIR)) {
    console.warn('[WARN] OpenRouter directory not found, skipping reference data');
    return referenceMap;
  }
  
  const openRouterFiles = getAllJsonFiles(OPENROUTER_DIR);
  
  for (const file of openRouterFiles) {
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(raw);
      
      if (data.name) {
        const normalizedName = normalizeModelName(data.name);
        referenceMap.set(normalizedName, data);
      }
    } catch (err) {
      console.warn(`[WARN] Failed to load OpenRouter reference file ${file}:`, (err as Error).message);
    }
  }
  
  console.log(`[INFO] Loaded ${referenceMap.size} OpenRouter models as reference`);
  return referenceMap;
};

/**
 * Fills missing fields from OpenRouter reference data
 * @param modelData - The model data to fill
 * @param referenceMap - Map of OpenRouter reference data
 * @returns The enhanced model data
 */
const fillMissingFieldsFromReference = (modelData: any, referenceMap: Map<string, any>): any => {
  if (!modelData.name) {
    return modelData;
  }
  
  const normalizedName = normalizeModelName(modelData.name);
  const referenceData = referenceMap.get(normalizedName);
  
  if (!referenceData) {
    return modelData;
  }
  
  // Create a copy to avoid mutating the original
  const enhancedData = { ...modelData };
  let fieldsFilled = 0;
  
  // Fields to fill from reference (excluding cost and input/output keys)
  const fieldsToFill = [
    'releaseDate',
    'lastUpdated',
    'launchDate',
    'trainingCutoff',
    'knowledge',
    'vision',
    'extendedThinking',
    'preview',
    'streamingSupported',
    'deploymentType',
    'version',
    'cacheRead',
    'codeExecution',
    'searchGrounding',
    'structuredOutputs',
    'batchMode',
    'audioGeneration',
    'imageGeneration',
    'compoundSystem',
    'regions',
    'description',
    'ownedBy',
    'originalModelId',
    'providerStatus',
    'supportsTools',
    'supportsStructuredOutput'
  ];
  
  // Fill missing fields from reference
  for (const field of fieldsToFill) {
    if (enhancedData[field] === null || enhancedData[field] === undefined) {
      if (referenceData[field] !== null && referenceData[field] !== undefined) {
        enhancedData[field] = referenceData[field];
        fieldsFilled++;
      }
    }
  }
  
  // Handle nested objects
  if (enhancedData.limit) {
    if (!enhancedData.limit.context && referenceData.limit?.context) {
      enhancedData.limit.context = referenceData.limit.context;
      fieldsFilled++;
    }
    if ((enhancedData.limit.output === null || enhancedData.limit.output === undefined) && referenceData.limit?.output) {
      enhancedData.limit.output = referenceData.limit.output;
      fieldsFilled++;
    }
  }
  
  if (enhancedData.modalities) {
    if (!enhancedData.modalities.input?.length && referenceData.modalities?.input?.length) {
      enhancedData.modalities.input = referenceData.modalities.input;
      fieldsFilled++;
    }
    if (!enhancedData.modalities.output?.length && referenceData.modalities?.output?.length) {
      enhancedData.modalities.output = referenceData.modalities.output;
      fieldsFilled++;
    }
  }
  
  if (enhancedData.versions) {
    if (!enhancedData.versions.stable && referenceData.versions?.stable) {
      enhancedData.versions.stable = referenceData.versions.stable;
      fieldsFilled++;
    }
    if (!enhancedData.versions.preview && referenceData.versions?.preview) {
      enhancedData.versions.preview = referenceData.versions.preview;
      fieldsFilled++;
    }
  }
  
  if (fieldsFilled > 0) {
    console.log(`[INFO] Filled ${fieldsFilled} missing fields for model "${modelData.name}" from OpenRouter reference`);
  }
  
  return enhancedData;
};

/**
 * Aggregates and validates model data from all JSON files in the providers directory
 * @returns Promise resolving to an array of validated Model objects
 */
const aggregateModels = async (): Promise<Model[]> => {
  // Load OpenRouter reference data first
  const referenceMap = loadOpenRouterReference();
  
  const allFiles = getAllJsonFiles(PROVIDERS_DIR);
  const models: Model[] = [];
  
  for (const file of allFiles) {
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(raw);
      
      // Convert snake_case keys to camelCase
      const convertedData = convertSnakeToCamel(data) as Record<string, unknown>;
      
      // Store the original provider field (sub-provider information) before overwriting
      const originalProvider = convertedData.provider as string | undefined;
      
      // Set the provider field to the main provider name from the file path
      const mainProvider = getMainProviderFromPath(file);
      if (mainProvider) {
        convertedData.provider = mainProvider;
      }
      
      // Generate provider ID from file path and original provider field (sub-provider)
      convertedData.providerId = generateProviderId(file, originalProvider);
      
      // Fill missing fields from OpenRouter reference data
      const enhancedData = fillMissingFieldsFromReference(convertedData, referenceMap);
      
      const parsed = ModelSchema.safeParse(enhancedData);
  
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
};

/**
 * Main function that orchestrates the aggregation process
 * Reads all provider JSON files, validates them against the schema,
 * and generates both JSON and TypeScript output files
 */
const main = async (): Promise<void> => {
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
};

main(); 