import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const WANDB_PRICING_URL = "https://wandb.ai/site/pricing/inference/";
const WANDB_DOCS_URL = "https://docs.wandb.ai/weave/guides/integrations/inference/";

/**
 * Converts a display name like "DeepSeek R1-0528" to a slug ID like "deepseek-r1-0528"
 */
const nameToId = (name: string): string =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/^-|-$/g, "");

/**
 * Fetches W&B Inference models from the public pricing page.
 * @returns Promise resolving to an array of normalized Model objects
 */
export const fetchWeightsBiasesModels = async (): Promise<Model[]> => {
    console.log("[Weights & Biases] Fetching models from pricing page:", WANDB_PRICING_URL);

    try {
        const response = await axios.get<string>(WANDB_PRICING_URL, {
            headers: {
                Accept: "text/html",
                "User-Agent": "Mozilla/5.0 (compatible; AI-Models-Bot/1.0)",
            },
            timeout: 30_000,
        });

        const $ = load(response.data);
        const models: Model[] = [];

        $(".comparison-row").each((_, row) => {
            const label = $(row).find(".comparison-row__label").text().trim();
            const values = $(row)
                .find(".comparison-row__value")
                .map((_, el) => $(el).text().trim())
                .get();

            if (!label || values.length < 2) {
                return;
            }

            const inputCostPerM = Number.parseFloat(values[0].replace("$", ""));
            const outputCostPerM = Number.parseFloat(values[1].replace("$", ""));

            const hasReasoning = label.toLowerCase().includes("thinking") || /r1/i.test(label);

            models.push({
                attachment: false,
                cost: {
                    input: Number.isNaN(inputCostPerM) ? null : inputCostPerM / 1000,
                    inputCacheHit: null,
                    output: Number.isNaN(outputCostPerM) ? null : outputCostPerM / 1000,
                },
                extendedThinking: hasReasoning,
                id: nameToId(label),
                knowledge: null,
                lastUpdated: null,
                limit: {
                    context: null,
                    output: null,
                },
                modalities: {
                    input: ["text"],
                    output: ["text"],
                },
                name: label,
                openWeights: false,
                provider: "Weights & Biases",
                providerDoc: WANDB_DOCS_URL,
                providerEnv: ["WANDB_API_KEY"],
                providerModelsDevId: "weights-biases",
                providerNpm: "@ai-sdk/openai-compatible",
                reasoning: hasReasoning,
                releaseDate: null,
                streamingSupported: true,
                temperature: true,
                toolCall: false,
                vision: false,
            });
        });

        console.log(`[Weights & Biases] Found ${models.length} models`);

        return models;
    } catch (error) {
        console.error("[Weights & Biases] Error fetching models:", error instanceof Error ? error.message : String(error));

        return [];
    }
};
