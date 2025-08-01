# @anolilab/provider-registry

[![npm version](https://badge.fury.io/js/@anolilab%2Fprovider-registry.svg)](https://badge.fury.io/js/@anolilab%2Fprovider-registry)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive, unified registry for AI model providers and their metadata. This package provides a tree-shakable interface to access model information from 50+ AI providers including OpenAI, Anthropic, Google, Meta, Groq, and many others.

## ✨ Features

- **🔄 Unified Interface**: Access models from multiple providers through a single API
- **🛡️ Type Safety**: Full TypeScript support with Zod schema validation
- **📦 Tree Shaking**: Import only what you need to minimize bundle size
- **💰 Rich Metadata**: Comprehensive model information including capabilities, pricing, and limits
- **🔍 Powerful Search**: Advanced search and filtering capabilities across all models
- **🔄 Auto-Sync**: Automatic data synchronization between models with the same ID
- **💸 Pricing Integration**: Real-time pricing data from Helicone API (840+ models)
- **📊 Provider Stats**: Detailed statistics and analytics

## 📦 Installation

```bash
# Using npm
npm install @anolilab/provider-registry

# Using yarn
yarn add @anolilab/provider-registry

# Using pnpm
pnpm add @anolilab/provider-registry
```

## 🚀 Quick Start

```typescript
import { getProviders, getModelsByProvider, getModelById, searchModels, getAllModels } from "@anolilab/provider-registry";

// Get all available providers
const providers = getProviders();
console.log(providers);
// ['Anthropic', 'Google', 'Groq', 'Meta', 'OpenAI', 'DeepSeek', ...]

// Get all models from a specific provider
const anthropicModels = getModelsByProvider("Anthropic");
console.log(`Found ${anthropicModels.length} Anthropic models`);

// Get a specific model by ID
const model = getModelById("claude-3-opus-20240229");
if (model) {
    console.log(`Model: ${model.name}`);
    console.log(`Provider: ${model.provider}`);
    console.log(`Cost: $${model.cost.input}/1K input, $${model.cost.output}/1K output`);
    console.log(`Context: ${model.limit.context?.toLocaleString()} tokens`);
}

// Search for models with specific capabilities
const visionModels = searchModels({ vision: true });
const reasoningModels = searchModels({ reasoning: true });
const toolCallModels = searchModels({ tool_call: true });

// Get all models for advanced filtering
const allModels = getAllModels();
```

## 📚 API Reference

### Core Functions

#### `getProviders(): string[]`

Returns an array of all available provider names.

```typescript
const providers = getProviders();
// ['Anthropic', 'Google', 'Groq', 'Meta', 'OpenAI', ...]
```

#### `getModelsByProvider(provider: string): Model[]`

Returns all models for a specific provider.

```typescript
const openAIModels = getModelsByProvider("OpenAI");
const anthropicModels = getModelsByProvider("Anthropic");
```

#### `getModelById(id: string): Model | undefined`

Returns a specific model by its ID, or `undefined` if not found.

```typescript
const gpt4 = getModelById("gpt-4");
const claude = getModelById("claude-3-opus-20240229");
```

#### `getAllModels(): Model[]`

Returns all models (useful for advanced filtering and custom logic).

```typescript
const allModels = getAllModels();
const expensiveModels = allModels.filter((model) => (model.cost.input || 0) > 0.1 || (model.cost.output || 0) > 0.1);
```

#### `getProviderStats(): Record<string, number>`

Returns provider statistics with model counts.

```typescript
const stats = getProviderStats();
console.log(stats);
// {
//   'OpenAI': 15,
//   'Anthropic': 8,
//   'Google': 12,
//   'Meta': 25,
//   ...
// }
```

### Advanced Search

#### `searchModels(criteria: SearchCriteria): Model[]`

Search models by various criteria with powerful filtering options.

```typescript
interface SearchCriteria {
    // Capability filters
    vision?: boolean;
    reasoning?: boolean;
    tool_call?: boolean;
    streaming_supported?: boolean;
    preview?: boolean;

    // Provider filter
    provider?: string;

    // Modality filters
    modalities?: {
        input?: string[];
        output?: string[];
    };

    // Context window filters
    context_min?: number;
    context_max?: number;

    // Cost filters
    max_input_cost?: number;
    max_output_cost?: number;
}
```

#### Search Examples

```typescript
// Find all vision-capable models
const visionModels = searchModels({ vision: true });

// Find models with reasoning capabilities
const reasoningModels = searchModels({ reasoning: true });

// Find models that support tool calling
const toolCallModels = searchModels({ tool_call: true });

// Find models from a specific provider
const openAIModels = searchModels({ provider: "OpenAI" });

// Find models with large context windows
const largeContextModels = searchModels({ context_min: 100000 });

// Find affordable models
const affordableModels = searchModels({
    max_input_cost: 0.01,
    max_output_cost: 0.02,
});

// Find models that accept text and image input
const multimodalModels = searchModels({
    modalities: {
        input: ["text", "image"],
    },
});

// Find models with streaming support
const streamingModels = searchModels({ streaming_supported: true });

// Find preview/beta models
const previewModels = searchModels({ preview: true });
```

## 🏗️ Model Schema

Each model follows a comprehensive schema with the following structure:

```typescript
interface Model {
    // Core identification
    id: string;
    name: string | null;
    provider?: string;
    providerId?: string;

    // Provider metadata
    providerEnv?: string[];
    providerNpm?: string;
    providerDoc?: string;
    providerModelsDevId?: string;

    // Date information
    releaseDate?: string | null;
    lastUpdated?: string | null;
    launchDate?: string;
    trainingCutoff?: string | null;

    // Capabilities
    attachment: boolean;
    reasoning: boolean;
    temperature: boolean;
    toolCall: boolean;
    openWeights: boolean;
    vision?: boolean;
    extendedThinking?: boolean;
    preview?: boolean;

    // Knowledge and context
    knowledge?: string | null;

    // Pricing structure
    cost: {
        input: number | null; // per 1K tokens
        output: number | null; // per 1K tokens
        inputCacheHit: number | null; // cache hit pricing
        imageGeneration?: number | null;
        imageGenerationUltra?: number | null;
        videoGeneration?: number | null;
        videoGenerationWithAudio?: number | null;
        videoGenerationWithoutAudio?: number | null;
    };

    // Limits
    limit: {
        context: number | null; // max tokens
        output: number | null; // max tokens
    };

    // Modalities
    modalities: {
        input: string[]; // ['text', 'image', 'audio', ...]
        output: string[]; // ['text', 'image', 'audio', ...]
    };

    // Infrastructure
    regions?: string[];
    streamingSupported?: boolean | null;
    deploymentType?: string;
    version?: string | null;

    // Provider-specific capabilities
    cacheRead?: boolean;
    codeExecution?: boolean;
    searchGrounding?: boolean;
    structuredOutputs?: boolean;
    batchMode?: boolean;
    audioGeneration?: boolean;
    imageGeneration?: boolean;
    compoundSystem?: boolean;

    // Version management
    versions?: {
        stable?: string | null;
        preview?: string | null;
    };

    // Additional metadata
    description?: string;
    ownedBy?: string;
    originalModelId?: string;
    providerStatus?: string;
    supportsTools?: boolean;
    supportsStructuredOutput?: boolean;
}
```

## 🌳 Tree Shaking

The package supports tree shaking, so you can import only what you need:

```typescript
// Only import specific functions
import { getProviders, getModelById } from "@anolilab/provider-registry";

// Import schema for validation
import { ModelSchema } from "@anolilab/provider-registry/schema";

// Import icons (if needed)
import { getIcon } from "@anolilab/provider-registry/icons";
```

## 🏢 Supported Providers

The registry includes models from 50+ providers:

### Major Providers

- **OpenAI** (GPT-4, GPT-3.5, O1, O3, etc.)
- **Anthropic** (Claude 3.5, Claude 3, Claude 2.1, etc.)
- **Google** (Gemini 2.5, Gemini 1.5, PaLM, etc.)
- **Meta** (Llama 3, Llama 2, Code Llama, etc.)
- **Groq** (Various models with ultra-fast inference)
- **DeepSeek** (DeepSeek R1, DeepSeek V3, etc.)

### Specialized Providers

- **Mistral AI** (Mistral Large, Mixtral, etc.)
- **Cohere** (Command R, Command A, etc.)
- **Perplexity** (Sonar, Sonar Pro, etc.)
- **Together AI** (Various open models)
- **Fireworks AI** (Various models)
- **Vercel** (v0 models)

### Open Source & Research

- **HuggingFace** (Various hosted models)
- **ModelScope** (Chinese models)
- **OpenRouter** (Aggregated models)
- **GitHub Copilot** (Code models)
- **Azure** (OpenAI models)

And many more...

## 🛠️ Development

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Setup

```bash
# Clone the repository
git clone https://github.com/anolilab/ai-models.git
cd ai-models

# Install dependencies
pnpm install

# Complete build process
pnpm run download    # Download provider data
pnpm run aggregate   # Aggregate and enrich data
pnpm run generate-icons  # Generate provider icons
pnpm run build       # Build the package

# Run tests
pnpm test
```

### Build Process

The complete build process involves several steps to download, aggregate, and generate all necessary data:

```bash
# 1. Download provider data
pnpm run download

# 2. Aggregate and enrich provider data (includes pricing from Helicone API)
pnpm run aggregate

# 3. Generate provider icons
pnpm run generate-icons

# 4. Build the package
pnpm run build
```

#### What Each Step Does

1. **Download (`pnpm run download`)**: Downloads model data from various AI providers using transformers in `scripts/download/transformers/`. This creates the raw provider data in `data/providers/`.

2. **Aggregate (`pnpm run aggregate`)**: 
   - Reads all provider data from `data/providers/`
   - Fetches pricing data from Helicone API
   - Enriches models with icon information
   - Synchronizes data between models with the same ID
   - Generates `data/all-models.json` and `src/models-data.ts`

3. **Generate Icons (`pnpm run generate-icons`)**: 
   - Creates SVG sprite sheet from LobeHub icons and custom icons
   - Generates `src/icons-sprite.ts` with icon mappings
   - Provides fallback icons for providers without official icons

4. **Build (`pnpm run build`)**: 
   - Compiles TypeScript to JavaScript
   - Generates type definitions
   - Creates the final distributable package

### Available Scripts

```bash
# Download provider data from various sources
pnpm run download

# Download data for a specific provider
pnpm run download --provider openai
pnpm run download --provider anthropic

# Aggregate provider data (includes pricing enrichment and synchronization)
pnpm run aggregate

# Generate provider icons
pnpm run generate-icons

# Build the package
pnpm run build

# Build for production
pnpm run build:prod

# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Lint code
pnpm run lint:eslint

# Type check
pnpm run lint:types
```

### Project Structure

```
packages/provider-registry/
├── src/
│   ├── index.ts          # Main exports
│   ├── schema.ts         # Model schema definitions
│   └── models-data.ts    # Generated model data
├── scripts/
│   ├── aggregate-providers.ts    # Data aggregation script
│   ├── generate-svg-sprite.ts    # Icon generation
│   └── download/                 # Provider data downloaders
├── data/
│   ├── all-models.json   # Generated model data
│   └── providers/        # Raw provider data
└── assets/
    └── icons/            # Provider icons
```

## 💰 Pricing Data Integration

This package automatically includes real-time pricing data from [Helicone's LLM Cost API](https://helicone.ai/api/llm-costs) during the aggregation process.

### Features

- **🔄 Automatic Enrichment**: Pricing data is automatically added during aggregation
- **🎯 Smart Matching**: Uses multiple strategies to match models with pricing data
- **🛡️ Non-Destructive**: Preserves existing pricing data while filling in missing values
- **🔄 Cost Conversion**: Automatically converts from per 1M tokens to per 1K tokens format
- **📊 840+ Models**: Covers pricing for 840+ models across all major providers

### Supported Pricing Providers

Helicone provides pricing data for models from:

- OpenAI (GPT-4, GPT-3.5, O1, O3, etc.)
- Anthropic (Claude models)
- Google (Gemini models)
- Meta (Llama models)
- Mistral (Mistral models)
- Groq (Various models)
- And many more...

### Usage

```bash
# Aggregate all models with pricing data
pnpm run aggregate

# Build the package (includes aggregation with pricing)
pnpm run build
```

## 🔄 Model Data Synchronization

The provider registry includes a powerful data synchronization system that automatically merges missing data between models with the same ID across different providers.

### How It Works

1. **Groups models by ID**: Finds all models with the same ID across different providers
2. **Calculates completeness scores**: Evaluates how complete each model's data is (excluding cost fields)
3. **Uses the most complete model as base**: Selects the model with the highest data completeness
4. **Merges missing data**: Fills in missing fields from other models with the same ID
5. **Preserves cost data**: Never overwrites existing cost information

### Protected Fields

The following cost-related fields are **never synchronized** to preserve pricing accuracy:

- `cost` (entire cost object)
- `input` (input cost)
- `output` (output cost)
- `inputCacheHit` (cache hit pricing)
- `imageGeneration` (image generation pricing)
- `videoGeneration` (video generation pricing)

### Example

If you have the same model (e.g., `gpt-4`) from multiple providers:

**OpenAI Provider:**

```json
{
    "id": "gpt-4",
    "name": "GPT-4",
    "cost": { "input": 0.03, "output": 0.06 },
    "description": null,
    "releaseDate": "2023-03-14"
}
```

**Azure Provider:**

```json
{
    "id": "gpt-4",
    "name": null,
    "cost": { "input": 0.03, "output": 0.06 },
    "description": "GPT-4 is a large multimodal model",
    "releaseDate": null
}
```

**Result after synchronization:**

```json
{
    "id": "gpt-4",
    "name": "GPT-4",
    "cost": { "input": 0.03, "output": 0.06 },
    "description": "GPT-4 is a large multimodal model",
    "releaseDate": "2023-03-14"
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Adding New Providers

1. Create a transformer in `scripts/download/transformers/`
2. Add provider configuration to `scripts/config.ts`
3. Run `pnpm run download --provider <provider-name>`
4. Test with `pnpm run aggregate`

### Reporting Issues

Please use our [Issue Tracker](https://github.com/anolilab/ai-models/issues) to report bugs or request features.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE.md) file for details.

## 🙏 Acknowledgments

- [Helicone](https://helicone.ai/) for providing pricing data
- [OpenRouter](https://openrouter.ai/) for reference data
- All the AI providers for their amazing models
- The open source community for inspiration and tools

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/anolilab/ai-models/wiki)
- **Issues**: [GitHub Issues](https://github.com/anolilab/ai-models/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anolilab/ai-models/discussions)
- **Email**: support@anolilab.com

---

Made with ❤️ by [AnoliLab](https://anolilab.com)
