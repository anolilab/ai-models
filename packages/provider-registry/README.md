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

## Pricing Data Integration

This package automatically includes pricing data from [Helicone's LLM Cost API](https://helicone.ai/api/llm-costs) during the aggregation process. When you run `npm run aggregate`, the system:

1. **Fetches all models** from provider data
2. **Retrieves pricing data** from Helicone API (840+ models)
3. **Matches models** using smart algorithms
4. **Enriches models** with missing pricing information
5. **Generates output** with complete pricing data

### Features

- **Automatic Enrichment**: Pricing data is automatically added during aggregation
- **Smart Matching**: Uses multiple strategies to match models with pricing data
- **Non-Destructive**: Preserves existing pricing data while filling in missing values
- **Cost Conversion**: Automatically converts from per 1M tokens to per 1K tokens format

### Supported Pricing Providers

Helicone provides pricing data for 840+ models across providers including:
- OpenAI (GPT models)
- Anthropic (Claude models)
- Google (Gemini models)
- Meta (Llama models)
- Mistral (Mistral models)
- Groq (Various models)
- And many more...

### Usage

```bash
# Aggregate all models with pricing data
npm run aggregate

# Build the package (includes aggregation with pricing)
npm run build
```

### API Response

The Helicone API returns pricing data in this format:
```json
{
  "provider": "OPENAI",
  "model": "gpt-4",
  "input_cost_per_1m": 30.0,
  "output_cost_per_1m": 60.0,
  "per_image": 0.0075,
  "per_call": 0.01
}
```

**Note**: All costs are per 1 million tokens and are automatically converted to per 1K tokens in the final output.

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Development mode with watch
npm run dev

# Aggregate provider data (includes pricing enrichment)
npm run aggregate
```

## License

MIT 