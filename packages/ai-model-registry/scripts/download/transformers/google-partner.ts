import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";
import { parseContextLength } from "../utils/index.js";

const GOOGLE_VERTEX_PARTNER_BASE_URL = "https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models";

/**
 * Partner model configuration
 */
interface PartnerModel {
    baseUrl: string;
    modelPages: {
        displayName: string;
        slug: string;
    }[];
    name: string;
}

/**
 * Extract model information from a partner model page.
 */
const extractModelFromPage = async (url: string, partnerName: string, modelDisplayName: string): Promise<Model[]> => {
    try {
        const response = await axios.get(url);
        const $ = load(response.data);

        const models: Model[] = [];

        // Use the provided display name instead of extracting from page
        const modelName = modelDisplayName;

        if (!modelName || modelName.length < 3) {
            return [];
        }

        // Look for context length information in the page content
        let contextLength: number | null = null;
        const bodyText = $("body").text();

        // Common patterns for context length
        const contextMatches = bodyText.match(/(\d+[km]?)\s*(?:token|context|length)/gi);

        if (contextMatches && contextMatches.length > 0) {
            contextLength = parseContextLength(contextMatches[0]);
        }

        // Determine model capabilities based on partner and model name
        const isClaude = partnerName.toLowerCase().includes("claude") || modelName.toLowerCase().includes("claude");
        const isMistral = partnerName.toLowerCase().includes("mistral") || modelName.toLowerCase().includes("mistral");
        const isAI21 = partnerName.toLowerCase().includes("ai21") || modelName.toLowerCase().includes("jamba");

        // Set capabilities based on partner type
        let extendedThinking = false;
        let reasoning = false;
        let toolCall = false;
        let vision = false;
        let inputModalities: string[] = ["text"];
        const outputModalities: string[] = ["text"];

        if (isClaude) {
            extendedThinking = modelName.toLowerCase().includes("opus") || modelName.toLowerCase().includes("sonnet");
            reasoning = extendedThinking;
            toolCall = extendedThinking;
            vision = extendedThinking;

            if (vision) {
                inputModalities = ["text", "image"];
            }
        } else if (isMistral) {
            reasoning = true;
            toolCall = modelName.toLowerCase().includes("large") || modelName.toLowerCase().includes("codestral");
            vision = modelName.toLowerCase().includes("ocr");

            if (vision) {
                inputModalities = ["text", "image"];
            }
        } else if (isAI21) {
            reasoning = true;
            toolCall = modelName.toLowerCase().includes("large");
        }

        const model: Model = {
            attachment: false,
            cost: {
                input: null,
                inputCacheHit: null,
                output: null,
            },
            extendedThinking,
            id: kebabCase(modelName),
            knowledge: null,
            lastUpdated: null,
            limit: {
                context: contextLength,
                output: null,
            },
            modalities: {
                input: inputModalities,
                output: outputModalities,
            },
            name: modelName,
            openWeights: false,
            provider: `Google Vertex ${partnerName}`,
            providerDoc: url,
            providerEnv: ["GOOGLE_VERTEX_PROJECT", "GOOGLE_VERTEX_LOCATION", "GOOGLE_APPLICATION_CREDENTIALS"],
            providerModelsDevId: "google-vertex-partner",
            providerNpm: "@ai-sdk/google-vertex",
            reasoning,
            releaseDate: null,
            streamingSupported: true,
            temperature: true,
            toolCall,
            vision,
        };

        models.push(model);
        console.log(`[Google Partner] Found model: ${modelName} from ${partnerName}`);

        return models;
    } catch (error) {
        console.error(`[Google Partner] Error extracting model from ${url}:`, error instanceof Error ? error.message : String(error));

        return [];
    }
};

/**
 * Discover partner models by checking known partner URLs.
 */
