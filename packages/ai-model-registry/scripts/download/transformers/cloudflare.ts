import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

/**
 * Cloudflare Workers AI model data interface
 */
interface CloudflareModelData {
    badges?: string[];
    capabilities?: {
        audio?: boolean;
        streaming?: boolean;
        structured_outputs?: boolean;
        tools?: boolean;
        vision?: boolean;
    };
    category?: string;
    context_length?: number;
    description?: string;
    id: string;
    max_tokens?: number;
    modalities?: {
        input?: string[];
        output?: string[];
    };
    name: string;
    pricing?: {
        input?: number;
        output?: number;
    };
    provider?: string;
    release_date?: string;
    version?: string;
}

/**
 * Extracts model information from the main models page
 * @param htmlContent HTML content from the Cloudflare Workers AI models page
 * @returns Array of basic model information
 */
const parseModelsFromMainPage = (
    htmlContent: string,
): { badges: string[]; category: string; description: string; detailUrl: string; id: string; name: string; provider: string }[] => {
    const $ = load(htmlContent);
    const models: { badges: string[]; category: string; description: string; detailUrl: string; id: string; name: string; provider: string }[] = [];

    // Find all model cards (links with href containing /workers-ai/models/)
    $("a[href*=\"/workers-ai/models/\"]").each((index, element) => {
        const $link = $(element);
        const href = $link.attr("href");

        if (!href || href === "/workers-ai/models/") {
            return; // Skip the main page link
        }

        // Extract model ID from URL
        const modelId = href.replace("/workers-ai/models/", "").split("/")[0];

        if (!modelId) {
            return;
        }

        // Extract model name
        const $nameElement = $link.find(".text-lg.font-semibold");
        const name = $nameElement.text().trim();

        if (!name) {
            return;
        }

        // Extract description
        const $descriptionElement = $link.find("p.text-sm.leading-6");
        const description = $descriptionElement.text().trim();

        // Extract category and provider
        const $categoryElement = $link.find(".text-xs .text-gray-400");
        const categoryText = $categoryElement.text().trim();
        const [category, provider] = categoryText.split(" • ");

        // Extract badges
        const badges: string[] = [];

        $link.find(".sl-badge").each((badgeIndex, badgeElement) => {
            const badgeText = $(badgeElement).text().trim();

            if (badgeText) {
                badges.push(badgeText);
            }
        });

        models.push({
            badges,
            category: category || "Text Generation",
            description,
            detailUrl: `https://developers.cloudflare.com${href}`,
            id: modelId,
            name,
            provider: provider || "Unknown",
        });
    });

    return models;
};

/**
 * Fetches detailed information for a specific model from its detail page
 * @param detailUrl URL of the model's detail page
 * @returns Promise that resolves to detailed model information
 */
