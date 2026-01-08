import { kebabCase } from "@visulima/string";
import axios from "axios";

import type { Model } from "../../../src/schema.js";

const AZURE_MODELS_URL = "https://raw.githubusercontent.com/MicrosoftDocs/azure-ai-docs/refs/heads/main/articles/ai-foundry/openai/concepts/models.md";
const AZURE_CHAT_COMPLETIONS_URL
    = "https://raw.githubusercontent.com/MicrosoftDocs/azure-ai-docs/refs/heads/main/articles/ai-foundry/openai/includes/model-matrix/standard-chat-completions.md";
const AZURE_RETIREMENT_URL
    = "https://raw.githubusercontent.com/MicrosoftDocs/azure-ai-docs/refs/heads/main/articles/ai-foundry/openai/includes/retirement/models.md";

/**
 * Parse training cutoff date from string.
 */
const parseTrainingCutoff = (dateString: string): string | null => {
    if (!dateString) {
        return null;
    }

    const cleaned = dateString.trim();

    if (!cleaned || cleaned === "-") {
        return null;
    }

    return cleaned;
};

/**
 * Extract model names from the chat completions table.
 * This table shows which models are available in which regions.
 */
const extractModelNamesFromChatCompletions = (markdownContent: string): string[] => {
    const modelNames: string[] = [];

    // Look for the table with model names in the header
    const lines = markdownContent.split("\n");

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];

        // Check if this is the table header with model names
        if (line.includes("Region") && line.includes("gpt-4o")) {
            // Split the line by | to get columns
            const columns = line
                .split("|")
                .map((col) => col.trim())
                .filter((col) => col);

            // Skip the first column (Region) and process the rest
            for (let j = 1; j < columns.length; j += 1) {
                const column = columns[j];

                // Extract model name and version from the column
                // Format is like: **o1-preview**, **2024-09-12**
                const modelMatches = column.match(/\*\*([^*]+)\*\*/g);

                if (modelMatches && modelMatches.length >= 2) {
                    const modelName = modelMatches[0].replace(/\*\*/g, "").trim();
                    const version = modelMatches[1].replace(/\*\*/g, "").trim();

                    // Only include actual model names (not regions, categories, etc.)
                    if (
                        modelName
                        && modelName !== "Region"
                        && !modelName.includes("Region")
                        && (modelName.startsWith("gpt-")
                            || modelName.startsWith("o1")
                            || modelName.startsWith("o3")
                            || modelName.startsWith("o4")
                            || modelName.startsWith("codex"))
                    ) {
                        // Combine model name and version
                        const fullModelName = `${modelName} (${version})`;

                        modelNames.push(fullModelName);
                    }
                }
            }

            break; // We found the header, stop looking
        }
    }

    return modelNames;
};

/**
 * Retirement information for a model.
 */
interface RetirementInfo {
    deprecationDate: string | null;
    lifecycleStatus: string | null;
    modelName: string;
    modelVersion: string | null;
    replacementModel: string | null;
    retirementDate: string | null;
}

/**
 * Parse a single retirement table row.
 */
