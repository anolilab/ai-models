import type { Model } from "../../../src/schema.js";

/**
 * OpenAI model data from models.dev API
 */
interface OpenAIModelData {
    attachment: boolean;
    cost: {
        cache_read?: number;
        input: number;
        output: number;
    };
    id: string;
    knowledge: string;
    last_updated: string;
    limit: {
        context: number;
        output: number;
    };
    modalities: {
        input: string[];
        output: string[];
    };
    name: string;
    open_weights: boolean;
    reasoning: boolean;
    release_date: string;
    temperature: boolean;
    tool_call: boolean;
}

/**
 * OpenAI provider data from models.dev API
 */
interface OpenAIProviderData {
    doc: string;
    env: string[];
    id: string;
    models: Record<string, OpenAIModelData>;
    name: string;
    npm: string;
}

/**
 * Transforms OpenAI model data from models.dev API into the normalized structure.
 * @param providerData The provider data from models.dev API
 * @returns Array of normalized model objects
 */
export const transformOpenAIModels = (providerData: OpenAIProviderData): Model[] => {
    const models: Model[] = [];

    for (const [modelId, modelData] of Object.entries(providerData.models)) {
        const model: Model = {
            attachment: modelData.attachment,
            cost: {
                input: modelData.cost.input,
                inputCacheHit: modelData.cost.cache_read || null,
                output: modelData.cost.output,
            },
            extendedThinking: modelData.reasoning, // Use reasoning as extended thinking
            id: modelId,
            knowledge: modelData.knowledge,
            lastUpdated: modelData.last_updated || null,
            limit: {
                context: modelData.limit.context,
                output: modelData.limit.output,
            },
            modalities: {
                input: modelData.modalities.input,
                output: modelData.modalities.output,
            },
            name: modelData.name,
            openWeights: modelData.open_weights,
            provider: "OpenAI",
            providerDoc: providerData.doc,
            // Provider metadata
            providerEnv: providerData.env,
            providerId: "open-ai",
            providerModelsDevId: providerData.id,
            providerNpm: providerData.npm,
            reasoning: modelData.reasoning,
            releaseDate: modelData.release_date || null,
            streamingSupported: true, // All OpenAI models support streaming
            temperature: modelData.temperature,
            toolCall: modelData.tool_call,
            vision: modelData.modalities.input.includes("image"),
        };

        models.push(model);
    }

    return models;
};