const discoverPartnerModels = async (): Promise<PartnerModel[]> => {
    const knownPartners = [
        { name: "Claude", slug: "claude" },
        { name: "Mistral AI", slug: "mistral" },
        { name: "AI21 Labs", slug: "ai21" },
    ];

    const partners: PartnerModel[] = [];

    for (const partner of knownPartners) {
        try {
            const partnerUrl = `${GOOGLE_VERTEX_PARTNER_BASE_URL}/${partner.slug}`;

            console.log(`[Google Partner] Checking partner: ${partner.name} at ${partnerUrl}`);

            const response = await axios.get(partnerUrl);
            const $ = load(response.data);

            const modelPages: { displayName: string; slug: string }[] = [];

            // Look for model links in the page content
            $("a[href*='/partner-models/']").each((_, link) => {
                const $link = $(link);
                const href = $link.attr("href");
                const linkText = $link.text().trim();

                if (
                    href
                    && linkText
                    && href.includes(`/partner-models/${partner.slug}/`)
                    && !linkText.includes("Overview")
                    && !linkText.includes("Request predictions")
                    && !linkText.includes("Batch predictions")
                    && !linkText.includes("Prompt caching")
                    && !linkText.includes("Count tokens")
                    && !linkText.includes("Learn how to use")
                ) {
                    const urlParts = href.split("/");
                    const slug = urlParts[urlParts.length - 1];

                    if (slug && slug !== partner.slug) {
                        // Clean up the display name
                        const displayName = linkText.replace(/<wbr>/g, "").replace(/\s+/g, " ").trim();

                        // Avoid duplicates
                        const exists = modelPages.some((m) => m.slug === slug);

                        if (!exists && displayName.length > 0) {
                            modelPages.push({
                                displayName,
                                slug,
                            });
                            console.log(`[Google Partner] Found model: ${displayName} (${slug})`);
                        }
                    }
                }
            });

            if (modelPages.length > 0) {
                partners.push({
                    baseUrl: partnerUrl,
                    modelPages,
                    name: partner.name,
                });
            }
        } catch (error) {
            console.error(`[Google Partner] Error checking ${partner.name}:`, error instanceof Error ? error.message : String(error));
        }
    }

    console.log(`[Google Partner] Discovered ${partners.length} partners with ${partners.reduce((sum, p) => sum + p.modelPages.length, 0)} total models`);

    return partners;
};

/**
 * Scrape partner model pages for a specific partner.
 */
const scrapePartnerModels = async (partner: PartnerModel): Promise<Model[]> => {
    const models: Model[] = [];

    for (const modelPage of partner.modelPages) {
        const url = `${partner.baseUrl}/${modelPage.slug}`;

        console.log(`[Google Partner] Scraping ${partner.name} model page: ${url}`);

        const pageModels = await extractModelFromPage(url, partner.name, modelPage.displayName);

        models.push(...pageModels);
    }

    return models;
};

/**
 * Fetches Google Vertex Partner models from their documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchGooglePartnerModels = async (): Promise<Model[]> => {
    console.log("[Google Partner] Fetching models from partner documentation...");

    try {
        const allModels: Model[] = [];

        // Discover partner models dynamically
        const partnerConfigs = await discoverPartnerModels();

        if (partnerConfigs.length === 0) {
            console.log("[Google Partner] No partners found in navigation, falling back to static config");
            // Fallback to static config if navigation parsing fails
            const fallbackPartners: PartnerModel[] = [
                {
                    baseUrl: `${GOOGLE_VERTEX_PARTNER_BASE_URL}/claude`,
                    modelPages: [
                        { displayName: "Claude Opus 4", slug: "opus-4" },
                        { displayName: "Claude Sonnet 4", slug: "sonnet-4" },
                        { displayName: "Claude 3.7 Sonnet", slug: "sonnet-3-7" },
                        { displayName: "Claude 3.5 Sonnet v2", slug: "sonnet-3-5-v2" },
                        { displayName: "Claude 3.5 Haiku", slug: "haiku-3-5" },
                        { displayName: "Claude 3 Haiku", slug: "haiku-3" },
                        { displayName: "Claude 3.5 Sonnet", slug: "sonnet-3-5" },
                    ],
                    name: "Claude",
                },
                {
                    baseUrl: `${GOOGLE_VERTEX_PARTNER_BASE_URL}/mistral`,
                    modelPages: [
                        { displayName: "Mistral OCR (25.05)", slug: "mistral-ocr" },
                        { displayName: "Mistral Small 3.1 (25.03)", slug: "mistral-small-3-1" },
                        { displayName: "Mistral Large (24.11)", slug: "mistral-large" },
                        { displayName: "Codestral (25.01)", slug: "codestral-2501" },
                    ],
                    name: "Mistral AI",
                },
                {
                    baseUrl: `${GOOGLE_VERTEX_PARTNER_BASE_URL}/ai21`,
                    modelPages: [
                        { displayName: "Jamba 1.5 Large", slug: "jamba-1-5-large" },
                        { displayName: "Jamba 1.5 Mini", slug: "jamba-1-5-mini" },
                    ],
                    name: "AI21 Labs",
                },
            ];

            partnerConfigs.push(...fallbackPartners);
        }

        for (const partner of partnerConfigs) {
            console.log(`[Google Partner] Processing ${partner.name} partner models...`);
            const partnerModels = await scrapePartnerModels(partner);

            allModels.push(...partnerModels);
        }

        console.log(`[Google Partner] Total models found: ${allModels.length}`);

        return allModels;
    } catch (error) {
        console.error("[Google Partner] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};

/**
 * Transforms Google Vertex Partner model data into the normalized structure.
 * @param rawData Raw data from Google Vertex Partner API
 * @returns Array of normalized model objects
 */
export const transformGooglePartnerModels = (rawData: unknown): Model[] => {
    // This function is kept for interface compatibility but the main logic is in fetchGooglePartnerModels
    if (Array.isArray(rawData)) {
        return rawData as Model[];
    }

    return [];
};