const parseRetirementRow = (cells: string[]): RetirementInfo | null => {
    if (cells.length < 6) {
        return null;
    }

    const modelName = cells[0].replace(/`/g, "").trim();
    const modelVersion = cells[1].replace(/`/g, "").trim() || null;
    const lifecycleStatus = cells[2].trim() || null;
    const deprecationDate = cells[3].trim() || null;
    const retirementDate = cells[4].trim() || null;
    const replacementModel = cells[5].replace(/`/g, "").trim() || null;

    if (!modelName || modelName === "Model Name") {
        return null;
    }

    return {
        deprecationDate: deprecationDate === "n/a" ? null : deprecationDate,
        lifecycleStatus,
        modelName,
        modelVersion,
        replacementModel: replacementModel === "" ? null : replacementModel,
        retirementDate: retirementDate === "" ? null : retirementDate,
    };
};

/**
 * Extract retirement information from the retirement table.
 */
const extractRetirementInfo = (markdownContent: string): Map<string, RetirementInfo> => {
    const retirementMap = new Map<string, RetirementInfo>();
    const lines = markdownContent.split("\n");

    let inTable = false;
    let headerFound = false;

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];

        // Detect tab sections (reset table state)
        if (
            line.includes("# [Text generation](#tab/text)")
            || line.includes("### Text generation")
            || line.includes("# [Audio](#tab/audio)")
            || line.includes("### Audio")
            || line.includes("# [Image and video](#tab/image)")
            || line.includes("### Image and video")
            || line.includes("# [Embedding](#tab/embedding)")
            || line.includes("### Embedding")
        ) {
            inTable = false;
            headerFound = false;

            continue;
        }

        // Look for table header
        if (line.includes("| Model Name |") && line.includes("Model Version") && line.includes("Lifecycle Status")) {
            inTable = true;
            headerFound = true;

            continue;
        }

        // Process table rows
        if (inTable && headerFound && line.trim().startsWith("|") && line.includes("`")) {
            // Skip separator rows
            if (line.includes("---") || line.includes(":--")) {
                continue;
            }

            const cells = line
                .split("|")
                .map((c) => c.trim())
                .filter((c) => c && c !== "");

            // Expected columns: Model Name | Model Version | Lifecycle Status | Deprecation Date | Retirement Date | Replacement Model
            const retirementInfo = parseRetirementRow(cells);

            if (retirementInfo) {
                // Create a key that includes both model name and version for uniqueness
                const key = retirementInfo.modelVersion ? `${retirementInfo.modelName}-${retirementInfo.modelVersion}` : retirementInfo.modelName;

                retirementMap.set(key, retirementInfo);

                // Also store by model name only for easier lookup
                if (retirementInfo.modelVersion) {
                    retirementMap.set(retirementInfo.modelName, retirementInfo);
                }
            }
        }

        // Stop processing table when we hit a new section
        if (inTable && (line.trim() === "" || line.startsWith("---") || line.startsWith("##") || line.startsWith("# ["))) {
            inTable = false;
            headerFound = false;
        }
    }

    return retirementMap;
};

/**
 * Extract model data including context limits and training cutoff from the models table.
 */
const extractModelDataFromModelsTable = (markdownContent: string): Map<string, Partial<Model>> => {
    const modelDataMap = new Map<string, Partial<Model>>();

    const lines = markdownContent.split("\n");

    let inModelTable = false;

    for (const line of lines) {
        // Look for the model capabilities table (GPT-4.1 series)
        if (line.includes("| Model ID |") && line.includes("Context Window |") && line.includes("Max Output Tokens |")) {
            inModelTable = true;

            continue;
        }

        // Look for the GPT-4o table
        if (line.includes("| Model ID |") && line.includes("Max Request (tokens) |") && line.includes("Training Data (up to) |")) {
            inModelTable = true;

            continue;
        }

        // Look for GPT-4o models specifically (they're in a continuation of a table)
        if (line.includes("gpt-4o") && line.includes("Input:") && line.includes("Output:")) {
            // Parse this line directly as it contains GPT-4o model data
            const cells = line
                .split("|")
                .map((c) => c.trim())
                .filter((c) => c);

            if (cells.length >= 3) {
                const modelId = cells[0];
                const maxRequest = cells[2];
                const trainingData = cells[3];

                // Clean up model ID (remove backticks and extra text)
                const cleanModelId = modelId
                    .replace(/`/g, "")
                    .replace(/<br>.*$/, "")
                    .trim();

                // Parse max request which contains both input and output
                let contextLength = null;
                let outputTokens = null;

                if (maxRequest) {
                    // Look for "Input: X Output: Y" pattern
                    const inputMatch = maxRequest.match(/input:\s*([\d,]+)/i);
                    const outputMatch = maxRequest.match(/output:\s*([\d,]+)/i);

                    if (inputMatch) {
                        const cleanNumber = inputMatch[1].replace(/,/g, "");

                        contextLength = Number.parseInt(cleanNumber, 10);
                    }

                    if (outputMatch) {
                        const cleanNumber = outputMatch[1].replace(/,/g, "");

                        outputTokens = Number.parseInt(cleanNumber, 10);
                    }
                }

                const modelData: Partial<Model> = {
                    id: kebabCase(cleanModelId),
                    limit: {
                        context: contextLength,
                        output: outputTokens,
                    },
                    name: cleanModelId,
                    trainingCutoff: parseTrainingCutoff(trainingData),
                };

                modelDataMap.set(cleanModelId, modelData);
            }
        }

        if (inModelTable) {
            // Check if we've reached the end of the table
            if (line.trim() === "" || line.startsWith("---") || line.includes("###")) {
                inModelTable = false;

                continue;
            }

            // Parse model row
            const cells = line
                .split("|")
                .map((c) => c.trim())
                .filter((c) => c);

            if (cells.length >= 3) {
                const modelId = cells[0];
                const maxRequest = cells[2];
                const trainingData = cells[3];

                // Clean up model ID (remove backticks and version info)
                const cleanModelId = modelId.replace(/`/g, "").trim();

                // Parse max request which contains both input and output
                let contextLength = null;
                let outputTokens = null;

                if (maxRequest) {
                    // Look for "Input: X Output: Y" pattern
                    const inputMatch = maxRequest.match(/input:\s*([\d,]+)/i);
                    const outputMatch = maxRequest.match(/output:\s*([\d,]+)/i);

                    if (inputMatch) {
                        const cleanNumber = inputMatch[1].replace(/,/g, "");

                        contextLength = Number.parseInt(cleanNumber, 10);
                    }

                    if (outputMatch) {
                        const cleanNumber = outputMatch[1].replace(/,/g, "");

                        outputTokens = Number.parseInt(cleanNumber, 10);
                    }
                }

                const modelData: Partial<Model> = {
                    id: kebabCase(cleanModelId),
                    limit: {
                        context: contextLength,
                        output: outputTokens,
                    },
                    name: cleanModelId,
                    trainingCutoff: parseTrainingCutoff(trainingData),
                };

                modelDataMap.set(cleanModelId, modelData);
            }
        }
    }

    return modelDataMap;
};

