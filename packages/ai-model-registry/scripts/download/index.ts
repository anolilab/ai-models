import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { blue, bold, cyan, gray, green, red, yellow } from "@visulima/colorize";
import { snakeCase } from "@visulima/string";

import type { Model } from "../../src/schema.ts";
import { ModelSchema } from "../../src/schema.ts";
import type { ProviderConfig } from "../config.ts";
import { PROVIDERS_CONFIG } from "../config.ts";

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(__filename);

/**
 * Check if colors are supported in the current terminal
 */
const supportsColors = process.stdout.isTTY && process.env.FORCE_COLOR !== "0";

/**
 * Colored console output functions using @visulima/colorize
 */
const consoleColors = {
    error: (message: string) => console.error(supportsColors ? red(message) : message),
    highlight: (message: string) => console.log(supportsColors ? bold(cyan(message)) : message),
    info: (message: string) => console.log(supportsColors ? blue(message) : message),
    muted: (message: string) => console.log(supportsColors ? gray(message) : message),
    success: (message: string) => console.log(supportsColors ? green(message) : message),
    warning: (message: string) => console.warn(supportsColors ? yellow(message) : message),
};

/**
 * Command line arguments interface
 */
interface CliArguments {
    outputPath: string;
    providerName: string | null;
}

/**
 * Processing result interface
 */
interface ProcessingResult {
    error?: string;
    errors?: number;
    hasWarning?: boolean;
    models?: number;
    name: string;
    output?: string;
    saved?: number;
}

/**
 * Transformer module interface
 */
interface TransformerModule {
    default?: () => Promise<Model[]>;
    fetchAIHubMixModels?: () => Promise<Model[]>;
    fetchAlibabaModels?: () => Promise<Model[]>;
    fetchAnthropicModels?: () => Promise<Model[]>;
    fetchAzureModels?: () => Promise<Model[]>;
    fetchBedrockModels?: () => Promise<Model[]>;
    fetchCerebrasModels?: () => Promise<Model[]>;
    fetchChutesModels?: () => Promise<Model[]>;
    fetchCloudflareModels?: () => Promise<Model[]>;
    fetchDeepInfraModels?: () => Promise<Model[]>;
    fetchDeepSeekModels?: () => Promise<Model[]>;
    fetchFireworksAIModels?: () => Promise<Model[]>;
    fetchGitHubCopilotModels?: () => Promise<Model[]>;
    fetchGitHubModels?: () => Promise<Model[]>;
    fetchGoogleModels?: () => Promise<Model[]>;
    fetchGooglePartnerModels?: () => Promise<Model[]>;
    fetchGoogleVertexModels?: () => Promise<Model[]>;
    fetchGroqModels?: () => Promise<Model[]>;
    fetchHuggingFaceModels?: () => Promise<Model[]>;
    fetchInceptionModels?: () => Promise<Model[]>;
    fetchInferenceModels?: () => Promise<Model[]>;
    fetchLlamaModels?: () => Promise<Model[]>;
    fetchMistralModels?: () => Promise<Model[]>;
    fetchModelScopeModels?: () => Promise<Model[]>;
    fetchMorphModels?: () => Promise<Model[]>;
    fetchOllamaModels?: () => Promise<Model[]>;
    fetchOpenAIModels?: () => Promise<Model[]>;
    fetchOpenRouterModels?: () => Promise<Model[]>;
    fetchRequestyModels?: () => Promise<Model[]>;
    fetchTogetherAIModels?: () => Promise<Model[]>;
    fetchUpstageModels?: () => Promise<Model[]>;
    fetchV0Models?: () => Promise<Model[]>;
    fetchVeniceModels?: () => Promise<Model[]>;
    fetchVercelModels?: () => Promise<Model[]>;
    fetchWeightsBiasesModels?: () => Promise<Model[]>;
    fetchXAIModels?: () => Promise<Model[]>;
}

const parseArguments = (): CliArguments => {
    const arguments_ = process.argv.slice(2);
    const outputPath = path.join(__dirname, "../../data/providers");
    let providerName: string | null = null;

    // Parse --provider argument
    const providerIndex = arguments_.indexOf("--provider");

    if (providerIndex !== -1 && providerIndex + 1 < arguments_.length) {
        providerName = arguments_[providerIndex + 1];
    }

    return { outputPath, providerName };
};

