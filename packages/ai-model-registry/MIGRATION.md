# Migration Guide: v1 → v2

This guide will help you migrate from `@anolilab/ai-model-registry` v1.x to v2.0.0.

## Overview

Version 2.0.0 introduces a **breaking change**: all API functions are now asynchronous and return Promises. This change enables code splitting, dynamic imports, and better performance by loading provider data on-demand.

### What Changed?

- All functions are now `async` and return `Promise<T>`
- Dynamic imports replace static JSON imports
- Provider-specific JSON files for efficient loading
- New type exports for provider-specific model IDs
- Improved tree-shaking and code splitting

### What Stayed the Same?

- Function names and signatures (except async)
- Return types (wrapped in Promise)
- Model schema and data structure
- Search and filter capabilities
- TypeScript type definitions

## Quick Migration Checklist

- [ ] Update all function calls to use `await`
- [ ] Convert synchronous code to async/await or Promise chains
- [ ] Update function signatures in your code to handle Promises
- [ ] Test your application thoroughly
- [ ] Update any TypeScript types if needed

## Step-by-Step Migration

### 1. Update Package Version

```bash
npm install @anolilab/ai-model-registry@^2.0.0
# or
yarn add @anolilab/ai-model-registry@^2.0.0
# or
pnpm add @anolilab/ai-model-registry@^2.0.0
```

### 2. Update Function Calls

#### Before (v1.x)

```typescript
import { getAllModels, getModelById, getModelsByProvider, getProviders, getProviderStats, searchModels } from "@anolilab/ai-model-registry";

// Synchronous calls
const providers = getProviders();
const models = getModelsByProvider("Anthropic");
const model = getModelById("claude-3-opus-20240229");
const results = searchModels({ vision: true });
const allModels = getAllModels();
const stats = getProviderStats();
```

#### After (v2.0.0)

```typescript
import { getAllModels, getModelById, getModelsByProvider, getProviders, getProviderStats, searchModels } from "@anolilab/ai-model-registry";

// All calls are now async - use await
const providers = await getProviders();
const models = await getModelsByProvider("Anthropic");
const model = await getModelById("claude-3-opus-20240229");
const results = await searchModels({ vision: true });
const allModels = await getAllModels();
const stats = await getProviderStats();
```

### 3. Update Function Signatures

If you have functions that use the registry, update them to be async:

#### Before (v1.x)

```typescript
function getModelInfo(modelId: string) {
    const model = getModelById(modelId);

    if (model) {
        return {
            cost: model.cost,
            name: model.name,
            provider: model.provider,
        };
    }

    return null;
}
```

#### After (v2.0.0)

```typescript
async function getModelInfo(modelId: string) {
    const model = await getModelById(modelId);

    if (model) {
        return {
            cost: model.cost,
            name: model.name,
            provider: model.provider,
        };
    }

    return null;
}
```

### 4. Update React Components

#### Before (v1.x)

```typescript
import { useEffect, useState } from "react";
import { getAllModels } from "@anolilab/ai-model-registry";

function ModelList() {
  const [models, setModels] = useState([]);

  useEffect(() => {
    const allModels = getAllModels();
    setModels(allModels);
  }, []);

  return <div>{/* render models */}</div>;
}
```

#### After (v2.0.0)

```typescript
import { useEffect, useState } from "react";
import { getAllModels } from "@anolilab/ai-model-registry";
import type { Model } from "@anolilab/ai-model-registry";

function ModelList() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModels() {
      try {
        const allModels = await getAllModels();
        setModels(allModels);
      } catch (error) {
        console.error("Failed to load models:", error);
      } finally {
        setLoading(false);
      }
    }
    loadModels();
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render models */}</div>;
}
```

### 5. Update React Hooks

#### Before (v1.x)

```typescript
import { searchModels } from "@anolilab/ai-model-registry";
import { useMemo } from "react";

function useVisionModels() {
    return useMemo(() => searchModels({ vision: true }), []);
}
```

#### After (v2.0.0)

```typescript
import type { Model } from "@anolilab/ai-model-registry";
import { searchModels } from "@anolilab/ai-model-registry";
import { useEffect, useState } from "react";

function useVisionModels() {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadModels() {
            try {
                const visionModels = await searchModels({ vision: true });

                setModels(visionModels);
            } catch (error) {
                console.error("Failed to load vision models:", error);
            } finally {
                setLoading(false);
            }
        }

        loadModels();
    }, []);

    return { loading, models };
}
```

### 6. Update Server-Side Code (Node.js, Next.js API Routes)

#### Before (v1.x)

```typescript
// Next.js API route
export default function handler(req, res) {
    const providers = getProviders();

    res.json({ providers });
}
```

#### After (v2.0.0)

```typescript
// Next.js API route
export default async function handler(req, res) {
    try {
        const providers = await getProviders();

        res.json({ providers });
    } catch (error) {
        res.status(500).json({ error: "Failed to load providers" });
    }
}
```

### 7. Update Promise Chains

If you prefer Promise chains over async/await:

#### Before (v1.x)

```typescript
const providers = getProviders();
const models = providers.map((provider) => getModelsByProvider(provider));
```

#### After (v2.0.0)

```typescript
// Using async/await (recommended)
const providers = await getProviders();
const models = await Promise.all(providers.map((provider) => getModelsByProvider(provider)));

// Or using Promise chains
getProviders()
    .then((providers) => Promise.all(providers.map((provider) => getModelsByProvider(provider))))
    .then((models) => {
        // Use models
    });
```

