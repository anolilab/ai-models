import { kebabCase } from "@visulima/string";
import axios from "axios";
import { load } from "cheerio";

import type { Model } from "../../../src/schema.js";

const transformGitHubCopilotModels = (htmlContent: string): Model[] => {
    const $ = load(htmlContent);
    const models: Model[] = [];

    // Find the models table - look for the first table that contains model information
    $("table").each((tableIndex, table) => {
        const tableText = $(table).text();

        // Look for the table that contains model information
        // The first table has headers: Model name, Provider, Release status, Agent mode, Ask mode, Edit mode
        if (tableText.includes("Model name") && tableText.includes("Provider")) {
            console.log(`[GitHub Copilot] Found models table ${tableIndex + 1}`);

            $(table)
                .find("tbody tr")
                .each((rowIndex, row) => {
                    const cells = $(row)
                        .find("td, th")
                        .map((_, td) => $(td).text().trim())
                        .get();

                    // Skip header rows or empty rows
                    if (cells.length < 3 || !cells[0] || cells[0].includes("Model name")) {
                        return;
                    }

                    const modelName = cells[0];
                    const provider = cells[1];
                    const releaseStatus = cells[2];

                    // Skip if not a valid model
                    if (!modelName || modelName === "N/A" || modelName === "Model name") {
                        return;
                    }

                    console.log(`[GitHub Copilot] Processing model: ${modelName}`);

                    // Determine model capabilities based on name
                    const isVision = modelName.toLowerCase().includes("vision");
                    const isSonnet = modelName.toLowerCase().includes("sonnet");
                    const isOpus = modelName.toLowerCase().includes("opus");
                    const isHaiku = modelName.toLowerCase().includes("haiku");
                    const isGPT = modelName.toLowerCase().includes("gpt");
                    const isClaude = modelName.toLowerCase().includes("claude");
                    const isGemini = modelName.toLowerCase().includes("gemini");

                    // Determine reasoning capability (Opus and Sonnet have extended thinking)
                    const hasExtendedThinking = isOpus || (isSonnet && modelName.includes("Thinking"));

                    // Determine tool calling capability
                    const hasToolCall = isOpus || isSonnet || isHaiku || isGPT || isClaude || isGemini;

                    // Determine temperature support
                    const hasTemperature = true; // All GitHub Copilot models support temperature

                    // Determine knowledge cutoff
                    let knowledgeCutoff = null;

                    if (modelName.includes("2024")) {
                        knowledgeCutoff = "2024";
                    } else if (modelName.includes("2023")) {
                        knowledgeCutoff = "2023";
                    }

                    // Determine release date based on model name
                    let releaseDate = null;

                    if (modelName.includes("4.1")) {
                        releaseDate = "2024-12-01";
                    } else if (modelName.includes("4o")) {
                        releaseDate = "2024-05-13";
                    } else if (modelName.includes("3.7")) {
                        releaseDate = "2024-11-21";
                    } else if (modelName.includes("3.5")) {
                        releaseDate = "2024-03-04";
                    } else if (modelName.includes("3")) {
                        releaseDate = "2024-02-29";
                    } else if (modelName.includes("2.5")) {
                        releaseDate = "2024-12-01";
                    } else if (modelName.includes("2.0")) {
                        releaseDate = "2024-05-14";
                    }

                    const model: Model = {
                        attachment: false,
                        cost: {
                            input: null, // GitHub Copilot doesn't charge per token
                            inputCacheHit: null,
                            output: null,
                        },
                        extendedThinking: hasExtendedThinking,
                        id: kebabCase(modelName),
                        knowledge: knowledgeCutoff,
                        lastUpdated: null,
                        limit: {
                            context: null, // Not specified in the documentation
                            output: null,
                        },
                        modalities: {
                            input: isVision ? ["text", "image"] : ["text"],
                            output: ["text"],
                        },
                        name: modelName,
                        openWeights: false,
                        provider: "GitHub Copilot",
                        providerDoc: "https://docs.github.com/en/copilot/reference/ai-models/supported-models",
                        // Provider metadata
                        providerEnv: ["GITHUB_TOKEN"],
                        providerModelsDevId: "github-copilot",
                        providerNpm: "@ai-sdk/github-copilot",
                        reasoning: hasExtendedThinking,
                        releaseDate,
                        streamingSupported: true,
                        temperature: hasTemperature,
                        toolCall: hasToolCall,
                        vision: isVision,
                    };

                    models.push(model);
                });
        }
    });

    console.log(`[GitHub Copilot] Extracted ${models.length} models from documentation`);

    return models;
};

/**
 * Fetches models from GitHub Copilot documentation and transforms them.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchGitHubCopilotModels(): Promise<Model[]> {
    console.log("[GitHub Copilot] Fetching: https://docs.github.com/en/copilot/reference/ai-models/supported-models");

    const response = await axios.get("https://docs.github.com/en/copilot/reference/ai-models/supported-models");
    const htmlContent = response.data;

    const models = transformGitHubCopilotModels(htmlContent);

    // If no models were found, this might indicate a parsing failure
    if (models.length === 0) {
        throw new Error("No models found in GitHub Copilot documentation - this may indicate a parsing failure or API change");
    }

    return models;
}

export { fetchGitHubCopilotModels, transformGitHubCopilotModels };
