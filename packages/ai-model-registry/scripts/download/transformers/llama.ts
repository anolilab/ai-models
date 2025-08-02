import type { Model } from "../../../src/schema.js";

/**
 * Raw model data extracted from Llama documentation table
 */
interface LlamaModelData {
    id: string;
    inputModalities: string[];
    name: string;
    outputModalities: string[];
    provider: string;
}

/**
 * Transforms Llama model data into the normalized structure.
 * @param models Array of raw model data from Llama documentation
 * @returns Array of normalized model objects
 */
export const transformLlamaModels = (models: LlamaModelData[]): Model[] =>
    models.map((model) => {
        return {
            attachment: false,
            cost: {
                input: null, // Pricing not available
                inputCacheHit: null,
                output: null,
            },
            extendedThinking: false,
            id: model.id,
            knowledge: null,
            lastUpdated: null,
            limit: {
                context: null, // Not specified in the data
                output: null,
            },
            modalities: {
                input: model.inputModalities,
                output: model.outputModalities,
            },
            name: model.name,
            openWeights: true, // Llama models are open weights
            provider: model.provider,
            providerDoc: "https://llama.meta.com/llama/",
            // Provider metadata
            providerEnv: ["META_API_KEY"],
            providerModelsDevId: "meta",
            providerNpm: "@ai-sdk/meta",
            reasoning: false,
            releaseDate: null,
            streamingSupported: true,
            temperature: true,
            toolCall: true,
            vision: model.inputModalities.includes("image"),
        };
    });

/**
 * Fetches models using Puppeteer to get real-time data from the documentation.
 * @returns Promise that resolves to an array of transformed models
 */
export const fetchLlamaModels = async (): Promise<Model[]> => {
    try {
        console.log("[Llama] Fetching with Puppeteer...");

        const puppeteer = await import("puppeteer");
        const browser = await puppeteer.default.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
            headless: true,
        });
        const page = await browser.newPage();

        // Set a longer timeout and wait for network to be idle
        await page.goto("https://llama.developer.meta.com/docs/models", {
            timeout: 60_000, // Increased timeout to 60 seconds
            waitUntil: "networkidle2",
        });

        // Wait for the table to load with increased timeout
        await page.waitForSelector("table", { timeout: 30_000 }); // Increased to 30 seconds

        // Extract the model data from the table
        const models = await page.evaluate(() => {
            const rows = document.querySelectorAll("tbody tr");

            return [...rows]
                .map((row) => {
                    const cells = row.querySelectorAll("td");

                    if (cells.length < 4)
                        return null;

                    const modelLink = cells[0].querySelector("a");
                    const id = modelLink?.getAttribute("href")?.replace("#", "") || "";
                    const name = cells[0].textContent?.trim() || "";
                    const provider = cells[1].textContent?.trim() || "";
                    const inputModalities
                        = cells[2].textContent
                            ?.trim()
                            .split(",")
                            .map((m) => m.trim().toLowerCase()) || [];
                    const outputModalities
                        = cells[3].textContent
                            ?.trim()
                            .split(",")
                            .map((m) => m.trim().toLowerCase()) || [];

                    return { id, inputModalities, name, outputModalities, provider };
                })
                .filter(Boolean) as LlamaModelData[];
        });

        await browser.close();

        if (models.length === 0) {
            throw new Error("[Llama] No models found with Puppeteer.");
        }

        console.log(`[Llama] Found ${models.length} models with Puppeteer`);

        return transformLlamaModels(models);
    } catch (error) {
        console.error("[Llama] Puppeteer fetch failed:", error instanceof Error ? error.message : String(error));
        throw error;
    }
};
