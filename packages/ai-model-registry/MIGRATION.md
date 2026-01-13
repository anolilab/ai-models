# Migration Guides

## Migration Guide: v2 → v3

This guide will help you migrate from `@anolilab/ai-model-registry` v2.x to v3.0.0.

### Overview

Version 3.0.0 introduces a **breaking change**: the `api.json` export has been removed to improve tree-shaking. Instead, you can now use provider-specific helper functions that import JSON data directly, enabling better code splitting and smaller bundle sizes.

### What Changed?

- ❌ **Removed**: `@anolilab/ai-model-registry/api.json` export
- ✅ **Added**: Provider-specific helper functions at `@anolilab/ai-model-registry/providers/*`
- ✅ **Improved**: Better tree-shaking - only import the providers you need

### What Stayed the Same?

- All main API functions (`getModelsByProvider`, `getAllModels`, etc.) still work
- Model schema and data structure unchanged
- TypeScript type definitions unchanged
- Provider-specific JSON files in `public/` directory still exist

### Quick Migration Checklist

- [ ] Find all imports of `@anolilab/ai-model-registry/api.json`
- [ ] Replace with provider-specific imports or use main API functions
- [ ] Update any direct JSON fetching/parsing code
- [ ] Test your application thoroughly

## Step-by-Step Migration

### 1. Update Package Version

```bash
npm install @anolilab/ai-model-registry@^3.0.0
# or
yarn add @anolilab/ai-model-registry@^3.0.0
# or
pnpm add @anolilab/ai-model-registry@^3.0.0
```

### 2. Migrating from Direct JSON Import

#### Before (v2.x)

```typescript
// ❌ This no longer works
import apiData from "@anolilab/ai-model-registry/api.json";

const allModels = apiData.models;
const { metadata } = apiData;
```

#### After (v3.0.0) - Option 1: Use Main API Functions

```typescript
// ✅ Use the main API functions (recommended for cross-provider queries)
import { getAllModels } from "@anolilab/ai-model-registry";

const allModels = await getAllModels();
```

#### After (v3.0.0) - Option 2: Use Provider-Specific Functions

```typescript
// ✅ Import only the provider you need (better tree-shaking)
import { getModels as getAnthropicModels } from "@anolilab/ai-model-registry/providers/anthropic";
import { getModels } from "@anolilab/ai-model-registry/providers/open-ai";

// Synchronous - no await needed!
const openAIModels = getModels();
const anthropicModels = getAnthropicModels();
```

### 3. Migrating from Fetching JSON via CDN/URL

#### Before (v2.x)

```typescript
// ❌ Fetching from CDN
const response = await fetch("https://unpkg.com/@anolilab/ai-model-registry/api.json");
const apiData = await response.json();
const allModels = apiData.models;
```

#### After (v3.0.0)

```typescript
// ✅ Use the main API function
import { getAllModels } from "@anolilab/ai-model-registry";

const allModels = await getAllModels();
```

### 4. Migrating Provider-Specific Code

#### Before (v2.x)

```typescript
// ❌ Filtering from full API JSON
import apiData from "@anolilab/ai-model-registry/api.json";

const openAIModels = apiData.models.filter((model) => model.provider === "OpenAI");
```

#### After (v3.0.0) - Option 1: Provider-Specific Import

```typescript
// ✅ Direct provider import (best for tree-shaking)
import { getModels } from "@anolilab/ai-model-registry/providers/open-ai";

const openAIModels = getModels(); // Synchronous!
```

#### After (v3.0.0) - Option 2: Main API Function

```typescript
// ✅ Use main API (works for all providers)
import { getModelsByProvider } from "@anolilab/ai-model-registry";

const openAIModels = await getModelsByProvider("OpenAI");
```

### 5. Available Provider-Specific Functions

Each provider file exports the following functions:

```typescript
import {
    getModelById, // Get a specific model by ID
    getModelCount, // Get total model count
    getModels, // Get all models for this provider
    searchModels, // Search/filter models
} from "@anolilab/ai-model-registry/providers/open-ai";

// All functions are synchronous (no await needed)
const models = getModels();
const model = getModelById("gpt-4");
const visionModels = searchModels({ vision: true });
const count = getModelCount();
```

### 6. Provider File Names

Provider file names use kebab-case. Here are some examples:

| Provider Name  | Import Path                                            |
| -------------- | ------------------------------------------------------ |
| OpenAI         | `@anolilab/ai-model-registry/providers/open-ai`        |
| Anthropic      | `@anolilab/ai-model-registry/providers/anthropic`      |
| Google         | `@anolilab/ai-model-registry/providers/google`         |
| Azure OpenAI   | `@anolilab/ai-model-registry/providers/azure-open-ai`  |
| Amazon Bedrock | `@anolilab/ai-model-registry/providers/amazon-bedrock` |
| Hugging Face   | `@anolilab/ai-model-registry/providers/hugging-face`   |

### 7. Example: Migrating a React Component

#### Before (v2.x)

```typescript
import { useEffect, useState } from "react";
import apiData from "@anolilab/ai-model-registry/api.json";

function ModelList() {
    const [models, setModels] = useState(apiData.models);

    return <div>{/* render models */}</div>;
}
```

#### After (v3.0.0) - Option 1: Provider-Specific

```typescript
import { useState } from "react";
import { getModels } from "@anolilab/ai-model-registry/providers/open-ai";

function ModelList() {
    const [models] = useState(() => getModels()); // Synchronous!

    return <div>{/* render models */}</div>;
}
```

#### After (v3.0.0) - Option 2: Main API

```typescript
import { useEffect, useState } from "react";
import { getAllModels } from "@anolilab/ai-model-registry";

function ModelList() {
    const [models, setModels] = useState([]);

    useEffect(() => {
        getAllModels().then(setModels);
    }, []);

    return <div>{/* render models */}</div>;
}
```

## Benefits of v3.0.0

- **Better Tree-Shaking**: Import only the providers you need
- **Smaller Bundles**: Unused providers won't be included in your bundle
- **Synchronous Provider Functions**: Provider-specific functions are synchronous (no await needed)
- **Improved Performance**: Direct JSON imports enable better optimization by bundlers

## Breaking Changes Summary

| Feature                   | v2.x                                                   | v3.0.0                                                                      |
| ------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `api.json` export         | ✅ Available at `@anolilab/ai-model-registry/api.json` | ❌ Removed                                                                  |
| Provider-specific imports | ❌ Not available                                       | ✅ Available at `@anolilab/ai-model-registry/providers/*`                   |
| Provider functions        | ❌ Not available                                       | ✅ Synchronous functions: `getModels()`, `getModelById()`, `searchModels()` |
| Main API functions        | ✅ Async: `await getAllModels()`                       | ✅ Still async: `await getAllModels()` (unchanged)                          |

## Need Help?

If you encounter issues during migration:

1. Check the [README.md](./README.md) for the latest API documentation
2. Review the [examples](#step-by-step-migration) above
3. Open an issue on [GitHub](https://github.com/anolilab/ai-models/issues)

---

## Migration Guide: v1 → v2

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
            };
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

        if (model) return model;
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