/**
 * Create a base model object with common properties.
 */
const createBaseModel = (modelName: string): Model => {
    // Determine if model supports vision based on name
    const hasVision = modelName.toLowerCase().includes("gpt-4o") || modelName.toLowerCase().includes("gpt-4v") || modelName.toLowerCase().includes("vision");

    // Determine if model supports tool calling
    const hasToolCall
        = modelName.toLowerCase().includes("gpt-4")
            || modelName.toLowerCase().includes("claude")
            || modelName.toLowerCase().includes("o1")
            || modelName.toLowerCase().includes("o3")
            || modelName.toLowerCase().includes("o4");

    return {
        attachment: false,
        cost: {
            input: null,
            inputCacheHit: null,
            output: null,
        },
        extendedThinking: false,
        id: kebabCase(modelName),
        knowledge: null,
        lastUpdated: null,
        limit: {
            context: null,
            output: null,
        },
        modalities: {
            input: hasVision ? ["text", "image"] : ["text"],
            output: modelName.toLowerCase().includes("dall-e") ? ["image"] : ["text"],
        },
        name: modelName,
        openWeights: false,
        provider: "Azure OpenAI",
        providerDoc: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models",
        providerEnv: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"],
        providerId: "azure-open-ai",
        providerModelsDevId: "azure-openai",
        providerNpm: "@ai-sdk/azure-openai",
        reasoning: false,
        releaseDate: null,
        streamingSupported: true,
        temperature: true,
        toolCall: hasToolCall,
        vision: hasVision,
    };
};

/**
 * Transforms Azure OpenAI model data from their markdown documentation into the normalized structure.
 * @param modelsMarkdown The markdown content from the models documentation
 * @param chatCompletionsMarkdown The markdown content from the chat completions documentation
 * @param retirementMarkdown Optional markdown content from the retirement documentation
 * @returns Array of normalized model objects
 */