const fetchModelDetails = async (detailUrl: string): Promise<Partial<CloudflareModelData>> => {
    try {
        console.log(`[Cloudflare] Fetching details for: ${detailUrl}`);
        const response = await axios.get(detailUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Model-Registry/1.0)",
            },
            timeout: 10000,
        });

        const $ = load(response.data);
        const details: Partial<CloudflareModelData> = {};

        // Try to extract context length
        const contextText = $("*:contains(\"context\")")
            .filter((i, el) => {
                const text = $(el).text().toLowerCase();

                return text.includes("context") && text.includes("token") && /\d+/.test(text);
            })
            .first()
            .text();

        if (contextText) {
            const contextMatch = contextText.match(/(\d+(?:,\d+)?)\s*(?:(?:k|thousand)\s*)?tokens?/i);

            if (contextMatch) {
                const contextStr = contextMatch[1].replace(",", "");

                details.context_length = parseInt(contextStr) * (contextText.toLowerCase().includes("k") ? 1000 : 1);
            }
        }

        // Try to extract pricing information
        const pricingText = $("*:contains(\"pricing\")")
            .filter((i, el) => {
                const text = $(el).text().toLowerCase();

                return text.includes("$") && text.includes("token");
            })
            .first()
            .text();

        if (pricingText) {
            // Look for pricing patterns like "$0.027 per M input tokens" and "$0.201 per M output tokens"
            const inputMatch = pricingText.match(/\$([\d.]+)\s+per\s+M\s+input\s+tokens?/i);
            const outputMatch = pricingText.match(/\$([\d.]+)\s+per\s+M\s+output\s+tokens?/i);

            if (inputMatch && outputMatch) {
                const inputCostPerM = parseFloat(inputMatch[1]);
                const outputCostPerM = parseFloat(outputMatch[1]);

                // Convert from per million tokens to per token
                const inputCostPerToken = inputCostPerM / 1000000;
                const outputCostPerToken = outputCostPerM / 1000000;

                details.pricing = {
                    input: Number.isNaN(inputCostPerToken) ? undefined : parseFloat(inputCostPerToken.toFixed(10)),
                    output: Number.isNaN(outputCostPerToken) ? undefined : parseFloat(outputCostPerToken.toFixed(10)),
                };
            } else {
                // Fallback: try to find any dollar amounts and assume they're in order (input, output)
                const priceMatches = pricingText.match(/\$([\d.]+)/g);

                if (priceMatches && priceMatches.length >= 2) {
                    const inputCostPerM = parseFloat(priceMatches[0].replace("$", ""));
                    const outputCostPerM = parseFloat(priceMatches[1].replace("$", ""));

                    // Convert from per million tokens to per token
                    const inputCostPerToken = inputCostPerM / 1000000;
                    const outputCostPerToken = outputCostPerM / 1000000;

                    details.pricing = {
                        input: Number.isNaN(inputCostPerToken) ? undefined : parseFloat(inputCostPerToken.toFixed(10)),
                        output: Number.isNaN(outputCostPerToken) ? undefined : parseFloat(outputCostPerToken.toFixed(10)),
                    };
                }
            }
        }

        // Determine capabilities based on content
        const pageText = $("body").text().toLowerCase();

        details.capabilities = {
            audio: pageText.includes("audio") || pageText.includes("speech") || pageText.includes("whisper"),
            streaming: true, // Most Cloudflare models support streaming
            structured_outputs: pageText.includes("structured") || pageText.includes("json"),
            tools: pageText.includes("function") || pageText.includes("tool") || pageText.includes("structured"),
            vision: pageText.includes("vision") || pageText.includes("image") || pageText.includes("multimodal"),
        };

        return details;
    } catch (error) {
        console.warn(`[Cloudflare] Failed to fetch details for ${detailUrl}:`, error instanceof Error ? error.message : String(error));

        return {};
    }
};

/**
 * Transforms Cloudflare model data into the normalized structure.
 * @param modelsData Array of Cloudflare model data
 * @returns Array of normalized model objects
 */
