import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { kebabCase } from "@visulima/string";
import axios from "axios";

import type { Model } from "../src/schema.js";
import { ModelSchema } from "../src/schema.js";
import { BRAND_NAME_MAP, PROVIDER_ICON_MAP } from "./config.js";

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = dirname(__filename);

const PROVIDERS_DIR = resolve(__dirname, "../data/providers");
const OPENROUTER_DIR = resolve(__dirname, "../data/providers/openrouter");
const OUTPUT_JSON = join(__dirname, "../data/all-models.json");
const OUTPUT_API_JSON = join(__dirname, "../public/api.json");

/**
 * Adds icon information to models based on their provider
 * @param models Array of models to add icons to
 * @returns Array of models with icon information
 */
const addIconInformation = (models: Model[]): Model[] => {
    console.log("[ICONS] Adding icon information to models...");

    const modelsWithIcons = models.map((model) => {
        if (!model.provider) {
            return model;
        }

        // Try to find icon for the provider
        const iconName = PROVIDER_ICON_MAP[model.provider.toLowerCase()];

        if (iconName) {
            return {
                ...model,
                icon: iconName,
            };
        }

        // If no icon found, return model without icon
        return model;
    });

    const modelsWithIconsCount = modelsWithIcons.filter((m) => m.icon).length;

    console.log(`[ICONS] Added icons to ${modelsWithIconsCount} out of ${models.length} models`);

    return modelsWithIcons;
};

/**
 * Helicone API response structure
 */
interface HeliconeCostData {
    input_cost_per_1m: number;
    model: string;
    operator: string;
    output_cost_per_1m: number;
    per_call?: number;
    per_image?: number;
    provider: string;
    show_in_playground: boolean;
}

interface HeliconeApiResponse {
    data: HeliconeCostData[];
    metadata: {
        note: string;
        operators_explained: Record<string, string>;
        total_models: number;
    };
}

/**
 * Fetches pricing data from Helicone API
 * @returns Promise that resolves to pricing data
 */
async function fetchHeliconePricing(): Promise<HeliconeCostData[]> {
    const url = "https://helicone.ai/api/llm-costs";

    console.log(`[Helicone] Fetching pricing data from: ${url}`);

    try {
        const response = await axios.get<HeliconeApiResponse>(url, {
            headers: {
                Accept: "application/json",
                "User-Agent": "AI-Models-Provider-Registry/1.0",
            },
            timeout: 30_000, // 30 second timeout
        });

        console.log(`[Helicone] Successfully fetched ${response.data.data.length} pricing records`);
        console.log(`[Helicone] Total models available: ${response.data.metadata.total_models}`);

        return response.data.data;
    } catch (error) {
        console.error("[Helicone] Error fetching pricing data:", error instanceof Error ? error.message : String(error));

        return [];
    }
}

/**
 * Enriches models with pricing data from Helicone
 * @param models Array of models to enrich
 * @returns Promise that resolves to enriched models
 */
async function enrichModelsWithPricing(models: Model[]): Promise<Model[]> {
    console.log(`[Helicone] Enriching ${models.length} models with pricing data`);

    // Fetch all pricing data from Helicone
    const pricingData = await fetchHeliconePricing();

    if (pricingData.length === 0) {
        console.warn("[Helicone] No pricing data available, returning original models");

        return models;
    }

    // Create a map for quick lookup
    const pricingMap = new Map<string, HeliconeCostData>();

    for (const pricing of pricingData) {
        const key = `${pricing.provider.toLowerCase()}-${pricing.model.toLowerCase()}`;

        pricingMap.set(key, pricing);
    }

    // Enrich models with pricing data
    const enrichedModels = models.map((model) => {
        // Try to find matching pricing data
        const modelName = model.name?.toLowerCase() || model.id.toLowerCase();
        const providerName = model.provider?.toLowerCase() || "";

        // Try different matching strategies
        let pricing: HeliconeCostData | undefined;

        // Strategy 1: Exact provider-model match
        const exactKey = `${providerName}-${modelName}`;

        pricing = pricingMap.get(exactKey);

        // Strategy 2: Model name contains match
        if (!pricing) {
            for (const [key, data] of pricingMap.entries()) {
                if (key.includes(modelName) || modelName.includes(data.model.toLowerCase())) {
                    pricing = data;
                    break;
                }
            }
        }

        // Strategy 3: Provider match and model name similarity
        if (!pricing && providerName) {
            for (const [key, data] of pricingMap.entries()) {
                if (key.startsWith(providerName) && (modelName.includes(data.model.toLowerCase()) || data.model.toLowerCase().includes(modelName))) {
                    pricing = data;
                    break;
                }
            }
        }

        // Update model with pricing data if found
        if (pricing) {
            return {
                ...model,
                cost: {
                    ...model.cost,
                    input: model.cost.input ?? pricing.input_cost_per_1m / 1000, // Convert from per 1M to per 1K tokens
                    output: model.cost.output ?? pricing.output_cost_per_1m / 1000, // Convert from per 1M to per 1K tokens
                },
            };
        }

        return model;
    });

    const enrichedCount = enrichedModels.filter(
        (model, index) => model.cost.input !== models[index].cost.input || model.cost.output !== models[index].cost.output,
    ).length;

    console.log(`[Helicone] Enriched ${enrichedCount} models with pricing data`);

    return enrichedModels;
}