const showHelp = (): never => {
    console.log(`
Usage: node index.js [options]

Options:
  --provider <name>      Process only the specified provider
  --concurrency <num>    Number of concurrent downloads (default: 5)
  --help, -h            Show this help message

Examples:
  node index.js                                    # Process all providers with default concurrency (5)
  node index.js --provider "OpenRouter"            # Process only OpenRouter
  node index.js --concurrency 10                   # Process all providers with 10 concurrent downloads
  node index.js --provider "OpenAI" --concurrency 3 # Process OpenAI with 3 concurrent downloads
`);
    process.exit(0);
};

const ensureDirSync = (dir: string): void => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const getProvider = (model: Model): string => {
    if (model.ownedBy) return snakeCase(model.ownedBy);

    if ("author" in model && model.author) return snakeCase(model.author as string);

    if (model.provider) return snakeCase(model.provider);

    if (model.id && typeof model.id === "string" && model.id.includes("/")) {
        return snakeCase(model.id.split("/")[0]);
    }

    return "unknown";
};

const getModelId = (model: Model): string => snakeCase(model.id || model.name || "unknown-model");

const getFetchFunction = (transformerModule: TransformerModule): (() => Promise<Model[]>) | null =>
    transformerModule.fetchAIHubMixModels ||
    transformerModule.fetchAzureModels ||
    transformerModule.fetchOpenRouterModels ||
    transformerModule.fetchVercelModels ||
    transformerModule.fetchBedrockModels ||
    transformerModule.fetchAnthropicModels ||
    transformerModule.fetchDeepSeekModels ||
    transformerModule.fetchGitHubCopilotModels ||
    transformerModule.fetchGoogleModels ||
    transformerModule.fetchGroqModels ||
    transformerModule.fetchHuggingFaceModels ||
    transformerModule.fetchInceptionModels ||
    transformerModule.fetchInferenceModels ||
    transformerModule.fetchLlamaModels ||
    transformerModule.fetchOpenAIModels ||
    transformerModule.fetchDeepInfraModels ||
    transformerModule.fetchAlibabaModels ||
    transformerModule.fetchFireworksAIModels ||
    transformerModule.fetchGitHubModels ||
    transformerModule.fetchGoogleVertexModels ||
    transformerModule.fetchGooglePartnerModels ||
    transformerModule.fetchMistralModels ||
    transformerModule.fetchMorphModels ||
    transformerModule.fetchOllamaModels ||
    transformerModule.fetchRequestyModels ||
    transformerModule.fetchTogetherAIModels ||
    transformerModule.fetchUpstageModels ||
    transformerModule.fetchV0Models ||
    transformerModule.fetchVeniceModels ||
    transformerModule.fetchXAIModels ||
    transformerModule.fetchModelScopeModels ||
    transformerModule.fetchCloudflareModels ||
    transformerModule.fetchWeightsBiasesModels ||
    transformerModule.fetchCerebrasModels ||
    transformerModule.fetchChutesModels ||
    transformerModule.default ||
    null;

/**
 * Processes a single provider: fetches data, transforms models, and saves them.
 * @param providerConfig Configuration object for the provider
 * @param outputPath Base output directory path
 * @returns Result object containing processing statistics
 */
