import axios from "axios";

import type { Model } from "../../../src/schema.js";

/**
 * Deep Infra model data from their website API
 */
interface DeepInfraModelData {
    cover_img_url: string;
    deprecated: string | null;
    description: string;
    expected: string | null;
    full_name: string;
    max_tokens: number | null;
    mmlu: number | null;
    name: string;
    owner: string;
    pricing: {
        cents_per_input_chars?: number;
        cents_per_input_sec?: number;
        cents_per_input_token?: number;
        cents_per_output_token?: number;
        type: string;
    };
    private: number;
    quantization: string | null;
    replaced_by: string | null;
    tags: string[];
    type: string;
}

/**
 * Deep Infra website API response structure
 */
interface DeepInfraApiResponse {
    pageProps: {
        _featured: DeepInfraModelData[];
    };
}

/**
 * Transforms Deep Infra model data from their website API into the normalized structure.
 * @param modelsData Array of model data from Deep Infra website
 * @returns Array of normalized model objects
 */
const transformDeepInfraModels = (modelsData: DeepInfraModelData[]): Model[] => {
    const models: Model[] = [];

    for (const modelData of modelsData) {
        // Only process text-generation models for now
        if (modelData.type !== "text-generation") {
            continue;
        }

        const model: Model = {
            attachment: false, // Default value, not available in API
            cost: {
                input: modelData.pricing.cents_per_input_token || null,
                inputCacheHit: null,
                output: modelData.pricing.cents_per_output_token || null,
            },
            extendedThinking: false, // Default value, not available in API
            id: modelData.full_name,
            knowledge: null, // Not available in API
            lastUpdated: null, // Not available in API
            limit: {
                context: modelData.max_tokens,
                output: null, // Not available in API
            },
            modalities: {
                input: ["text"], // Default for text generation models
                output: ["text"],
            },
            name: modelData.name,
            openWeights: false, // Default value, not available in API
            provider: "Deep Infra",
            providerDoc: "https://deepinfra.com/docs",
            // Provider metadata
            providerEnv: [],
            providerModelsDevId: "deepinfra",
            providerNpm: "@deepinfra/sdk",
            reasoning: false, // Default value, not available in API
            releaseDate: null, // Not available in API
            streamingSupported: true, // Deep Infra supports streaming
            temperature: true, // Default value, not available in API
            toolCall: false, // Default value, not available in API
            vision: false, // Default value, not available in API
        };

        models.push(model);
    }

    return models;
};

/**
 * Fetches the dynamic Next.js data URL from Deep Infra's website.
 * @returns Promise that resolves to the data URL
 */
const getDeepInfraDataUrl = async (): Promise<string> => {
    try {
        // First, fetch the main page to extract the dynamic build ID
        const response = await axios.get("https://deepinfra.com/models/text-generation", {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Model-Registry/1.0)",
            },
        });

        const html = response.data;

        // Look for the Next.js build ID in the HTML
        const buildIdMatch = html.match(/"buildId":"([^"]+)"/);

        if (!buildIdMatch) {
            throw new Error("Could not find Next.js build ID in HTML");
        }

        const buildId = buildIdMatch[1];

        return `https://deepinfra.com/_next/data/${buildId}/index.json`;
    } catch (error) {
        console.error("[Deep Infra] Error getting data URL:", error instanceof Error ? error.message : String(error));

        throw error;
    }
};

/**
 * Fetches Deep Infra models from their website API and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
// eslint-disable-next-line import/prefer-default-export
export const fetchDeepInfraModels = async (): Promise<Model[]> => {
    try {
        // Get the dynamic data URL
        const dataUrl = await getDeepInfraDataUrl();

        console.log(`[Deep Infra] Fetching: ${dataUrl}`);

        const response = await axios.get(dataUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Model-Registry/1.0)",
            },
        });

        const apiData = response.data as DeepInfraApiResponse;

        // Extract featured models from pageProps
        // eslint-disable-next-line no-underscore-dangle
        const featuredModels = apiData.pageProps?._featured;

        if (!featuredModels || !Array.isArray(featuredModels)) {
            console.error("[Deep Infra] No featured models found in API response");

            return [];
        }

        const models = transformDeepInfraModels(featuredModels);

        console.log(`[Deep Infra] Successfully transformed ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Deep Infra] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
