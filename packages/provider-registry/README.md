# @anolilab/provider-registry

A unified registry for AI model providers and their metadata. This package provides a comprehensive, tree-shakable interface to access model information from various AI providers including Meta, Anthropic, Google, Groq, and many others.

## Features

- **Unified Interface**: Access models from multiple providers through a single API
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Tree Shaking**: Import only what you need to minimize bundle size
- **Rich Metadata**: Comprehensive model information including capabilities, pricing, and limits
- **Search & Filter**: Powerful search capabilities across all models

## Installation

```bash
npm install @anolilab/provider-registry
```

## Quick Start

```typescript
import { getProviders, getModelsByProvider, getModelById, searchModels } from '@anolilab/provider-registry';

// Get all available providers
const providers = getProviders();
console.log(providers); // ['Anthropic', 'Google', 'Groq', 'Meta', ...]

// Get all models from a specific provider
const anthropicModels = getModelsByProvider('Anthropic');
console.log(anthropicModels.length); // Number of Anthropic models

// Get a specific model by ID
const model = getModelById('claude-3-opus-20240229');
console.log(model?.name); // "Claude 3 Opus"

// Search for models with specific capabilities
const visionModels = searchModels({ vision: true });
const reasoningModels = searchModels({ reasoning: true });
const toolCallModels = searchModels({ tool_call: true });
```

## API Reference

### `getProviders(): string[]`

Returns an array of all available provider names.

### `getModelsByProvider(provider: string): Model[]`

Returns all models for a specific provider.

### `getModelById(id: string): Model | undefined`

Returns a specific model by its ID, or `undefined` if not found.

### `searchModels(criteria: SearchCriteria): Model[]`

Search models by various criteria:

```typescript
interface SearchCriteria {
  vision?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  streaming_supported?: boolean;
  provider?: string;
  preview?: boolean;
  modalities?: {
    input?: string[];
    output?: string[];
  };
  context_min?: number;
  context_max?: number;
}
```

### `getAllModels(): Model[]`

Returns all models (useful for advanced filtering).

### `getProviderStats(): Record<string, number>`

Returns provider statistics with model counts.

## Model Schema

Each model follows this structure:

```typescript
interface Model {
  // Core identification
  id: string;
  name: string | null;
  provider?: string;
  
  // Capabilities
  vision?: boolean;
  reasoning: boolean;
  tool_call: boolean;
  streaming_supported?: boolean;
  
  // Pricing
  cost: {
    input: number | null;
    output: number | null;
    input_cache_hit: number | null;
  };
  
  // Limits
  limit: {
    context: number | null;
    output: number | null;
  };
  
  // Modalities
  modalities: {
    input: string[];
    output: string[];
  };
  
  // ... and many more fields
}
```

## Tree Shaking

The package supports tree shaking, so you can import only what you need:

```typescript
// Only import specific functions
import { getProviders } from '@anolilab/provider-registry';

// Import schema for validation
import { ModelSchema } from '@anolilab/provider-registry/schema';
```

## Supported Providers

- **Anthropic** (Claude models)
- **Google** (Gemini models)
- **Meta** (Llama models)
- **Groq** (Various models)
- **Amazon** (Titan models)
- **DeepSeek** (DeepSeek models)
- **Vercel** (v0 models)
- **OpenRouter** (Various models)
- **GitHub Copilot** (Various models)
- **Azure** (OpenAI models)
- **HuggingFace** (Various hosted models)
- And many more...

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Development mode with watch
npm run dev

# Aggregate provider data
npm run aggregate
```

## License

MIT 