/**
 * Maps directory names to proper brand names
 * @param directoryName The directory name from the file path
 * @returns The proper brand name
 */
const getBrandName = (directoryName: string): string => BRAND_NAME_MAP[directoryName] || directoryName;

/**
 * Extracts the main provider name from the file path
 * @param filePath The path to the JSON file
 * @returns The main provider name or empty string if not found
 */
const getMainProviderFromPath = (filePath: string): string => {
    // Path format: .../data/providers/{mainProvider}/{subProvider}/model.json
    const pathParts = filePath.split(sep);
    const providersIndex = pathParts.indexOf("providers");

    if (providersIndex === -1 || providersIndex + 1 >= pathParts.length) {
        return "";
    }

    const directoryName = pathParts[providersIndex + 1];

    return getBrandName(directoryName);
};

/**
 * Generates a normalized provider ID from the file path and provider field
 * @param filePath The path to the JSON file
 * @param provider The provider field from the model data
 * @returns The normalized provider ID
 */
const generateProviderId = (filePath: string, provider?: string): string => {
    // Extract the main provider from the file path
    const mainProvider = getMainProviderFromPath(filePath);
    const pathParts = filePath.split(sep);
    const providersIndex = pathParts.indexOf("providers");

    if (providersIndex === -1 || providersIndex + 1 >= pathParts.length) {
        return "";
    }

    const subProvider = pathParts[providersIndex + 2];

    // Normalize the main provider name using kebabCase
    const normalizedMainProvider = kebabCase(mainProvider);

    // Special case for ModelScope - always return just the main provider
    if (normalizedMainProvider === "modelscope") {
        return normalizedMainProvider;
    }

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
 * @param obj The object to convert
 * @returns The object with camelCase keys
 */
const convertSnakeToCamel = (object: unknown): unknown => {
    if (object === null || typeof object !== "object") {
        return object;
    }

    if (Array.isArray(object)) {
        return object.map(convertSnakeToCamel);
    }

    const converted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(object as Record<string, unknown>)) {
        const camelKey = key.replaceAll(/_([a-z])/g, (match, letter) => letter.toUpperCase());

        converted[camelKey] = convertSnakeToCamel(value);
    }

    return converted;
};

/**
 * Recursively finds all JSON files in a directory and its subdirectories
 * @param dir The directory to search in
 * @returns Array of file paths to JSON files
 */
const getAllJsonFiles = (dir: string): string[] => {
    let results: string[] = [];

    const list = readdirSync(dir);

    list.forEach((file) => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(getAllJsonFiles(filePath));
        } else if (file.endsWith(".json")) {
            results.push(filePath);
        }
    });

    return results;
};

/**
 * Normalizes a model name for comparison
 * @param name The model name to normalize
 * @returns The normalized name
 */
const normalizeModelName = (name: string): string =>
    name
        .toLowerCase()
        .replaceAll(/[^a-z0-9]/g, "") // Remove all non-alphanumeric characters
        .replaceAll(/\s+/g, "") // Remove spaces
;

/**
 * Loads OpenRouter data as a reference for filling missing fields
 * @returns Map of normalized model names to OpenRouter model data
 */
const loadOpenRouterReference = (): Map<string, any> => {
    const referenceMap = new Map<string, any>();

    if (!existsSync(OPENROUTER_DIR)) {
        console.warn("[WARN] OpenRouter directory not found, skipping reference data");

        return referenceMap;
    }

    const openRouterFiles = getAllJsonFiles(OPENROUTER_DIR);

    for (const file of openRouterFiles) {
        try {
            const raw = readFileSync(file, "utf8");
            const data = JSON.parse(raw);

            if (data.name) {
                const normalizedName = normalizeModelName(data.name);

                referenceMap.set(normalizedName, data);
            }
        } catch (error) {
            console.warn(`[WARN] Failed to load OpenRouter reference file ${file}:`, (error as Error).message);
        }
    }

    console.log(`[INFO] Loaded ${referenceMap.size} OpenRouter models as reference`);

    return referenceMap;
};

