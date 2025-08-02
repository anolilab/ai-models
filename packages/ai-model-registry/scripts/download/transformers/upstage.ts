import { launch } from "puppeteer";

import type { Model } from "../../../src/schema.js";

const UPSTAGE_MODELS_URL = "https://console.upstage.ai/docs/models/history";

/**
 * Extract model information from the Upstage models page using Puppeteer.
 */
const extractModelsFromPage = async (): Promise<Model[]> => {
    const browser = await launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log("[Upstage] Loading models page:", UPSTAGE_MODELS_URL);
        await page.goto(UPSTAGE_MODELS_URL, { waitUntil: "domcontentloaded" });

        // Wait for the content to load
        await page.waitForSelector("h1", { timeout: 10000 });

        // Extract model information from the page
        const models = await page.evaluate(() => {
            const results: Model[] = [];

            // Look for Solar-related links (these are the model links)
            const allLinks = document.querySelectorAll("a");
            const solarLinks = Array.from(allLinks).filter((link) => {
                const text = link.textContent ? link.textContent.toLowerCase() : "";
                const href = link.getAttribute("href") || "";

                return text.includes("solar") || href.includes("solar");
            });

            for (let i = 0; i < solarLinks.length; i++) {
                const link = solarLinks[i];
                const href = link.getAttribute("href") || "";
                const text = link.textContent ? link.textContent.trim() : "";

                // Skip if it's not a model link (anchor links starting with #)
                if (!href.startsWith("#") || !text) {
                    continue;
                }

                // Skip duplicate links
                if (results.some((model) => model.name === text)) {
                    continue;
                }

                // Try to find additional metadata for this model
                let contextLength = null;
                let releaseDate = null;
                let trainingDataCutoff = null;

                // Look for the model section that contains this link
                const modelSection = link.closest("section") || link.closest("div");

                if (modelSection) {
                    const sectionText = modelSection.textContent || "";

                    // Extract context length (look for patterns like "65,536" or "32K")
                    const contextMatch = sectionText.match(/Context length\s*([\d,]+)/i);

                    if (contextMatch) {
                        contextLength = parseInt(contextMatch[1].replace(/,/g, ""), 10);
                    }

                    // Extract release date (look for patterns like "2025-07-10")
                    const releaseMatch = sectionText.match(/Release date\s*(\d{4}-\d{2}-\d{2})/i);

                    if (releaseMatch) {
                        releaseDate = releaseMatch[1];
                    }

                    // Extract training data cut-off (look for patterns like "Dec 2023")
                    const trainingMatch = sectionText.match(/Training data cut-off\s*([A-Z]+\s+\d{4})/i);

                    if (trainingMatch && trainingMatch[1]) {
                        trainingDataCutoff = trainingMatch[1].trim();
                    }
                }

                // Determine capabilities based on model name
                const nameLower = text.toLowerCase();
                const vision = nameLower.includes("vision") || nameLower.includes("docvision");
                const toolCall = nameLower.includes("pro") || nameLower.includes("function");
                const reasoning = nameLower.includes("pro") || nameLower.includes("reasoning");

                const model: Model = {
                    attachment: false,
                    cost: {
                        input: null,
                        inputCacheHit: null,
                        output: null,
                    },
                    description: `${text} model from Upstage`,
                    id: text
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, ""),
                    knowledge: trainingDataCutoff,
                    lastUpdated: null,
                    limit: {
                        context: contextLength,
                        output: null,
                    },
                    modalities: {
                        input: vision ? ["text", "image"] : ["text"],
                        output: ["text"],
                    },
                    name: text,
                    openWeights: false,
                    provider: "Upstage",
                    providerDoc: `https://console.upstage.ai/docs/models/history${href}`,
                    providerEnv: ["UPSTAGE_API_KEY"],
                    providerModelsDevId: "upstage",
                    providerNpm: "@ai-sdk/upstage",
                    reasoning,
                    releaseDate,
                    streamingSupported: true,
                    temperature: true,
                    toolCall,
                    vision,
                };

                results.push(model);
            }

            return results;
        });

        return models;
    } catch (error) {
        console.error("[Upstage] Error extracting models:", error);

        return [];
    } finally {
        await browser.close();
    }
};

/**
 * Fetches Upstage models from their documentation page using Puppeteer.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchUpstageModels = async (): Promise<Model[]> => {
    console.log("[Upstage] Fetching models using Puppeteer...");

    try {
        const models = await extractModelsFromPage();

        if (models.length === 0) {
            console.log("[Upstage] No models found on the page");

            return [];
        }

        console.log(`[Upstage] Found ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Upstage] Error fetching models:", error);

        return [];
    }
};

/**
 * Transforms raw Upstage model data into standardized Model objects.
 * This function is kept for compatibility but now delegates to fetchUpstageModels.
 * @param rawData Raw model data (unused in this implementation)
 * @returns Promise that resolves to an array of transformed models
 */
export const transformUpstageModels = async (rawData: any): Promise<Model[]> => fetchUpstageModels();