export const transformAzureModels = (modelsMarkdown: string, chatCompletionsMarkdown: string, retirementMarkdown?: string): Model[] => {
    console.log("[Azure OpenAI] Transforming model data from markdown sources");

    // Extract detailed model data from models table first
    const modelDataMap = extractModelDataFromModelsTable(modelsMarkdown);

    console.log(`[Azure OpenAI] Found ${modelDataMap.size} models with detailed data`);

    // Extract retirement information if available
    const retirementMap = retirementMarkdown ? extractRetirementInfo(retirementMarkdown) : new Map<string, RetirementInfo>();

    console.log(`[Azure OpenAI] Found ${retirementMap.size} retirement entries`);

    // Extract model names from chat completions table
    const modelNames = extractModelNamesFromChatCompletions(chatCompletionsMarkdown);

    console.log(`[Azure OpenAI] Found ${modelNames.length} model names from chat completions table`);

    const models: Model[] = [];
    const processedModels = new Set<string>();

    // Process each model name from chat completions table
    for (const modelName of modelNames) {
        // Clean up the model name (remove version info if present)
        const cleanModelName = modelName.split(",")[0].trim();

        // Skip if we've already processed this model
        if (processedModels.has(cleanModelName)) {
            continue;
        }

        // Try to find detailed data by matching the base model name
        let detailedData = modelDataMap.get(cleanModelName);

        // If not found, try to find by partial match (in case of extra text)
        if (!detailedData) {
            for (const [key, value] of modelDataMap.entries()) {
                if (key.includes(cleanModelName) || cleanModelName.includes(key)) {
                    detailedData = value;

                    break;
                }
            }
        }

        // Create base model
        const baseModel = createBaseModel(cleanModelName);

        // Look up retirement information
        let retirementInfo: RetirementInfo | undefined = retirementMap.get(cleanModelName);

        // If not found, try partial match
        if (!retirementInfo) {
            for (const [key, value] of retirementMap.entries()) {
                if (key.includes(cleanModelName) || cleanModelName.includes(key)) {
                    retirementInfo = value;

                    break;
                }
            }
        }

        // Build description with retirement info if available
        const descriptionParts: string[] = [];

        if (retirementInfo) {
            if (retirementInfo.lifecycleStatus) {
                descriptionParts.push(`Lifecycle: ${retirementInfo.lifecycleStatus}`);
            }

            if (retirementInfo.deprecationDate && retirementInfo.deprecationDate !== "n/a") {
                descriptionParts.push(`Deprecation: ${retirementInfo.deprecationDate}`);
            }

            if (retirementInfo.retirementDate) {
                descriptionParts.push(`Retirement: ${retirementInfo.retirementDate}`);
            }

            if (retirementInfo.replacementModel) {
                descriptionParts.push(`Replacement: ${retirementInfo.replacementModel}`);
            }
        }

        // Merge with detailed data if available
        const model: Model = {
            ...baseModel,
            description: descriptionParts.length > 0 ? descriptionParts.join(" | ") : undefined,
            limit: {
                context: detailedData?.limit?.context || baseModel.limit.context,
                output: detailedData?.limit?.output || baseModel.limit.output,
            },
            preview: retirementInfo?.lifecycleStatus === "Preview" || baseModel.preview,
            trainingCutoff: detailedData?.trainingCutoff || baseModel.trainingCutoff,
        };

        models.push(model);
        processedModels.add(cleanModelName);
    }

    console.log(`[Azure OpenAI] Generated ${models.length} models`);

    return models;
};

/**
 * Fetches models from Azure OpenAI markdown documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchAzureModels = async (): Promise<Model[]> => {
    console.log("[Azure OpenAI] Fetching markdown documentation");

    // Fetch all markdown files
    const [modelsResponse, chatCompletionsResponse, retirementResponse] = await Promise.allSettled([
        axios.get(AZURE_MODELS_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
            },
            timeout: 10_000,
        }),
        axios.get(AZURE_CHAT_COMPLETIONS_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
            },
            timeout: 10_000,
        }),
        axios.get(AZURE_RETIREMENT_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
            },
            timeout: 10_000,
        }),
    ]);

    if (chatCompletionsResponse.status === "rejected") {
        throw new Error(`Failed to fetch Azure chat completions: ${chatCompletionsResponse.reason}`);
    }

    const modelsMarkdown = modelsResponse.status === "fulfilled" ? modelsResponse.value.data : "";
    const chatCompletionsMarkdown = chatCompletionsResponse.value.data;
    const retirementMarkdown = retirementResponse.status === "fulfilled" ? retirementResponse.value.data : undefined;

    if (modelsResponse.status === "rejected") {
        console.warn("[Azure OpenAI] Failed to fetch models data, continuing without it");
    }

    if (retirementResponse.status === "rejected") {
        console.warn("[Azure OpenAI] Failed to fetch retirement data, continuing without it");
    }

    const models = transformAzureModels(modelsMarkdown, chatCompletionsMarkdown, retirementMarkdown);

    console.log(`[Azure OpenAI] Found ${models.length} models`);

    return models;
};