/**
 * Fills missing fields from OpenRouter reference data
 * @param modelData The model data to fill
 * @param referenceMap Map of OpenRouter reference data
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
        "releaseDate",
        "lastUpdated",
        "launchDate",
        "trainingCutoff",
        "knowledge",
        "vision",
        "extendedThinking",
        "preview",
        "streamingSupported",
        "deploymentType",
        "version",
        "cacheRead",
        "codeExecution",
        "searchGrounding",
        "structuredOutputs",
        "batchMode",
        "audioGeneration",
        "imageGeneration",
        "compoundSystem",
        "regions",
        "description",
        "ownedBy",
        "originalModelId",
        "providerStatus",
        "supportsTools",
        "supportsStructuredOutput",
    ];

    // Fill missing fields from reference
    for (const field of fieldsToFill) {
        if ((enhancedData[field] === null || enhancedData[field] === undefined) && referenceData[field] !== null && referenceData[field] !== undefined) {
            enhancedData[field] = referenceData[field];
            fieldsFilled++;
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
 * Fields that should NOT be synchronized (cost-related fields)
 */
const EXCLUDED_FIELDS = new Set([
    "cost",
    "imageGeneration",
    "imageGenerationUltra",
    "input",
    "inputCacheHit",
    "output",
    "videoGeneration",
    "videoGenerationWithAudio",
    "videoGenerationWithoutAudio",
]);

/**
 * Calculates the completeness score of a model (excluding cost fields)
 * @param model The model to score
 * @returns A score from 0 to 1 indicating completeness
 */
const calculateCompletenessScore = (model: Model): number => {
    const modelObject = model as Record<string, unknown>;
    let totalFields = 0;
    let filledFields = 0;

    // Count all non-excluded fields
    for (const [key, value] of Object.entries(modelObject)) {
        if (EXCLUDED_FIELDS.has(key))
            continue;

        totalFields++;

        // Check if field has meaningful data
        if (value !== null && value !== undefined && value !== "") {
            if (Array.isArray(value)) {
                if (value.length > 0)
                    filledFields++;
            } else if (typeof value === "object") {
                // For nested objects, check if they have any non-null properties
                const hasData = Object.values(value as Record<string, unknown>).some((v) => v !== null && v !== undefined && v !== "");

                if (hasData)
                    filledFields++;
            } else {
                filledFields++;
            }
        }
    }

    return totalFields > 0 ? filledFields / totalFields : 0;
};

/**
 * Merges two models, filling missing data from the source model
 * @param target The target model to enhance
 * @param source The source model to get data from
 * @returns The enhanced target model
 */
const mergeModelData = (target: Model, source: Model): Model => {
    const targetObject = target as Record<string, unknown>;
    const sourceObject = source as Record<string, unknown>;
    const merged = { ...targetObject };
    let fieldsMerged = 0;

    for (const [key, sourceValue] of Object.entries(sourceObject)) {
        // Skip excluded fields (cost-related)
        if (EXCLUDED_FIELDS.has(key))
            continue;

        const targetValue = targetObject[key];

        // If target field is empty/null/undefined and source has data
        if (
            (targetValue === null || targetValue === undefined || targetValue === "")
            && sourceValue !== null
            && sourceValue !== undefined
            && sourceValue !== ""
        ) {
            // Handle arrays
            if (Array.isArray(sourceValue)) {
                if (sourceValue.length > 0) {
                    merged[key] = sourceValue;
                    fieldsMerged++;
                }
            }
            // Handle nested objects
            else if (typeof sourceValue === "object" && sourceValue !== null) {
                const sourceObject = sourceValue as Record<string, unknown>;
                const hasData = Object.values(sourceObject).some((v) => v !== null && v !== undefined && v !== "");

                if (hasData) {
                    merged[key] = sourceValue;
                    fieldsMerged++;
                }
            }
            // Handle primitive values
            else {
                merged[key] = sourceValue;
                fieldsMerged++;
            }
        }
    }

    if (fieldsMerged > 0) {
        console.log(`[SYNC] Merged ${fieldsMerged} fields from ${source.provider} to ${target.provider} for model ${target.id}`);
    }

    return merged as Model;
};

/**
 * Synchronizes data between models with the same ID
 * @param models Array of all models
 * @returns Array of synchronized models
 */