async function processProvider(providerConfig: ProviderConfig, outputPath: string): Promise<ProcessingResult> {
    const { name, output, transformer } = providerConfig;

    // Validate provider name
    if (!name || typeof name !== "string" || name.trim() === "") {
        throw new Error(`Invalid provider name: "${name}". Provider name must be a non-empty string.`);
    }

    // Validate transformer path
    if (!transformer || typeof transformer !== "string" || transformer.trim() === "") {
        throw new Error(`Invalid transformer path for provider "${name}": "${transformer}". Transformer path must be a non-empty string.`);
    }

    // Validate output path
    if (!output || typeof output !== "string" || output.trim() === "") {
        throw new Error(`Invalid output path for provider "${name}": "${output}". Output path must be a non-empty string.`);
    }

    const transformerPath = path.resolve(__dirname, transformer);

    let transformerModule: TransformerModule;

    try {
        transformerModule = await import(transformerPath);
    } catch (error_) {
        const error = new Error(
            `Could not load transformer '${transformer}' for provider "${name}": ${error_ instanceof Error ? error_.message : String(error_)}`,
        );

        consoleColors.error(`[${name}] ERROR: ${error.message}`);

        return { error: error.message, name };
    }

    // Get the fetch function from the transformer
    const fetchFunction = getFetchFunction(transformerModule);

    if (!fetchFunction) {
        consoleColors.error(`[${name}] ERROR: No fetch function found in transformer`);

        return { error: "No fetch function found", name };
    }

    let models: Model[] = [];

    try {
        models = await fetchFunction();
    } catch (error) {
        consoleColors.error(`[${name}] ERROR: Fetch failed:`, error instanceof Error ? error.message : String(error));

        return { error: error instanceof Error ? error.message : String(error), name };
    }

    if (models.length === 0) {
        consoleColors.warning(`[${name}] WARNING: No models found.`);

        return { hasWarning: true, models: 0, name, saved: 0 };
    }

    let errors = 0;
    let saved = 0;

    for (const model of models) {
        try {
            // Validate with Zod
            const parseResult = ModelSchema.safeParse(model);

            if (!parseResult.success) {
                errors++;
                consoleColors.error(`[${name}] ERROR: Model validation failed for id=${model.id}:`, parseResult.error.issues);
                continue;
            }

            const provider = getProvider(model);
            const modelId = getModelId(model);
            const outDir = path.join(outputPath, output, provider);

            ensureDirSync(outDir);

            const outPath = path.join(outDir, `${modelId}.json`);

            fs.writeFileSync(outPath, JSON.stringify(model, null, 2));

            saved++;
        } catch (error) {
            errors++;
            consoleColors.error(`[${name}] ERROR: Failed to save model:`, error instanceof Error ? error.message : String(error));
        }
    }

    // Use colored output based on results
    if (errors > 0) {
        consoleColors.error(`[${name}] Done. Models processed: ${models.length}, saved: ${saved}, errors: ${errors}`);
    } else if (saved === 0) {
        consoleColors.warning(`[${name}] Done. Models processed: ${models.length}, saved: ${saved}, errors: ${errors}`);
    } else {
        consoleColors.success(`[${name}] Done. Models processed: ${models.length}, saved: ${saved}, errors: ${errors}`);
    }

    return { errors, models: models.length, name, output, saved };
}

/**
 * Main function that processes all providers using the imported configuration.
 */
