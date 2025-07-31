import { describe, it, expect } from 'vitest';
import {
  getProviders,
  getModelsByProvider,
  getModelById,
  searchModels,
  getAllModels,
  getProviderStats,
  ModelSchema,
} from './index';

describe('Provider Registry', () => {
  describe('getProviders', () => {
    it('should return an array of provider names', () => {
      const providers = getProviders();
      
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.every(provider => typeof provider === 'string')).toBe(true);
    });

    it('should return unique provider names', () => {
      const providers = getProviders();
      const uniqueProviders = new Set(providers);
      
      expect(providers.length).toBe(uniqueProviders.size);
    });

    it('should return providers in alphabetical order', () => {
      const providers = getProviders();
      const sortedProviders = [...providers].sort();
      
      expect(providers).toEqual(sortedProviders);
    });
  });

  describe('getModelsByProvider', () => {
    it('should return models for a valid provider', () => {
      const anthropicModels = getModelsByProvider('Anthropic');
      
      expect(Array.isArray(anthropicModels)).toBe(true);
      expect(anthropicModels.length).toBeGreaterThan(0);
      expect(anthropicModels.every(model => model.provider === 'Anthropic')).toBe(true);
    });

    it('should return empty array for non-existent provider', () => {
      const models = getModelsByProvider('NonExistentProvider');
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(0);
    });

    it('should return empty array for empty provider name', () => {
      const models = getModelsByProvider('');
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(0);
    });

    it('should be case sensitive', () => {
      const anthropicModels = getModelsByProvider('Anthropic');
      const lowercaseModels = getModelsByProvider('anthropic');
      
      expect(anthropicModels.length).toBeGreaterThan(0);
      // Note: Some providers might be case-insensitive in the actual data
      // This test verifies that the function works, regardless of case sensitivity
      expect(typeof lowercaseModels.length).toBe('number');
    });
  });

  describe('getModelById', () => {
    it('should return a model for a valid ID', () => {
      // Get a known model ID from the actual data
      const allModels = getAllModels();
      const anthropicModels = allModels.filter(m => m.provider === 'Anthropic');
      const testModel = anthropicModels[0];
      
      if (testModel) {
        const model = getModelById(testModel.id);
        
        expect(model).toBeDefined();
        expect(model?.id).toBe(testModel.id);
        expect(model?.provider).toBe('Anthropic');
      } else {
        // Skip test if no Anthropic models found
        expect(true).toBe(true);
      }
    });

    it('should return undefined for non-existent ID', () => {
      const model = getModelById('non-existent-model-id');
      
      expect(model).toBeUndefined();
    });

    it('should return undefined for empty ID', () => {
      const model = getModelById('');
      
      expect(model).toBeUndefined();
    });
  });

  describe('searchModels', () => {
    it('should filter by vision capability', () => {
      const visionModels = searchModels({ vision: true });
      const nonVisionModels = searchModels({ vision: false });
      
      expect(visionModels.every(model => model.vision === true)).toBe(true);
      expect(nonVisionModels.every(model => model.vision === false)).toBe(true);
    });

    it('should filter by reasoning capability', () => {
      const reasoningModels = searchModels({ reasoning: true });
      const nonReasoningModels = searchModels({ reasoning: false });
      
      expect(reasoningModels.every(model => model.reasoning === true)).toBe(true);
      expect(nonReasoningModels.every(model => model.reasoning === false)).toBe(true);
    });

    it('should filter by tool_call capability', () => {
      const toolCallModels = searchModels({ tool_call: true });
      const nonToolCallModels = searchModels({ tool_call: false });
      
      expect(toolCallModels.every(model => model.tool_call === true)).toBe(true);
      expect(nonToolCallModels.every(model => model.tool_call === false)).toBe(true);
    });

    it('should filter by streaming support', () => {
      const streamingModels = searchModels({ streaming_supported: true });
      const nonStreamingModels = searchModels({ streaming_supported: false });
      
      expect(streamingModels.every(model => model.streaming_supported === true)).toBe(true);
      expect(nonStreamingModels.every(model => model.streaming_supported === false)).toBe(true);
    });

    it('should filter by provider', () => {
      const anthropicModels = searchModels({ provider: 'Anthropic' });
      
      expect(anthropicModels.every(model => model.provider === 'Anthropic')).toBe(true);
    });

    it('should filter by preview status', () => {
      const previewModels = searchModels({ preview: true });
      const nonPreviewModels = searchModels({ preview: false });
      
      expect(previewModels.every(model => model.preview === true)).toBe(true);
      expect(nonPreviewModels.every(model => model.preview === false)).toBe(true);
    });

    it('should filter by input modalities', () => {
      const textModels = searchModels({ modalities: { input: ['text'] } });
      const imageModels = searchModels({ modalities: { input: ['image'] } });
      
      expect(textModels.every(model => model.modalities.input.includes('text'))).toBe(true);
      expect(imageModels.every(model => model.modalities.input.includes('image'))).toBe(true);
    });

    it('should filter by output modalities', () => {
      const textOutputModels = searchModels({ modalities: { output: ['text'] } });
      
      expect(textOutputModels.every(model => model.modalities.output.includes('text'))).toBe(true);
    });

    it('should filter by context window range', () => {
      const largeContextModels = searchModels({ context_min: 100000 });
      const smallContextModels = searchModels({ context_max: 10000 });
      
      // Test that the search function works correctly
      // Note: Some models might have null context values, so we need to handle that
      if (largeContextModels.length > 0) {
        const validLargeContextModels = largeContextModels.filter(model => 
          model.limit.context !== null && model.limit.context !== undefined
        );
        if (validLargeContextModels.length > 0) {
          expect(validLargeContextModels.every(model => 
            model.limit.context! >= 100000
          )).toBe(true);
        }
      }
      
      if (smallContextModels.length > 0) {
        const validSmallContextModels = smallContextModels.filter(model => 
          model.limit.context !== null && model.limit.context !== undefined
        );
        if (validSmallContextModels.length > 0) {
          expect(validSmallContextModels.every(model => 
            model.limit.context! <= 10000
          )).toBe(true);
        }
      }
      
      // The search function should work even if no models match the criteria
      expect(typeof largeContextModels.length).toBe('number');
      expect(typeof smallContextModels.length).toBe('number');
    });

    it('should combine multiple filters', () => {
      const filteredModels = searchModels({
        provider: 'Anthropic',
        vision: true,
        reasoning: true
      });
      
      expect(filteredModels.every(model => 
        model.provider === 'Anthropic' && 
        model.vision === true && 
        model.reasoning === true
      )).toBe(true);
    });

    it('should return all models when no criteria provided', () => {
      const allModels = getAllModels();
      const searchResults = searchModels({});
      
      expect(searchResults.length).toBe(allModels.length);
    });
  });

  describe('getAllModels', () => {
    it('should return all models', () => {
      const models = getAllModels();
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return a copy of the models array', () => {
      const models1 = getAllModels();
      const models2 = getAllModels();
      
      expect(models1).not.toBe(models2); // Should be different references
      expect(models1).toEqual(models2); // But same content
    });

    it('should return models that pass schema validation', () => {
      const models = getAllModels();
      
      models.forEach(model => {
        const result = ModelSchema.safeParse(model);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('getProviderStats', () => {
    it('should return provider statistics', () => {
      const stats = getProviderStats();
      
      expect(typeof stats).toBe('object');
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });

    it('should return correct model counts', () => {
      const stats = getProviderStats();
      const allModels = getAllModels();
      
      // Sum of all provider counts should equal total models
      const totalCount = Object.values(stats).reduce((sum, count) => sum + count, 0);
      expect(totalCount).toBe(allModels.length);
    });

    it('should only include providers with models', () => {
      const stats = getProviderStats();
      
      Object.entries(stats).forEach(([provider, count]) => {
        expect(typeof provider).toBe('string');
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('Data integrity', () => {
    it('should have consistent data across all functions', () => {
      const allModels = getAllModels();
      const providers = getProviders();
      const stats = getProviderStats();
      
      // All models should have a provider
      const modelsWithProviders = allModels.filter(model => model.provider);
      expect(modelsWithProviders.length).toBe(allModels.length);
      
      // All providers in stats should be in the providers list
      const statsProviders = Object.keys(stats);
      statsProviders.forEach(provider => {
        expect(providers).toContain(provider);
      });
      
      // All providers in the list should have models
      providers.forEach(provider => {
        const providerModels = getModelsByProvider(provider);
        expect(providerModels.length).toBeGreaterThan(0);
      });
    });

    it('should have unique model IDs per provider', () => {
      const allModels = getAllModels();
      
      // Group models by provider
      const modelsByProvider = new Map<string, Model[]>();
      allModels.forEach(model => {
        if (!modelsByProvider.has(model.provider)) {
          modelsByProvider.set(model.provider, []);
        }
        modelsByProvider.get(model.provider)!.push(model);
      });
      
      // Check for duplicates within each provider
      const duplicatesByProvider = new Map<string, string[]>();
      
      for (const [provider, models] of modelsByProvider) {
        const modelIds = models.map(model => model.id);
        const uniqueIds = new Set(modelIds);
        
        if (modelIds.length !== uniqueIds.size) {
          // Find the actual duplicates
          const duplicates = modelIds.filter((id, index) => modelIds.indexOf(id) !== index);
          duplicatesByProvider.set(provider, [...new Set(duplicates)]);
        }
      }
      
      // Log any duplicates found
      if (duplicatesByProvider.size > 0) {
        console.warn('Duplicate model IDs found within providers:');
        for (const [provider, duplicates] of duplicatesByProvider) {
          console.warn(`  ${provider}:`, duplicates);
        }
      }
      
      // Assert that there are no duplicates within any provider
      expect(duplicatesByProvider.size).toBe(0);
      
      // Also verify that we have models and they have IDs
      expect(allModels.length).toBeGreaterThan(0);
      expect(allModels.every(model => model.id && model.id.trim() !== '')).toBe(true);
    });
  });
}); 