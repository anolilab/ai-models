import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { kebabCase } from "@visulima/string";

import { PROVIDER_NAMES } from "../src/types/providers.js";

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = dirname(__filename);

const OUTPUT_DIR = resolve(__dirname, "../src/providers");

/**
 * Generates a provider-specific TypeScript file with helper functions
 */
const generateProviderFile = (providerName: string): void => {
    const kebabName = kebabCase(providerName);
    const fileName = `${kebabName}.ts`;
    const filePath = join(OUTPUT_DIR, fileName);

    const fileContent = `import type { Model } from "../schema.js";
import providerData from "../../public/${kebabName}.json" with { type: "json" };

interface ApiJsonResponse {
    metadata: {
        description: string;
        lastUpdated: string;
        provider?: string;
        totalModels: number;
        version: string;
    };
    models: Model[];
}

const { models } = providerData as ApiJsonResponse;

/**
 * Retrieves all AI models for ${providerName}.
 * @returns Array of models belonging to ${providerName}.
 */
export const getModels = (): Model[] => [...models];

/**
 * Retrieves a specific AI model by its unique identifier for ${providerName}.
 * @param id The unique identifier of the model to retrieve.
 * @returns The model if found, undefined otherwise.
 */
export const getModelById = (id: string): Model | undefined => {
    if (!id?.trim()) {
        return undefined;
    }

    return models.find((model) => model.id === id);
};

/**
 * Searches and filters AI models for ${providerName} based on various criteria.
 * @param criteria The search criteria to filter models by.
 * @param criteria.context_min Minimum context window size (excludes models with null/undefined context).
 * @param criteria.context_max Maximum context window size (excludes models with null/undefined context).
 * @param criteria.modalities Input/output modalities to filter by.
 * @param criteria.modalities.input Array of input modalities to filter by.
 * @param criteria.modalities.output Array of output modalities to filter by.
 * @param criteria.preview Whether to filter by preview status.
 * @param criteria.reasoning Whether to filter by reasoning capability.
 * @param criteria.streaming_supported Whether to filter by streaming support.
 * @param criteria.tool_call Whether to filter by tool calling capability.
 * @param criteria.vision Whether to filter by vision capability.
 * @returns Array of models that match the specified criteria.
 */
export const searchModels = (criteria: {
    context_max?: number;
    context_min?: number;
    modalities?: {
        input?: string[];
        output?: string[];
    };
    preview?: boolean;
    reasoning?: boolean;
    streaming_supported?: boolean;
    tool_call?: boolean;
    vision?: boolean;
}): Model[] => {
    return models.filter((model) => {
        if (criteria.vision !== undefined && model.vision !== criteria.vision) {
            return false;
        }

        if (criteria.reasoning !== undefined && model.reasoning !== criteria.reasoning) {
            return false;
        }

        if (criteria.tool_call !== undefined && model.toolCall !== criteria.tool_call) {
            return false;
        }

        if (criteria.streaming_supported !== undefined && model.streamingSupported !== criteria.streaming_supported) {
            return false;
        }

        if (criteria.preview !== undefined && model.preview !== criteria.preview) {
            return false;
        }

        if (criteria.modalities?.input && !criteria.modalities.input.every((modality) => model.modalities.input.includes(modality))) {
            return false;
        }

        if (criteria.modalities?.output && !criteria.modalities.output.every((modality) => model.modalities.output.includes(modality))) {
            return false;
        }

        if (criteria.context_min !== undefined && (!model.limit.context || model.limit.context < criteria.context_min)) {
            return false;
        }

        if (criteria.context_max !== undefined && (!model.limit.context || model.limit.context > criteria.context_max)) {
            return false;
        }

        return true;
    });
};

/**
 * Gets the total number of models for ${providerName}.
 * @returns The number of models.
 */
export const getModelCount = (): number => models.length;
`;

    writeFileSync(filePath, fileContent, "utf8");
    console.log(`[DONE] Generated provider file: ${fileName}`);
};

/**
 * Main function to generate all provider files
 */
const main = (): void => {
    // Ensure output directory exists
    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Generate file for each provider
    for (const providerName of PROVIDER_NAMES) {
        generateProviderFile(providerName);
    }

    console.log(`[DONE] Generated ${PROVIDER_NAMES.length} provider-specific TypeScript files`);
};

main();