/**
 * Fetches OpenAI models using hardcoded data from models.dev API.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchOpenAIModels = async (): Promise<Model[]> => {
    console.log("[OpenAI] Using hardcoded data from models.dev API");

    // Hardcoded OpenAI provider data from models.dev API
    const openAIProviderData: OpenAIProviderData = {
        doc: "https://platform.openai.com/docs/models",
        env: ["OPENAI_API_KEY"],
        id: "openai",
        models: {
            "codex-mini-latest": {
                attachment: true,
                cost: {
                    cache_read: 0.375,
                    input: 1.5,
                    output: 6,
                },
                id: "codex-mini-latest",
                knowledge: "2024-04",
                last_updated: "2025-05-16",
                limit: {
                    context: 200000,
                    output: 100000,
                },
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: "Codex Mini",
                open_weights: false,
                reasoning: true,
                release_date: "2025-05-16",
                temperature: false,
                tool_call: true,
            },
            "gpt-3.5-turbo": {
                attachment: false,
                cost: {
                    cache_read: 1.25,
                    input: 0.5,
                    output: 1.5,
                },
                id: "gpt-3.5-turbo",
                knowledge: "2021-09-01",
                last_updated: "2023-11-06",
                limit: {
                    context: 16385,
                    output: 4096,
                },
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: "GPT-3.5-turbo",
                open_weights: false,
                reasoning: false,
                release_date: "2023-03-01",
                temperature: true,
                tool_call: false,
            },
            "gpt-4": {
                attachment: true,
                cost: {
                    input: 10,
                    output: 30,
                },
                id: "gpt-4",
                knowledge: "2023-11",
                last_updated: "2024-04-09",
                limit: {
                    context: 8192,
                    output: 8192,
                },
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: "GPT-4",
                open_weights: false,
                reasoning: false,
                release_date: "2023-11-06",
                temperature: true,
                tool_call: true,
            },
            "gpt-4-32k": {
                attachment: false,
                cost: {
                    input: 60,
                    output: 120,
                },
                id: "gpt-4-32k",
                knowledge: "2023-11",
                last_updated: "2023-03-14",
                limit: {
                    context: 32768,
                    output: 32768,
                },
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: "GPT-4 32K",
                open_weights: false,
                reasoning: false,
                release_date: "2023-03-14",
                temperature: true,
                tool_call: true,
            },
            "gpt-4-turbo": {
                attachment: true,
                cost: {
                    input: 10,
                    output: 30,
                },
                id: "gpt-4-turbo",
                knowledge: "2023-11",
                last_updated: "2024-04-09",
                limit: {
                    context: 128000,
                    output: 4096,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "GPT-4 Turbo",
                open_weights: false,
                reasoning: false,
                release_date: "2023-11-06",
                temperature: true,
                tool_call: true,
            },
            "gpt-4.1": {
                attachment: true,
                cost: {
                    cache_read: 0.5,
                    input: 2,
                    output: 8,
                },
                id: "gpt-4.1",
                knowledge: "2024-05",
                last_updated: "2025-04-14",
                limit: {
                    context: 1047576,
                    output: 32768,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "GPT-4.1",
                open_weights: false,
                reasoning: false,
                release_date: "2025-04-14",
                temperature: true,
                tool_call: true,
            },
            "gpt-4.1-mini": {
                attachment: true,
                cost: {
                    cache_read: 0.1,
                    input: 0.4,
                    output: 1.6,
                },
                id: "gpt-4.1-mini",
                knowledge: "2024-04",
                last_updated: "2025-04-14",
                limit: {
                    context: 1047576,
                    output: 32768,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "GPT-4.1 mini",
                open_weights: false,
                reasoning: false,
                release_date: "2025-04-14",
                temperature: true,
                tool_call: true,
            },
            "gpt-4.1-nano": {
                attachment: true,
                cost: {
                    cache_read: 0.03,
                    input: 0.1,
                    output: 0.4,
                },
                id: "gpt-4.1-nano",
                knowledge: "2024-04",
                last_updated: "2025-04-14",
                limit: {
                    context: 1047576,
                    output: 32768,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "GPT-4.1 nano",
                open_weights: false,
                reasoning: false,
                release_date: "2025-04-14",
                temperature: true,
                tool_call: true,
            },
            "gpt-4o": {
                attachment: true,
                cost: {
                    cache_read: 1.25,
                    input: 2.5,
                    output: 10,
                },
                id: "gpt-4o",
                knowledge: "2023-09",
                last_updated: "2024-05-13",
                limit: {
                    context: 128000,
                    output: 16384,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "GPT-4o",
                open_weights: false,
                reasoning: false,
                release_date: "2024-05-13",
                temperature: true,
                tool_call: true,
            },
            "gpt-4o-mini": {
                attachment: true,
                cost: {
                    cache_read: 0.08,
                    input: 0.15,
                    output: 0.6,
                },
                id: "gpt-4o-mini",
                knowledge: "2023-09",
                last_updated: "2024-07-18",
                limit: {
                    context: 128000,
                    output: 16384,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "GPT-4o mini",
                open_weights: false,
                reasoning: false,
                release_date: "2024-07-18",
                temperature: true,
                tool_call: true,
            },
            o1: {
                attachment: false,
                cost: {
                    cache_read: 7.5,
                    input: 15,
                    output: 60,
                },
                id: "o1",
                knowledge: "2023-09",
                last_updated: "2024-12-05",
                limit: {
                    context: 200000,
                    output: 100000,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "o1",
                open_weights: false,
                reasoning: true,
                release_date: "2024-12-05",
                temperature: false,
                tool_call: true,
            },
            "o1-mini": {
                attachment: false,
                cost: {
                    cache_read: 0.55,
                    input: 1.1,
                    output: 4.4,
                },
                id: "o1-mini",
                knowledge: "2023-09",
                last_updated: "2024-09-12",
                limit: {
                    context: 128000,
                    output: 65536,
                },
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: "o1-mini",
                open_weights: false,
                reasoning: true,
                release_date: "2024-09-12",
                temperature: false,
                tool_call: false,
            },
            "o1-preview": {
                attachment: false,
                cost: {
                    cache_read: 7.5,
                    input: 15,
                    output: 60,
                },
                id: "o1-preview",
                knowledge: "2023-09",
                last_updated: "2024-09-12",
                limit: {
                    context: 128000,
                    output: 32768,
                },
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: "o1-preview",
                open_weights: false,
                reasoning: true,
                release_date: "2024-09-12",
                temperature: true,
                tool_call: false,
            },
            o3: {
                attachment: true,
                cost: {
                    cache_read: 0.5,
                    input: 2,
                    output: 8,
                },
                id: "o3",
                knowledge: "2024-05",
                last_updated: "2025-04-16",
                limit: {
                    context: 200000,
                    output: 100000,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "o3",
                open_weights: false,
                reasoning: true,
                release_date: "2025-04-16",
                temperature: false,
                tool_call: true,
            },
            "o3-mini": {
                attachment: false,
                cost: {
                    cache_read: 0.55,
                    input: 1.1,
                    output: 4.4,
                },
                id: "o3-mini",
                knowledge: "2024-05",
                last_updated: "2025-01-29",
                limit: {
                    context: 200000,
                    output: 100000,
                },
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: "o3-mini",
                open_weights: false,
                reasoning: true,
                release_date: "2024-12-20",
                temperature: false,
                tool_call: true,
            },
            "o3-pro": {
                attachment: true,
                cost: {
                    input: 20,
                    output: 80,
                },
                id: "o3-pro",
                knowledge: "2024-05",
                last_updated: "2025-06-10",
                limit: {
                    context: 200000,
                    output: 100000,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "o3-pro",
                open_weights: false,
                reasoning: true,
                release_date: "2025-06-10",
                temperature: false,
                tool_call: true,
            },
            "o4-mini": {
                attachment: true,
                cost: {
                    cache_read: 0.28,
                    input: 1.1,
                    output: 4.4,
                },
                id: "o4-mini",
                knowledge: "2024-05",
                last_updated: "2025-04-16",
                limit: {
                    context: 200000,
                    output: 100000,
                },
                modalities: {
                    input: ["text", "image"],
                    output: ["text"],
                },
                name: "o4-mini",
                open_weights: false,
                reasoning: true,
                release_date: "2025-04-16",
                temperature: false,
                tool_call: true,
            },
        },
        name: "OpenAI",
        npm: "@ai-sdk/openai",
    };

    const models = transformOpenAIModels(openAIProviderData);

    console.log(`[OpenAI] Successfully transformed ${models.length} models`);

    return models;
};