export const transformCloudflareModels = (modelsData: CloudflareModelData[]): Model[] => {
    const models: Model[] = [];

    for (const modelData of modelsData) {
        // Determine modalities based on category and capabilities
        let inputModalities = ["text"];
        let outputModalities = ["text"];

        if (modelData.capabilities?.vision) {
            inputModalities.push("image");
        }

        if (modelData.capabilities?.audio) {
            if (modelData.category?.toLowerCase().includes("speech")) {
                inputModalities = ["audio"];
                outputModalities = ["text"];
            } else if (modelData.category?.toLowerCase().includes("voice") || modelData.category?.toLowerCase().includes("tts")) {
                inputModalities = ["text"];
                outputModalities = ["audio"];
            }
        }

        if (modelData.category?.toLowerCase().includes("embedding")) {
            outputModalities = ["embedding"];
        }

        const model: Model = {
            attachment: false, // Cloudflare doesn't support attachments
            // Additional capabilities
            audioGeneration: modelData.capabilities?.audio || false,
            cost: {
                input: modelData.pricing?.input || null,
                inputCacheHit: null, // Cloudflare doesn't provide cache hit pricing
                output: modelData.pricing?.output || null,
            },
            // Description
            description: modelData.description || undefined,
            id: modelData.id,
            knowledge: null, // Not provided by Cloudflare
            lastUpdated: null, // Not provided by Cloudflare
            limit: {
                context: modelData.context_length || null,
                output: modelData.max_tokens || null,
            },
            modalities: {
                input: inputModalities,
                output: outputModalities,
            },
            name: modelData.name,
            openWeights: false, // Cloudflare models are not open weights
            provider: "Cloudflare",
            providerDoc: "https://developers.cloudflare.com/workers-ai/models",
            providerEnv: ["CLOUDFLARE_API_TOKEN"],
            providerId: "cloudflare",
            providerNpm: "@ai-sdk/cloudflare",
            reasoning: false, // Not specified by Cloudflare
            releaseDate: modelData.release_date || null,
            streamingSupported: modelData.capabilities?.streaming || null,
            structuredOutputs: modelData.capabilities?.structured_outputs || false,
            supportsStructuredOutput: modelData.capabilities?.structured_outputs || false,
            supportsTools: modelData.capabilities?.tools || false,
            temperature: true, // Most models support temperature
            toolCall: modelData.capabilities?.tools || false,
            // Version information
            version: modelData.version || null,
            vision: modelData.capabilities?.vision || false,
        };

        models.push(model);
    }

    return models;
};

/**
 * Fetches Cloudflare models by parsing their documentation page and fetching individual model details.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchCloudflareModels = async (): Promise<Model[]> => {
    console.log("[Cloudflare] Fetching models from Cloudflare Workers AI documentation");

    try {
        // First, fetch the main models page
        const mainPageUrl = "https://developers.cloudflare.com/workers-ai/models";

        console.log(`[Cloudflare] Fetching main page: ${mainPageUrl}`);

        const response = await axios.get(mainPageUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; AI-Model-Registry/1.0)",
            },
            timeout: 15000,
        });

        // Parse the main page to get basic model information
        const basicModels = parseModelsFromMainPage(response.data);

        console.log(`[Cloudflare] Found ${basicModels.length} models on main page`);

        // Fetch detailed information for each model (with rate limiting)
        const detailedModels: CloudflareModelData[] = [];

        for (let i = 0; i < basicModels.length; i += 1) {
            const basicModel = basicModels[i];

            // Add delay between requests to be respectful
            if (i > 0) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            // Fetch detailed information
            const details = await fetchModelDetails(basicModel.detailUrl);

            // Merge basic and detailed information
            const detailedModel: CloudflareModelData = {
                badges: basicModel.badges,
                category: basicModel.category,
                description: basicModel.description,
                id: basicModel.id,
                name: basicModel.name,
                provider: basicModel.provider,
                ...details,
            };

            detailedModels.push(detailedModel);

            // Log progress
            if ((i + 1) % 10 === 0 || i === basicModels.length - 1) {
                console.log(`[Cloudflare] Processed ${i + 1}/${basicModels.length} models`);
            }
        }

        const models = transformCloudflareModels(detailedModels);

        console.log(`[Cloudflare] Successfully transformed ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Cloudflare] Error fetching models:", error instanceof Error ? error.message : String(error));

        // Fallback to a minimal set of known models if the dynamic fetching fails
        console.log("[Cloudflare] Falling back to minimal model set");
        const fallbackModels: CloudflareModelData[] = [
            {
                capabilities: {
                    streaming: true,
                    structured_outputs: false,
                    tools: false,
                },
                context_length: 8192,
                description: "Meta's Llama 3.1 8B parameter model, optimized for instruction following",
                id: "llama-3.1-8b-instruct",
                max_tokens: 8192,
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: "Llama 3.1 8B Instruct",
                pricing: {
                    input: 0.0000002,
                    output: 0.0000002,
                },
                provider: "Meta",
                version: "3.1",
            },
        ];

        return transformCloudflareModels(fallbackModels);
    }
};