const synchronizeModelData = (models: Model[]): Model[] => {
    console.log(`[SYNC] Starting model data synchronization for ${models.length} models`);

    // Group models by ID
    const modelsById = new Map<string, Model[]>();

    for (const model of models) {
        const { id } = model;

        if (!modelsById.has(id)) {
            modelsById.set(id, []);
        }

        modelsById.get(id)!.push(model);
    }

    console.log(`[SYNC] Found ${modelsById.size} unique model IDs`);

    const synchronizedModels: Model[] = [];
    let modelsWithSync = 0;

    for (const [id, modelGroup] of modelsById) {
        if (modelGroup.length === 1) {
            // Single model, no synchronization needed
            synchronizedModels.push(modelGroup[0]);
            continue;
        }

        console.log(`[SYNC] Processing ${modelGroup.length} models with ID: ${id}`);

        // Sort models by completeness score (excluding cost fields)
        const scoredModels = modelGroup
            .map((model) => {
                return {
                    model,
                    score: calculateCompletenessScore(model),
                };
            })
            .sort((a, b) => b.score - a.score);

        // Use the most complete model as the base
        const baseModel = scoredModels[0].model;
        let enhancedModel = baseModel;

        // Merge data from other models into the base model
        for (let index = 1; index < scoredModels.length; index++) {
            const sourceModel = scoredModels[index].model;

            enhancedModel = mergeModelData(enhancedModel, sourceModel);
        }

        synchronizedModels.push(enhancedModel);
        modelsWithSync++;

        console.log(`[SYNC] Synchronized model ${id} (${modelGroup.length} sources, base: ${baseModel.provider})`);
    }

    console.log(`[SYNC] Completed synchronization: ${modelsWithSync} models synchronized`);
    console.log(`[SYNC] Final count: ${synchronizedModels.length} models`);

    return synchronizedModels;
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
            const raw = readFileSync(file, "utf8");
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

            // Fix empty IDs by using the name or filename as fallback
            if (!convertedData.id || convertedData.id === "") {
                const fileName = basename(file, ".json");
                const modelName = (convertedData.name as string) || fileName;

                convertedData.id = kebabCase(modelName);
                console.log(`[INFO] Fixed empty ID for model "${modelName}" using "${convertedData.id}"`);
            }

            // Fill missing fields from OpenRouter reference data
            const enhancedData = fillMissingFieldsFromReference(convertedData, referenceMap);

            const parsed = ModelSchema.safeParse(enhancedData);

            if (parsed.success) {
                models.push(parsed.data);
            } else {
                console.warn(`[WARN] Validation failed for ${file}:`, parsed.error.issues);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to process ${file}:`, (error as Error).message);
        }
    }

    return models;
};

/**
 * Main function that orchestrates the aggregation process
 * Reads all provider JSON files, validates them against the schema,
 * enriches them with pricing data from Helicone, and generates both JSON and TypeScript output files
 */
const main = async (): Promise<void> => {
    try {
        // Aggregate and validate models
        const models = await aggregateModels();

        console.log(`[INFO] Aggregated ${models.length} models from provider data`);

        // Deduplicate models per provider (not globally)
        const providerModels = new Map<string, Map<string, Model>>();
        let duplicatesRemoved = 0;

        for (const model of models) {
            const { provider } = model;

            // Skip models without a provider
            if (!provider) {
                console.warn(`[WARN] Model ${model.name} (${model.id}) has no provider, skipping`);
                continue;
            }

            if (!providerModels.has(provider)) {
                providerModels.set(provider, new Map<string, Model>());
            }

            const providerModelMap = providerModels.get(provider)!;

            if (providerModelMap.has(model.id)) {
                duplicatesRemoved++;
                console.log(`[INFO] Removing duplicate model with ID: ${model.id} (${model.name}) from provider: ${provider}`);
            } else {
                providerModelMap.set(model.id, model);
            }
        }

        // Flatten the provider models back into a single array
        const deduplicatedModels: Model[] = [];

        for (const [provider, modelMap] of providerModels) {
            deduplicatedModels.push(...modelMap.values());
        }

        if (duplicatesRemoved > 0) {
            console.log(`[INFO] Removed ${duplicatesRemoved} duplicate models, keeping ${deduplicatedModels.length} unique models`);
        }

        // Enrich models with pricing data from Helicone
        const enrichedModels = await enrichModelsWithPricing(deduplicatedModels);

        // Add icon information
        const modelsWithIcons = addIconInformation(enrichedModels);

        // Synchronize data between models with the same ID
        const synchronizedModels = synchronizeModelData(modelsWithIcons);

        writeFileSync(OUTPUT_JSON, JSON.stringify(synchronizedModels, null, 2));

        console.log(`[DONE] Aggregated and synchronized ${synchronizedModels.length} models to ${OUTPUT_JSON}`);

        // Generate API JSON file for CDN serving
        const apiJson = {
            models: synchronizedModels,
            metadata: {
                totalModels: synchronizedModels.length,
                totalProviders: new Set(synchronizedModels.map(m => m.provider)).size,
                lastUpdated: new Date().toISOString(),
                version: "0.0.0-development",
                description: "AI Models API - Comprehensive database of AI model specifications, pricing, and features"
            }
        };

        writeFileSync(OUTPUT_API_JSON, JSON.stringify(apiJson, null, 2));

        console.log(`[DONE] Generated API JSON at ${OUTPUT_API_JSON} with ${synchronizedModels.length} models`);
    } catch (error) {
        console.error("Error during aggregation:", error);

        process.exit(1);
    }
};

main();
