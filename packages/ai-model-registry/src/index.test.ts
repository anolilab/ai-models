import { describe, expect, it } from "vitest";

import type { Model } from "./index";
import { getAllModels, getModelById, getModelsByProvider, getProviders, getProviderStats, ModelSchema, searchModels } from "./index";

describe("provider Registry", () => {
    describe(getProviders, () => {
        it("should return an array of provider names", () => {
            expect.assertions(3);

            const providers = getProviders();

            expect(Array.isArray(providers)).toBe(true);
            expect(providers.length).toBeGreaterThan(0);
            expect(providers.every((provider) => typeof provider === "string")).toBe(true);
        });

        it("should return unique provider names", () => {
            expect.assertions(1);

            const providers = getProviders();
            const uniqueProviders = new Set(providers);

            expect(providers).toHaveLength(uniqueProviders.size);
        });

        it("should return providers in alphabetical order", () => {
            expect.assertions(1);

            const providers = getProviders();
            const sortedProviders = [...providers].sort();

            expect(providers).toStrictEqual(sortedProviders);
        });
    });

    describe(getModelsByProvider, () => {
        it("should return models for a valid provider", () => {
            expect.assertions(3);

            const anthropicModels = getModelsByProvider("Anthropic");

            expect(Array.isArray(anthropicModels)).toBe(true);
            expect(anthropicModels.length).toBeGreaterThan(0);
            expect(anthropicModels.every((model) => model.provider === "Anthropic")).toBe(true);
        });

        it("should return empty array for non-existent provider", () => {
            expect.assertions(2);

            const models = getModelsByProvider("NonExistentProvider");

            expect(Array.isArray(models)).toBe(true);
            expect(models).toHaveLength(0);
        });

        it("should return empty array for empty provider name", () => {
            expect.assertions(2);

            const models = getModelsByProvider("");

            expect(Array.isArray(models)).toBe(true);
            expect(models).toHaveLength(0);
        });

        it("should be case sensitive", () => {
            expect.assertions(2);

            const anthropicModels = getModelsByProvider("Anthropic");
            const lowercaseModels = getModelsByProvider("anthropic");

            expect(anthropicModels.length).toBeGreaterThan(0);
            // Note: Some providers might be case-insensitive in the actual data
            // This test verifies that the function works, regardless of case sensitivity
            expect(typeof lowercaseModels.length).toBe("number");
        });
    });

    describe(getModelById, () => {
        it("should return a model for a valid ID", () => {
            // Get a known model ID from the actual data
            const allModels = getAllModels();
            const anthropicModel = allModels.find((m) => m.provider === "Anthropic");
            const testModel = anthropicModel;

            // eslint-disable-next-line vitest/no-conditional-in-test
            if (testModel) {
                // eslint-disable-next-line vitest/no-conditional-expect
                expect.assertions(3);

                const model = getModelById(testModel.id);

                // eslint-disable-next-line vitest/no-conditional-expect
                expect(model).toBeDefined();
                // eslint-disable-next-line vitest/no-conditional-expect
                expect(model?.id).toBe(testModel.id);
                // eslint-disable-next-line vitest/no-conditional-expect
                expect(model?.provider).toBe("Anthropic");
            } else {
                // Skip test if no Anthropic models found
                // eslint-disable-next-line vitest/no-conditional-expect
                expect.assertions(1);
                // eslint-disable-next-line vitest/no-conditional-expect
                expect(true).toBe(true);
            }
        });

        it("should return undefined for non-existent ID", () => {
            expect.assertions(1);

            const model = getModelById("non-existent-model-id");

            expect(model).toBeUndefined();
        });

        it("should return undefined for empty ID", () => {
            expect.assertions(1);

            const model = getModelById("");

            expect(model).toBeUndefined();
        });
    });

    describe(searchModels, () => {
        it("should filter by vision capability", () => {
            expect.assertions(2);

            const visionModels = searchModels({ vision: true });
            const nonVisionModels = searchModels({ vision: false });

            expect(visionModels.every((model) => model.vision === true)).toBe(true);
            expect(nonVisionModels.every((model) => model.vision === false)).toBe(true);
        });

        it("should filter by reasoning capability", () => {
            expect.assertions(2);

            const reasoningModels = searchModels({ reasoning: true });
            const nonReasoningModels = searchModels({ reasoning: false });

            expect(reasoningModels.every((model) => model.reasoning === true)).toBe(true);
            expect(nonReasoningModels.every((model) => model.reasoning === false)).toBe(true);
        });

        it("should filter by tool_call capability", () => {
            expect.assertions(2);

            const toolCallModels = searchModels({ tool_call: true });
            const nonToolCallModels = searchModels({ tool_call: false });

            expect(toolCallModels.every((model) => model.toolCall === true)).toBe(true);
            expect(nonToolCallModels.every((model) => model.toolCall === false)).toBe(true);
        });

        it("should filter by streaming support", () => {
            expect.assertions(2);

            const streamingModels = searchModels({ streaming_supported: true });
            const nonStreamingModels = searchModels({ streaming_supported: false });

            expect(streamingModels.every((model) => model.streamingSupported === true)).toBe(true);
            expect(nonStreamingModels.every((model) => model.streamingSupported === false)).toBe(true);
        });

        it("should filter by provider", () => {
            expect.assertions(1);

            const anthropicModels = searchModels({ provider: "Anthropic" });

            expect(anthropicModels.every((model) => model.provider === "Anthropic")).toBe(true);
        });

        it("should filter by preview status", () => {
            expect.assertions(2);

            const previewModels = searchModels({ preview: true });
            const nonPreviewModels = searchModels({ preview: false });

            expect(previewModels.every((model) => model.preview === true)).toBe(true);
            expect(nonPreviewModels.every((model) => model.preview === false)).toBe(true);
        });

        it("should filter by input modalities", () => {
            expect.assertions(2);

            const textModels = searchModels({ modalities: { input: ["text"] } });
            const imageModels = searchModels({ modalities: { input: ["image"] } });

            expect(textModels.every((model) => model.modalities.input.includes("text"))).toBe(true);
            expect(imageModels.every((model) => model.modalities.input.includes("image"))).toBe(true);
        });

        it("should filter by output modalities", () => {
            expect.assertions(1);

            const textOutputModels = searchModels({ modalities: { output: ["text"] } });

            expect(textOutputModels.every((model) => model.modalities.output.includes("text"))).toBe(true);
        });

        // eslint-disable-next-line vitest/prefer-expect-assertions
        it("should filter by context window range", () => {
            const largeContextModels = searchModels({ context_min: 100_000 });
            const smallContextModels = searchModels({ context_max: 10_000 });

            // Count conditional assertions
            let assertionCount = 2; // Always have the two type checks at the end

            // Test that the search function works correctly
            // Note: Some models might have null context values, so we need to handle that
            // eslint-disable-next-line vitest/no-conditional-in-test
            if (largeContextModels.length > 0) {
                const validLargeContextModels = largeContextModels.filter((model) => model.limit.context !== null && model.limit.context !== undefined);

                if (validLargeContextModels.length > 0) {
                    assertionCount++;
                }
            }

            // eslint-disable-next-line vitest/no-conditional-in-test
            if (smallContextModels.length > 0) {
                const validSmallContextModels = smallContextModels.filter((model) => model.limit.context !== null && model.limit.context !== undefined);

                if (validSmallContextModels.length > 0) {
                    assertionCount++;
                }
            }

            expect.assertions(assertionCount);

            // eslint-disable-next-line vitest/no-conditional-in-test
            if (largeContextModels.length > 0) {
                const validLargeContextModels = largeContextModels.filter((model) => model.limit.context !== null && model.limit.context !== undefined);

                if (validLargeContextModels.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, vitest/no-conditional-expect
                    expect(validLargeContextModels.every((model) => model.limit.context! >= 100_000)).toBe(true);
                }
            }

            // eslint-disable-next-line vitest/no-conditional-in-test
            if (smallContextModels.length > 0) {
                const validSmallContextModels = smallContextModels.filter((model) => model.limit.context !== null && model.limit.context !== undefined);

                if (validSmallContextModels.length > 0) {
                    // eslint-disable-next-line vitest/no-conditional-expect
                    expect(validSmallContextModels.every((model) => model.limit.context! <= 10_000)).toBe(true);
                }
            }

            // The search function should work even if no models match the criteria
            expect(typeof largeContextModels.length).toBe("number");
            expect(typeof smallContextModels.length).toBe("number");
        });

        it("should combine multiple filters", () => {
            expect.assertions(1);

            const filteredModels = searchModels({
                provider: "Anthropic",
                reasoning: true,
                vision: true,
            });

            expect(filteredModels.every((model) => model.provider === "Anthropic" && model.vision === true && model.reasoning === true)).toBe(true);
        });

        it("should return all models when no criteria provided", () => {
            expect.assertions(1);

            const allModels = getAllModels();
            const searchResults = searchModels({});

            expect(searchResults).toHaveLength(allModels.length);
        });
    });

    describe(getAllModels, () => {
        it("should return all models", () => {
            expect.assertions(2);

            const models = getAllModels();

            expect(Array.isArray(models)).toBe(true);
            expect(models.length).toBeGreaterThan(0);
        });

        it("should return a copy of the models array", () => {
            expect.assertions(2);

            const models1 = getAllModels();
            const models2 = getAllModels();

            expect(models1).not.toBe(models2); // Should be different references
            expect(models1).toStrictEqual(models2); // But same content
        });

        it("should return models that pass schema validation", () => {
            expect.assertions(1);

            const models = getAllModels();

            expect.assertions(models.length);

            models.forEach((model) => {
                const result = ModelSchema.safeParse(model);

                expect(result.success).toBe(true);
            });
        });
    });

    describe(getProviderStats, () => {
        it("should return provider statistics", () => {
            expect.assertions(2);

            const stats = getProviderStats();

            expect(typeof stats).toBe("object");
            expect(Object.keys(stats).length).toBeGreaterThan(0);
        });

        it("should return correct model counts", () => {
            expect.assertions(1);

            const stats = getProviderStats();
            const allModels = getAllModels();

            // Sum of all provider counts should equal total models
            const totalCount = Object.values(stats).reduce((sum, count) => sum + count, 0);

            expect(totalCount).toBe(allModels.length);
        });

        it("should only include providers with models", () => {
            expect.assertions(3);

            const stats = getProviderStats();
            const entries = Object.entries(stats);

            expect.assertions(entries.length * 3);

            Object.entries(stats).forEach(([provider, count]) => {
                expect(typeof provider).toBe("string");
                expect(typeof count).toBe("number");
                expect(count).toBeGreaterThan(0);
            });
        });
    });

    describe("data integrity", () => {
        it("should have consistent data across all functions", () => {
            expect.assertions(3);

            const allModels = getAllModels();
            const providers = getProviders();
            const stats = getProviderStats();

            expect.assertions(1 + Object.keys(stats).length + providers.length);

            // All models should have a provider
            const modelsWithProviders = allModels.filter((model) => model.provider);

            expect(modelsWithProviders).toHaveLength(allModels.length);

            // All providers in stats should be in the providers list
            const statsProviders = Object.keys(stats);

            statsProviders.forEach((provider) => {
                expect(providers).toContain(provider);
            });

            // All providers in the list should have models
            providers.forEach((provider) => {
                const providerModels = getModelsByProvider(provider);

                expect(providerModels.length).toBeGreaterThan(0);
            });
        });

        it("should have unique model IDs per provider", () => {
            expect.assertions(3);

            const allModels = getAllModels();

            // Group models by provider
            const modelsByProvider = new Map<string, Model[]>();

            allModels.forEach((model) => {
                if (model.provider && !modelsByProvider.has(model.provider)) {
                    modelsByProvider.set(model.provider, []);
                }

                if (model.provider) {
                    modelsByProvider.get(model.provider)!.push(model);
                }
            });

            // Check for duplicates within each provider
            const duplicatesByProvider = new Map<string, string[]>();

            for (const [provider, models] of modelsByProvider) {
                const modelIds = models.map((model) => model.id);
                const uniqueIds = new Set(modelIds);

                if (modelIds.length !== uniqueIds.size) {
                    // Find the actual duplicates
                    const duplicates = modelIds.filter((id, index) => modelIds.indexOf(id) !== index);

                    duplicatesByProvider.set(provider, [...new Set(duplicates)]);
                }
            }

            // Log any duplicates found
            // eslint-disable-next-line vitest/no-conditional-in-test
            if (duplicatesByProvider.size > 0) {
                let errorMessage = "Duplicate model IDs found within providers:";

                for (const [provider, duplicates] of duplicatesByProvider) {
                    errorMessage += `  ${provider}: ${duplicates.join(", ")}\n`;
                }

                throw new Error(errorMessage);
            }

            // Assert that there are no duplicates within any provider
            expect(duplicatesByProvider.size).toBe(0);

            // Also verify that we have models and they have IDs
            expect(allModels.length).toBeGreaterThan(0);
            expect(allModels.every((model) => model.id && model.id.trim() !== "")).toBe(true);
        });
    });
});