const main = async (): Promise<void> => {
    const arguments_ = parseArguments();

    // Show help if --help is provided
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
        showHelp();
    }

    // Filter providers if a specific provider name is provided
    let providersToProcess = PROVIDERS_CONFIG;

    if (arguments_.providerName) {
        // Validate that the provided provider name is correct
        if (!arguments_.providerName || typeof arguments_.providerName !== "string" || arguments_.providerName.trim() === "") {
            throw new Error(`Invalid provider name: "${arguments_.providerName}". Provider name must be a non-empty string.`);
        }

        providersToProcess = PROVIDERS_CONFIG.filter((p) => p.name.toLowerCase() === arguments_.providerName!.toLowerCase());

        if (providersToProcess.length === 0) {
            const availableProviders = PROVIDERS_CONFIG.map((p) => p.name.toLowerCase()).join(", ");

            throw new Error(`Provider "${arguments_.providerName}" not found in config. Available providers: ${availableProviders}`);
        }

        consoleColors.info(`Processing provider: ${arguments_.providerName}`);
    } else {
        consoleColors.info(`Processing all ${PROVIDERS_CONFIG.length} providers...`);
    }

    // Parse concurrency from command line arguments (default: 5)
    const concurrencyIndex = process.argv.indexOf("--concurrency");
    const concurrency = concurrencyIndex !== -1 && concurrencyIndex + 1 < process.argv.length ? parseInt(process.argv[concurrencyIndex + 1], 10) : 5;

    if (isNaN(concurrency) || concurrency < 1) {
        consoleColors.error("Invalid concurrency value. Must be a positive integer.");
        process.exit(1);
    }

    consoleColors.info(`Running downloads with concurrency: ${concurrency}`);

    // Process providers in parallel with concurrency limit
    const processProvidersInParallel = async (): Promise<ProcessingResult[]> => {
        const queue = [...providersToProcess];
        const results: ProcessingResult[] = [];
        let completedCount = 0;
        let runningCount = 0;

        // Progress tracking
        const startTime = Date.now();
        const updateProgress = () => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const progress = ((completedCount / providersToProcess.length) * 100).toFixed(1);
            const eta = completedCount > 0 ? ((elapsed * (providersToProcess.length - completedCount)) / completedCount).toFixed(1) : "?";

            consoleColors.info(
                `Progress: ${completedCount}/${providersToProcess.length} (${progress}%) - ${runningCount} running - Elapsed: ${elapsed}s - ETA: ${eta}s`,
            );
        };

        // Worker function to process a single provider
        const worker = async (): Promise<void> => {
            while (queue.length > 0) {
                const providerConfig = queue.shift()!;

                if (!providerConfig) continue;

                runningCount++;
                consoleColors.info(`[${providerConfig.name}] Starting download (${runningCount} running, ${queue.length} queued)`);

                try {
                    const result = await processProvider(providerConfig, arguments_.outputPath);

                    results.push(result);
                    completedCount++;
                    runningCount--;

                    // Update progress
                    updateProgress();

                    // Small delay to be respectful to APIs
                    await new Promise((resolve) => setTimeout(resolve, 100));
                } catch (error) {
                    const errorResult: ProcessingResult = {
                        error: error instanceof Error ? error.message : String(error),
                        name: providerConfig.name,
                    };

                    results.push(errorResult);
                    completedCount++;
                    runningCount--;

                    consoleColors.error(`[${providerConfig.name}] Failed: ${errorResult.error}`);
                    updateProgress();

                    // Small delay to be respectful to APIs
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }
        };

        // Start worker pool
        const initialBatch = Math.min(concurrency, queue.length);
        const workers: Promise<void>[] = [];

        consoleColors.info(`Starting ${initialBatch} concurrent workers...`);

        for (let i = 0; i < initialBatch; i++) {
            workers.push(worker());
        }

        // Wait for all workers to complete
        await Promise.all(workers);

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

        consoleColors.success(`All downloads completed in ${totalTime}s!`);

        return results;
    };

    // Run parallel downloads
    const results = await processProvidersInParallel();

    // Print summary
    const summaryTitle = arguments_.providerName ? `=== ${arguments_.providerName} Summary ===` : "=== Batch Summary ===";

    console.log(`\n${summaryTitle}`);

    let hasWarnings = false;
    let hasErrors = false;

    for (const r of results) {
        if (r.error) {
            consoleColors.error(`[${r.name}] ERROR: ${r.error}`);
            hasErrors = true;
        } else if (r.hasWarning || (r.models === 0 && r.saved === 0)) {
            consoleColors.warning(`[${r.name}] Models: ${r.models}, Saved: ${r.saved}, Errors: ${r.errors}, Output: ${r.output} ⚠️  WARNING: No models found`);
            hasWarnings = true;
        } else if (r.errors && r.errors > 0) {
            consoleColors.error(`[${r.name}] Models: ${r.models}, Saved: ${r.saved}, Errors: ${r.errors}, Output: ${r.output}`);
            hasErrors = true;
        } else {
            consoleColors.success(`[${r.name}] Models: ${r.models}, Saved: ${r.saved}, Errors: ${r.errors}, Output: ${r.output}`);
        }
    }

    // Show warnings again at the end if any providers had 0 models
    const providersWithWarnings = results.filter((r) => r.hasWarning || (r.models === 0 && r.saved === 0));

    if (providersWithWarnings.length > 0) {
        console.log();
        consoleColors.warning("⚠️  WARNINGS SUMMARY:");

        for (const r of providersWithWarnings) {
            consoleColors.warning(`  • ${r.name}: No models found (0 models, 0 saved)`);
        }
    }

    // Exit with appropriate code
    if (hasErrors) {
        process.exit(1);
    } else if (hasWarnings || providersWithWarnings.length > 0) {
        process.exit(1); // Exit with 1 for warnings as requested
    } else {
        process.exit(0);
    }
};

// Wrap main function call in try-catch to handle thrown errors
try {
    main().catch((error) => {
        console.error("ERROR:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
} catch (error) {
    console.error("ERROR:", error instanceof Error ? error.message : String(error));
    process.exit(1);
}