### 8. Update Error Handling

Since functions are now async, errors are thrown asynchronously:

#### Before (v1.x)

```typescript
try {
    const model = getModelById("invalid-id");
    // Handle model
} catch (error) {
    // This won't catch async errors
}
```

#### After (v2.0.0)

```typescript
try {
    const model = await getModelById("invalid-id");
    // Handle model
} catch (error) {
    // Properly handles async errors
    console.error("Failed to get model:", error);
}
```

## New Features in v2.0.0

### Provider-Specific Type Exports

You can now import type-safe model IDs for specific providers:

```typescript
import type { ProviderName } from "@anolilab/ai-model-registry";
import type ModelName from "@anolilab/ai-model-registry/types/open-router";

// Type-safe provider names
const provider: ProviderName = "OpenAI"; // Valid
const invalid: ProviderName = "InvalidProvider"; // TypeScript error

// Type-safe model IDs for OpenRouter
const modelId: ModelName = "meta-llama/llama-3.1-8b-instruct"; // Valid
const invalidId: ModelName = "invalid-model"; // TypeScript error
```

### Dynamic Imports and Code Splitting

The new architecture uses dynamic imports, which means:

- **Smaller initial bundle**: Only load provider data when needed
- **Better tree-shaking**: Unused providers won't be included
- **Improved performance**: Load data on-demand

This happens automatically - no code changes needed beyond using `await`.

## Common Patterns

### Loading Multiple Providers

```typescript
async function loadProviderModels(providerNames: ProviderName[]) {
    const modelsByProvider = await Promise.all(
        providerNames.map(async (provider) => {
            return {
                models: await getModelsByProvider(provider),
                provider,
            }
        }),
    );

    return modelsByProvider;
}
```

### Conditional Loading

```typescript
async function getModelsForProvider(provider?: ProviderName) {
    if (provider) {
        return await getModelsByProvider(provider);
    }

    return await getAllModels();
}
```

### Error Handling with Fallbacks

```typescript
async function getModelWithFallback(modelId: string) {
    try {
        const model = await getModelById(modelId);

        if (model)
            return model;
    } catch (error) {
        console.warn("Failed to load model:", error);
    }

    // Fallback to searching
    const results = await searchModels({
        /* criteria */
    });

    return results[0];
}
```

## Performance Considerations

### Caching

The library now includes built-in caching, so repeated calls to the same provider won't trigger additional network requests:

```typescript
// First call - loads data
const models1 = await getModelsByProvider("Anthropic");

// Second call - uses cache (no additional load)
const models2 = await getModelsByProvider("Anthropic");
```

### Parallel Loading

When loading multiple providers, use `Promise.all` for parallel loading:

```typescript
// Good: Parallel loading
const [anthropic, openai] = await Promise.all([getModelsByProvider("Anthropic"), getModelsByProvider("OpenAI")]);

// Avoid: Sequential loading (slower)
const anthropic = await getModelsByProvider("Anthropic");
const openai = await getModelsByProvider("OpenAI");
```

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about missing `await`:

```typescript
// Error: 'await' expressions are only allowed within async functions
const models = await getModelsByProvider("Anthropic");

// Fix: Make the function async
async function loadModels() {
    const models = await getModelsByProvider("Anthropic");

    return models;
}
```

### Runtime Errors

If you see errors about Promises not being handled:

```typescript
// Error: Unhandled promise rejection
getModelsByProvider("Anthropic").then((models) => {
    // Use models
});

// Fix: Use async/await or handle errors
try {
    const models = await getModelsByProvider("Anthropic");
    // Use models
} catch (error) {
    // Handle error
}
```

### Build Errors

If you see build errors related to dynamic imports, ensure your bundler supports dynamic imports:

- **Webpack**: Supported by default
- **Vite**: Supported by default
- **Rollup**: Supported by default
- **Next.js**: Supported by default

## Breaking Changes Summary

| Function                        | v1.x                           | v2.0.0                                  |
| ------------------------------- | ------------------------------ | --------------------------------------- |
| `getProviders()`                | `ProviderName[]`               | `Promise<ProviderName[]>`               |
| `getModelsByProvider(provider)` | `Model[]`                      | `Promise<Model[]>`                      |
| `getModelById(id)`              | `Model \| undefined`           | `Promise<Model \| undefined>`           |
| `searchModels(criteria)`        | `Model[]`                      | `Promise<Model[]>`                      |
| `getAllModels()`                | `Model[]`                      | `Promise<Model[]>`                      |
| `getProviderStats()`            | `Record<ProviderName, number>` | `Promise<Record<ProviderName, number>>` |

## Need Help?

If you encounter issues during migration:

1. Check the [README.md](./README.md) for the latest API documentation
2. Review the [examples](#common-patterns) above
3. Open an issue on [GitHub](https://github.com/anolilab/ai-models/issues)

## Benefits of v2.0.0

- **Better Performance**: Load data on-demand, reducing initial bundle size
- **Code Splitting**: Automatic code splitting for better tree-shaking
- **Scalability**: As the registry grows, your app won't need to load all models upfront
- **Type Safety**: New provider-specific type exports for better TypeScript support
- **Caching**: Built-in caching prevents redundant data fetching

---

**Migration completed?** Great! You're now using the improved v2.0.0 API with better performance and scalability.
